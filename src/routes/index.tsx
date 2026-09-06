import { createFileRoute } from "@tanstack/react-router";
import {
	Archive,
	BarChart3,
	BookOpen,
	Check,
	ChevronRight,
	Download,
	Import,
	ListMusic,
	Play,
	RefreshCcw,
	RotateCcw,
	Settings,
	SkipForward,
	Sparkles,
	Timer,
} from "lucide-react";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { FretDiagram } from "#/components/FretDiagram";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { Label } from "#/components/ui/label.tsx";
import { Switch } from "#/components/ui/switch.tsx";
import {
	type AccidentalPreference,
	buildProgression,
	buildVoicing,
	chordInKeyDegrees,
	chordNotes,
	chordSymbol,
	type GeneratedChord,
	type GenerationMode,
	generatePracticeSet,
	getKeyDefinition,
	getVoicings,
	KEY_DEFINITIONS,
	type NeckZone,
	noteNameForPc,
	PROGRESSION_TEMPLATES,
	type PracticeSet,
	parseChordSymbol,
	QUALITY_DEFINITIONS,
	QUALITY_ORDER,
	type QualityId,
	ROOT_OPTIONS,
	SHAPE_FAMILIES,
	type ShapeFamily,
} from "#/lib/music";
import {
	type ConfidenceRating,
	clearPracticeSessions,
	createSessionId,
	exportPracticeData,
	loadPracticeSessions,
	type PracticeSession,
	parsePracticeImport,
	replacePracticeSessions,
	type StorageMode,
	savePracticeSession,
} from "#/lib/practice-storage";

export const Route = createFileRoute("/")({ component: Home });

type AppTab = "explore" | "progressions" | "practice" | "progress" | "settings";
type ContextMode = "absolute" | "key";
type ShapeChoice = ShapeFamily | "any";
type NotationPreference = "roman-arabic" | "arabic-first";

interface UserPrefs {
	accidentalPreference: AccidentalPreference;
	notationPreference: NotationPreference;
	leftHanded: boolean;
	showFingerings: boolean;
	defaultTimerMinutes: number;
	keyName: string;
	mode: GenerationMode;
	enabledQualities: QualityId[];
	allowedShapes: ShapeFamily[];
	neckZone: NeckZone;
	switchPractice: boolean;
}

interface CoverageItem {
	id: string;
	label: string;
	count: number;
	lastPracticed: string | null;
}

const PREFS_KEY = "kord.userPrefs";
const MAJOR_KEYS = KEY_DEFINITIONS.filter((key) => key.mode === "major");
const MINOR_KEYS = KEY_DEFINITIONS.filter((key) => key.mode === "minor");
const TIMER_PRESETS = [5, 10, 15];
const DEFAULT_PREFS: UserPrefs = {
	accidentalPreference: "smart",
	notationPreference: "roman-arabic",
	leftHanded: false,
	showFingerings: true,
	defaultTimerMinutes: 5,
	keyName: "random",
	mode: "strict",
	enabledQualities: ["major", "minor", "7", "maj7", "min7"],
	allowedShapes: ["C", "A", "G", "E", "D"],
	neckZone: "open",
	switchPractice: true,
};

function Home() {
	const [activeTab, setActiveTab] = useState<AppTab>("explore");
	const [prefs, setPrefs] = useState<UserPrefs>(DEFAULT_PREFS);
	const [sessions, setSessions] = useState<PracticeSession[]>([]);
	const [storageMode, setStorageMode] = useState<StorageMode>("memory");
	const [storageMessage, setStorageMessage] = useState(
		"Loading local practice history.",
	);

	const updatePrefs = useCallback((patch: Partial<UserPrefs>) => {
		setPrefs((current) => ({ ...current, ...patch }));
	}, []);

	useEffect(() => {
		const rawPrefs = window.localStorage.getItem(PREFS_KEY);

		if (!rawPrefs) {
			return;
		}

		try {
			setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(rawPrefs) });
		} catch {
			setStorageMessage(
				"Preferences could not be read, so defaults are active.",
			);
		}
	}, []);

	useEffect(() => {
		window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
	}, [prefs]);

	useEffect(() => {
		let cancelled = false;

		loadPracticeSessions().then((result) => {
			if (cancelled) {
				return;
			}

			setSessions(result.sessions);
			setStorageMode(result.mode);
			setStorageMessage(storageMessageForMode(result.mode));
		});

		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		if ("storage" in navigator && navigator.storage.persist) {
			navigator.storage.persist().catch(() => undefined);
		}

		if (import.meta.env.PROD && "serviceWorker" in navigator) {
			navigator.serviceWorker.register("/sw.js").catch(() => undefined);
		}
	}, []);

	const handleSaveSession = useCallback(async (session: PracticeSession) => {
		const mode = await savePracticeSession(session);
		setStorageMode(mode);
		setStorageMessage(storageMessageForMode(mode));
		setSessions((current) => [
			session,
			...current.filter((item) => item.id !== session.id),
		]);
		setActiveTab("progress");
	}, []);

	const handleReplaceSessions = useCallback(
		async (nextSessions: PracticeSession[]) => {
			const mode = await replacePracticeSessions(nextSessions);
			setStorageMode(mode);
			setStorageMessage(storageMessageForMode(mode));
			setSessions(nextSessions);
		},
		[],
	);

	const handleClearSessions = useCallback(async () => {
		const mode = await clearPracticeSessions();
		setStorageMode(mode);
		setStorageMessage(storageMessageForMode(mode));
		setSessions([]);
	}, []);

	return (
		<main className="app-shell">
			<header className="app-header">
				<div className="brand-lockup">
					<div className="brand-mark" aria-hidden="true">
						<img src="/logo.svg" alt="" width={48} height={48} />
					</div>
					<div>
						<p className="eyebrow">Local-first chord practice</p>
						<h1>Kord</h1>
					</div>
				</div>
				<nav className="app-tabs" aria-label="Main sections">
					<TabButton
						active={activeTab === "explore"}
						icon={BookOpen}
						label="Explore"
						onClick={() => setActiveTab("explore")}
					/>
					<TabButton
						active={activeTab === "progressions"}
						icon={ListMusic}
						label="Progressions"
						onClick={() => setActiveTab("progressions")}
					/>
					<TabButton
						active={activeTab === "practice"}
						icon={Timer}
						label="Practice"
						onClick={() => setActiveTab("practice")}
					/>
					<TabButton
						active={activeTab === "progress"}
						icon={BarChart3}
						label="Progress"
						onClick={() => setActiveTab("progress")}
					/>
					<TabButton
						active={activeTab === "settings"}
						icon={Settings}
						label="Settings"
						onClick={() => setActiveTab("settings")}
					/>
				</nav>
			</header>

			{activeTab === "explore" ? (
				<ExplorePage prefs={prefs} updatePrefs={updatePrefs} />
			) : null}
			{activeTab === "progressions" ? (
				<ProgressionsPage prefs={prefs} updatePrefs={updatePrefs} />
			) : null}
			{activeTab === "practice" ? (
				<PracticePage
					prefs={prefs}
					sessions={sessions}
					updatePrefs={updatePrefs}
					onSaveSession={handleSaveSession}
				/>
			) : null}
			{activeTab === "progress" ? (
				<ProgressPage sessions={sessions} prefs={prefs} />
			) : null}
			{activeTab === "settings" ? (
				<SettingsPage
					onClearSessions={handleClearSessions}
					onReplaceSessions={handleReplaceSessions}
					prefs={prefs}
					sessions={sessions}
					storageMessage={storageMessage}
					storageMode={storageMode}
					updatePrefs={updatePrefs}
				/>
			) : null}
		</main>
	);
}

function ExplorePage({
	prefs,
	updatePrefs,
}: {
	prefs: UserPrefs;
	updatePrefs: (patch: Partial<UserPrefs>) => void;
}) {
	const [rootPc, setRootPc] = useState(0);
	const [quality, setQuality] = useState<QualityId>("maj7");
	const [shapeChoice, setShapeChoice] = useState<ShapeChoice>("C");
	const [contextMode, setContextMode] = useState<ContextMode>("absolute");
	const [contextKey, setContextKey] = useState("G");
	const [aliasInput, setAliasInput] = useState("Cmaj7");
	const [aliasMessage, setAliasMessage] = useState(
		"Try aliases like Bb7, Em7, CΔ7, C- or Cø7.",
	);

	const keyContext = contextMode === "key" ? contextKey : undefined;
	const voicing = useMemo(() => {
		const shapes = shapeChoice === "any" ? SHAPE_FAMILIES : [shapeChoice];
		return (
			getVoicings(
				rootPc,
				quality,
				shapes,
				prefs.accidentalPreference,
				keyContext,
				"any",
			)[0] ??
			buildVoicing(rootPc, quality, "C", prefs.accidentalPreference, keyContext)
		);
	}, [keyContext, prefs.accidentalPreference, quality, rootPc, shapeChoice]);
	const symbol = chordSymbol(
		rootPc,
		quality,
		prefs.accidentalPreference,
		keyContext,
	);
	const notes = chordNotes(
		rootPc,
		quality,
		prefs.accidentalPreference,
		keyContext,
	);
	const inKeyDegrees = keyContext
		? chordInKeyDegrees(rootPc, quality, keyContext)
		: [];
	const key = keyContext ? getKeyDefinition(keyContext) : null;

	function normalizeAlias() {
		const parsed = parseChordSymbol(aliasInput);

		if (!parsed) {
			setAliasMessage(
				"That symbol is not supported yet. Try Cmaj7, Bb7, Em7, F#m7b5, Cmin or C-.",
			);
			return;
		}

		setRootPc(parsed.rootPc);
		setQuality(parsed.quality);
		setAliasMessage(
			`Normalized to ${chordSymbol(parsed.rootPc, parsed.quality, prefs.accidentalPreference)} (${QUALITY_DEFINITIONS[parsed.quality].label}).`,
		);
	}

	return (
		<section className="workspace-grid">
			<div className="panel control-panel">
				<div className="section-heading">
					<div>
						<p className="eyebrow">Chord Explorer</p>
						<h2>Shape, spelling, and function</h2>
					</div>
				</div>

				<div className="field-grid">
					<Field label="Root">
						<select
							className="control"
							value={rootPc}
							onChange={(event) => setRootPc(Number(event.target.value))}
						>
							{ROOT_OPTIONS.map((root) => (
								<option key={root.value} value={root.pc}>
									{root.label}
								</option>
							))}
						</select>
					</Field>
					<Field label="Quality">
						<select
							className="control"
							value={quality}
							onChange={(event) => setQuality(event.target.value as QualityId)}
						>
							{QUALITY_ORDER.map((qualityId) => (
								<option key={qualityId} value={qualityId}>
									{QUALITY_DEFINITIONS[qualityId].label}
								</option>
							))}
						</select>
					</Field>
					<Field label="CAGED family">
						<select
							className="control"
							value={shapeChoice}
							onChange={(event) =>
								setShapeChoice(event.target.value as ShapeChoice)
							}
						>
							<option value="any">Any shape</option>
							{SHAPE_FAMILIES.map((shape) => (
								<option key={shape} value={shape}>
									{shape} shape
								</option>
							))}
						</select>
					</Field>
				</div>

				<div className="alias-row">
					<Field label="Chord symbol parser">
						<Input
							value={aliasInput}
							onChange={(event) => setAliasInput(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									normalizeAlias();
								}
							}}
						/>
					</Field>
					<Button
						className="large-touch"
						type="button"
						onClick={normalizeAlias}
					>
						<RefreshCcw />
						Normalize
					</Button>
				</div>
				<p className="helper-text">{aliasMessage}</p>

				<fieldset className="segmented">
					<legend className="visually-hidden">Explorer mode</legend>
					<button
						className={contextMode === "absolute" ? "is-active" : ""}
						type="button"
						onClick={() => setContextMode("absolute")}
					>
						Absolute
					</button>
					<button
						className={contextMode === "key" ? "is-active" : ""}
						type="button"
						onClick={() => setContextMode("key")}
					>
						In key
					</button>
				</fieldset>

				{contextMode === "key" ? (
					<Field label="Key context">
						<select
							className="control"
							value={contextKey}
							onChange={(event) => setContextKey(event.target.value)}
						>
							<KeyOptions />
						</select>
					</Field>
				) : null}

				<div className="preference-strip">
					<span>Accidentals</span>
					<div className="mini-segmented">
						{(["smart", "sharps", "flats"] as AccidentalPreference[]).map(
							(preference) => (
								<button
									className={
										prefs.accidentalPreference === preference ? "is-active" : ""
									}
									key={preference}
									type="button"
									onClick={() =>
										updatePrefs({ accidentalPreference: preference })
									}
								>
									{preference}
								</button>
							),
						)}
					</div>
				</div>
			</div>

			<div className="panel chord-study-panel">
				<div className="chord-hero">
					<div>
						<p className="eyebrow">{voicing.shapeFamily}-shape family</p>
						<h2>{symbol}</h2>
						<p>
							{QUALITY_DEFINITIONS[quality].label} chord in{" "}
							{contextMode === "key" ? keyLabel(contextKey) : "absolute view"}
						</p>
					</div>
					<div className="symbol-badge">
						{noteNameForPc(rootPc, prefs.accidentalPreference, keyContext)}
					</div>
				</div>

				<div className="study-layout">
					<FretDiagram leftHanded={prefs.leftHanded} voicing={voicing} />
					<div className="relationship-stack">
						<InfoBlock
							label="Chord formula"
							values={QUALITY_DEFINITIONS[quality].formula}
						/>
						<InfoBlock label="Chord notes" values={notes} />
						<InfoBlock
							label="Selected family"
							values={[
								`${voicing.shapeFamily} shape`,
								`Avg fret ${voicing.avgFret.toFixed(1)}`,
							]}
						/>
						{key ? (
							<>
								<InfoBlock label={`${key.label} notes`} values={key.notes} />
								<InfoBlock label="In-key degrees" values={inKeyDegrees} />
							</>
						) : (
							<div className="empty-note">
								Choose In key to map the chord tones back to the number system
								of a major or minor key.
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}

function ProgressionsPage({
	prefs,
	updatePrefs,
}: {
	prefs: UserPrefs;
	updatePrefs: (patch: Partial<UserPrefs>) => void;
}) {
	const [keyName, setKeyName] = useState("C");
	const [templateId, setTemplateId] = useState(PROGRESSION_TEMPLATES[0].id);

	const key = getKeyDefinition(keyName) ?? KEY_DEFINITIONS[0];
	const templates = useMemo(
		() => PROGRESSION_TEMPLATES.filter((item) => item.keyMode === key.mode),
		[key.mode],
	);
	// Switching to a minor key swaps the whole list, so fall back to its first
	// entry rather than stranding the page on a major-key selection.
	const template =
		templates.find((item) => item.id === templateId) ?? templates[0];
	const styles = useMemo(
		() => Array.from(new Set(templates.map((item) => item.styleTag))),
		[templates],
	);
	const chords = useMemo(
		() =>
			buildProgression(
				template,
				keyName,
				prefs.accidentalPreference,
				prefs.neckZone,
			),
		[keyName, prefs.accidentalPreference, prefs.neckZone, template],
	);

	return (
		<section className="workspace-grid">
			<div className="panel control-panel">
				<div className="section-heading">
					<div>
						<p className="eyebrow">Progression builder</p>
						<h2>Pick a key and a progression</h2>
					</div>
				</div>

				<div className="field-grid">
					<Field label="Key">
						<select
							className="control"
							value={keyName}
							onChange={(event) => setKeyName(event.target.value)}
						>
							<KeyOptions />
						</select>
					</Field>
					<Field label="Neck position">
						<select
							className="control"
							value={prefs.neckZone}
							onChange={(event) =>
								updatePrefs({ neckZone: event.target.value as NeckZone })
							}
						>
							<option value="open">Open / low</option>
							<option value="mid">Middle</option>
							<option value="upper">Upper</option>
							<option value="any">Any</option>
						</select>
					</Field>
					<Field label="Progression">
						<select
							className="control"
							value={template.id}
							onChange={(event) => setTemplateId(event.target.value)}
						>
							{styles.map((style) => (
								<optgroup key={style} label={style}>
									{templates
										.filter((item) => item.styleTag === style)
										.map((item) => (
											<option key={item.id} value={item.id}>
												{item.name}
											</option>
										))}
								</optgroup>
							))}
						</select>
					</Field>
				</div>

				<p className="helper-text">{template.example}</p>

				<div className="switch-row">
					<div>
						<Label htmlFor="show-fingerings">Show finger placements</Label>
						<p className="helper-text">
							Turn this off to read the chords as symbols alone.
						</p>
					</div>
					<Switch
						checked={prefs.showFingerings}
						id="show-fingerings"
						onCheckedChange={(checked) =>
							updatePrefs({ showFingerings: checked })
						}
					/>
				</div>
			</div>

			<div className="panel chord-study-panel">
				<div className="chord-hero">
					<div>
						<p className="eyebrow">{template.styleTag}</p>
						<h2>{template.name}</h2>
						<p>
							{chords.map((chord) => chord.symbol).join("  \u00b7  ")} in{" "}
							{key.label}
						</p>
					</div>
					<div className="symbol-badge">{keyName}</div>
				</div>

				<div className="practice-chords progression-chords">
					{chords.map((chord, index) => (
						<PracticeChordCard
							chord={chord}
							index={index}
							key={chord.id}
							leftHanded={prefs.leftHanded}
							notationPreference={prefs.notationPreference}
							showDiagram={prefs.showFingerings}
						/>
					))}
				</div>
			</div>
		</section>
	);
}

function PracticePage({
	prefs,
	sessions,
	updatePrefs,
	onSaveSession,
}: {
	prefs: UserPrefs;
	sessions: PracticeSession[];
	updatePrefs: (patch: Partial<UserPrefs>) => void;
	onSaveSession: (session: PracticeSession) => Promise<void>;
}) {
	const [currentSet, setCurrentSet] = useState<PracticeSet | null>(null);
	const [generationError, setGenerationError] = useState<string | null>(null);
	const [timerSeconds, setTimerSeconds] = useState(
		prefs.defaultTimerMinutes * 60,
	);
	const [remainingSeconds, setRemainingSeconds] = useState(timerSeconds);
	const [timerRunning, setTimerRunning] = useState(false);
	const [timerComplete, setTimerComplete] = useState(false);
	const [bpm, setBpm] = useState("");
	const [confidence, setConfidence] = useState<ConfidenceRating>("steady");
	const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
		"idle",
	);
	const startedAtRef = useRef<string>(new Date().toISOString());

	const generateSet = useCallback(() => {
		const result = generatePracticeSet({
			keyName: prefs.keyName,
			mode: prefs.mode,
			enabledQualities: prefs.enabledQualities,
			allowedShapes: prefs.allowedShapes,
			neckZone: prefs.neckZone,
			switchPractice: prefs.switchPractice,
			accidentalPreference: prefs.accidentalPreference,
		});

		if (!result.ok) {
			setGenerationError(`${result.message} ${result.suggestion}`);
			setCurrentSet(null);
			return;
		}

		startedAtRef.current = new Date().toISOString();
		setCurrentSet(result.set);
		setGenerationError(null);
		setTimerSeconds(prefs.defaultTimerMinutes * 60);
		setRemainingSeconds(prefs.defaultTimerMinutes * 60);
		setTimerRunning(false);
		setTimerComplete(false);
		setSaveState("idle");
	}, [prefs]);

	useEffect(() => {
		generateSet();
	}, [generateSet]);

	useEffect(() => {
		if (!timerRunning) {
			return;
		}

		const id = window.setInterval(() => {
			setRemainingSeconds((current) => {
				if (current <= 1) {
					window.clearInterval(id);
					setTimerRunning(false);
					setTimerComplete(true);
					return 0;
				}

				return current - 1;
			});
		}, 1000);

		return () => window.clearInterval(id);
	}, [timerRunning]);

	function applyTimerPreset(minutes: number) {
		const seconds = minutes * 60;
		setTimerSeconds(seconds);
		setRemainingSeconds(seconds);
		setTimerRunning(false);
		setTimerComplete(false);
		updatePrefs({ defaultTimerMinutes: minutes });
	}

	function resetTimer() {
		setRemainingSeconds(timerSeconds);
		setTimerRunning(false);
		setTimerComplete(false);
	}

	async function saveSession() {
		if (!currentSet || !timerComplete) {
			return;
		}

		setSaveState("saving");
		const now = new Date().toISOString();
		const parsedBpm = bpm.trim() ? Number(bpm) : null;
		const session: PracticeSession = {
			id: createSessionId(),
			practiceSet: currentSet,
			startedAt: startedAtRef.current,
			endedAt: now,
			timerSeconds,
			bpm: parsedBpm && Number.isFinite(parsedBpm) ? parsedBpm : null,
			completed: true,
			confidence,
			notesCovered: currentSet.notesCovered,
			degreesCovered: currentSet.degreesCovered,
		};

		await onSaveSession(session);
		setSaveState("saved");
	}

	return (
		<section className="practice-shell">
			<div className="panel practice-control-panel">
				<div className="section-heading">
					<div>
						<p className="eyebrow">Four-chord generator</p>
						<h2>Curated loops, playable voicings</h2>
					</div>
					<Button className="large-touch" type="button" onClick={generateSet}>
						<Sparkles />
						Generate
					</Button>
				</div>

				<div className="field-grid">
					<Field label="Key">
						<select
							className="control"
							value={prefs.keyName}
							onChange={(event) => updatePrefs({ keyName: event.target.value })}
						>
							<option value="random">Random key</option>
							<KeyOptions />
						</select>
					</Field>
					<Field label="Mode">
						<select
							className="control"
							value={prefs.mode}
							onChange={(event) =>
								updatePrefs({ mode: event.target.value as GenerationMode })
							}
						>
							<option value="strict">Strict diatonic</option>
							<option value="blues">Blues color</option>
						</select>
					</Field>
					<Field label="Neck zone">
						<select
							className="control"
							value={prefs.neckZone}
							onChange={(event) =>
								updatePrefs({ neckZone: event.target.value as NeckZone })
							}
						>
							<option value="open">Open / low</option>
							<option value="mid">Middle</option>
							<option value="upper">Upper</option>
							<option value="any">Any</option>
						</select>
					</Field>
				</div>

				<ToggleGroup
					label="Chord qualities"
					options={QUALITY_ORDER.map((quality) => ({
						id: quality,
						label: QUALITY_DEFINITIONS[quality].shortLabel,
					}))}
					selected={prefs.enabledQualities}
					onToggle={(quality) =>
						updatePrefs({
							enabledQualities: toggleArrayValue(
								prefs.enabledQualities,
								quality as QualityId,
							),
						})
					}
				/>
				<ToggleGroup
					label="Allowed CAGED families"
					options={SHAPE_FAMILIES.map((shape) => ({ id: shape, label: shape }))}
					selected={prefs.allowedShapes}
					onToggle={(shape) =>
						updatePrefs({
							allowedShapes: toggleArrayValue(
								prefs.allowedShapes,
								shape as ShapeFamily,
							),
						})
					}
				/>

				<div className="switch-row">
					<div>
						<Label htmlFor="switch-practice">
							Switch-practice voicing chain
						</Label>
						<p className="helper-text">
							Scores nearby shapes, shared tones, and fret continuity.
						</p>
					</div>
					<Switch
						checked={prefs.switchPractice}
						id="switch-practice"
						onCheckedChange={(checked) =>
							updatePrefs({ switchPractice: checked })
						}
					/>
				</div>

				{generationError ? (
					<output className="status-banner is-error">{generationError}</output>
				) : null}
			</div>

			<div className="practice-stage">
				{currentSet ? (
					<>
						<div className="key-banner">
							<div>
								<p className="eyebrow">{currentSet.styleTag}</p>
								<h2>
									{keyLabel(currentSet.key)} · {currentSet.templateName}
								</h2>
							</div>
							<ul
								className="key-notes"
								aria-label={`${keyLabel(currentSet.key)} notes`}
							>
								{currentSet.keyNotes.map((note) => (
									<li key={note}>{note}</li>
								))}
							</ul>
						</div>

						<div className="practice-chords">
							{currentSet.generatedChords.map((chord, index) => (
								<PracticeChordCard
									chord={chord}
									index={index}
									key={chord.id}
									leftHanded={prefs.leftHanded}
									notationPreference={prefs.notationPreference}
								/>
							))}
						</div>

						<div className="panel timer-panel">
							<div className="timer-readout">
								<p className="eyebrow">Timed repetition</p>
								<strong aria-live="polite">
									{formatDuration(remainingSeconds)}
								</strong>
								<span>
									{timerComplete
										? "Timer complete"
										: timerRunning
											? "Running"
											: "Ready"}
								</span>
							</div>
							<div className="timer-controls">
								<fieldset className="timer-presets">
									<legend className="visually-hidden">Timer presets</legend>
									{TIMER_PRESETS.map((minutes) => (
										<button
											className={
												timerSeconds === minutes * 60 ? "is-active" : ""
											}
											key={minutes}
											type="button"
											onClick={() => applyTimerPreset(minutes)}
										>
											{minutes}m
										</button>
									))}
								</fieldset>
								<Button
									className="large-touch"
									type="button"
									onClick={() => setTimerRunning((current) => !current)}
								>
									<Play />
									{timerRunning ? "Pause" : "Start"}
								</Button>
								<Button
									className="large-touch"
									type="button"
									variant="outline"
									onClick={resetTimer}
								>
									<RotateCcw />
									Reset
								</Button>
								<Button
									className="large-touch"
									type="button"
									variant="outline"
									onClick={() => {
										setTimerRunning(false);
										setRemainingSeconds(0);
										setTimerComplete(true);
									}}
								>
									<Check />
									Mark complete
								</Button>
							</div>
							<div className="session-save-row">
								<Field label="BPM used externally">
									<Input
										inputMode="numeric"
										min={20}
										max={260}
										placeholder="Optional"
										type="number"
										value={bpm}
										onChange={(event) => setBpm(event.target.value)}
									/>
								</Field>
								<Field label="Confidence">
									<select
										className="control"
										value={confidence}
										onChange={(event) =>
											setConfidence(event.target.value as ConfidenceRating)
										}
									>
										<option value="easy">Easy</option>
										<option value="steady">Steady</option>
										<option value="hard">Hard</option>
									</select>
								</Field>
								<Button
									className="large-touch"
									disabled={!timerComplete || saveState === "saving"}
									type="button"
									onClick={saveSession}
								>
									<Archive />
									{saveState === "saving" ? "Saving" : "Save session"}
								</Button>
								<Button
									className="large-touch"
									type="button"
									variant="outline"
									onClick={generateSet}
								>
									<SkipForward />
									Skip set
								</Button>
							</div>
						</div>
					</>
				) : (
					<div className="panel empty-state">
						<p>No valid practice set is available with the current filters.</p>
						<Button type="button" onClick={generateSet}>
							<Sparkles />
							Try again
						</Button>
					</div>
				)}

				<PracticeMemory sessions={sessions} />
			</div>
		</section>
	);
}

function ProgressPage({
	sessions,
	prefs,
}: {
	sessions: PracticeSession[];
	prefs: UserPrefs;
}) {
	const summary = useMemo(() => buildCoverageSummary(sessions), [sessions]);
	const neverPracticed = [
		...summary.keys
			.filter((item) => item.count === 0)
			.map((item) => `Key: ${item.label}`),
		...summary.qualities
			.filter((item) => item.count === 0)
			.map((item) => `Quality: ${item.label}`),
		...summary.shapes
			.filter((item) => item.count === 0)
			.map((item) => `Shape: ${item.label}`),
	].slice(0, 8);
	const leastRecent = [...summary.keys, ...summary.qualities, ...summary.shapes]
		.filter((item) => item.count > 0)
		.sort((a, b) => {
			const aTime = a.lastPracticed ? new Date(a.lastPracticed).getTime() : 0;
			const bTime = b.lastPracticed ? new Date(b.lastPracticed).getTime() : 0;
			return aTime - bTime;
		})
		.slice(0, 6);

	return (
		<section className="progress-grid">
			<div className="panel progress-summary">
				<div className="section-heading">
					<div>
						<p className="eyebrow">Progress</p>
						<h2>Coverage over totals</h2>
					</div>
				</div>
				<div className="metric-grid">
					<MetricCard label="Completed sessions" value={`${sessions.length}`} />
					<MetricCard
						label="Keys touched"
						value={`${summary.keys.filter((item) => item.count > 0).length}/${summary.keys.length}`}
					/>
					<MetricCard
						label="Shapes touched"
						value={`${summary.shapes.filter((item) => item.count > 0).length}/5`}
					/>
					<MetricCard
						label="Notes covered"
						value={`${summary.notes.filter((item) => item.count > 0).length}/12`}
					/>
				</div>
				<div className="recommendation-box">
					<h3>Practice next</h3>
					{neverPracticed.length > 0 ? (
						<ul>
							{neverPracticed.map((item) => (
								<li key={item}>
									<ChevronRight />
									{item}
								</li>
							))}
						</ul>
					) : (
						<ul>
							{leastRecent.map((item) => (
								<li key={`${item.id}-${item.label}`}>
									<ChevronRight />
									{item.label} · last {formatRelativeDate(item.lastPracticed)}
								</li>
							))}
						</ul>
					)}
				</div>
			</div>

			<div className="panel">
				<h3>Keys covered</h3>
				<div className="key-grid">
					{summary.keys.map((item) => (
						<div
							className={item.count > 0 ? "key-cell is-covered" : "key-cell"}
							key={item.id}
						>
							<strong>{item.label}</strong>
							<span>{item.count}</span>
						</div>
					))}
				</div>
			</div>

			<div className="panel coverage-panel">
				<h3>Chord qualities</h3>
				<CoverageBars items={summary.qualities} />
			</div>

			<div className="panel coverage-panel">
				<h3>CAGED families</h3>
				<CoverageBars items={summary.shapes} />
			</div>

			<div className="panel coverage-panel">
				<h3>Pitch-class notes</h3>
				<CoverageBars items={summary.notes} />
			</div>

			<div className="panel recent-panel">
				<h3>Recent sessions</h3>
				{sessions.length > 0 ? (
					<div className="recent-list">
						{sessions.slice(0, 8).map((session) => (
							<div className="recent-row" key={session.id}>
								<div>
									<strong>
										{session.practiceSet.key} ·{" "}
										{session.practiceSet.templateName}
									</strong>
									<span>
										{session.practiceSet.generatedChords
											.map((chord) => chord.symbol)
											.join(" · ")}
									</span>
								</div>
								<div className="recent-meta">
									<span>{formatDate(session.endedAt)}</span>
									<span>
										{formatDuration(session.timerSeconds)} ·{" "}
										{session.confidence}
									</span>
									{session.bpm ? <span>{session.bpm} BPM</span> : null}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="empty-note">
						Save a completed practice timer to start building coverage.
					</div>
				)}
			</div>

			<div className="panel coverage-panel">
				<h3>Enabled but under-practiced</h3>
				<CoverageBars
					items={[
						...summary.qualities.filter((item) =>
							prefs.enabledQualities.includes(item.id as QualityId),
						),
						...summary.shapes.filter((item) =>
							prefs.allowedShapes.includes(item.id as ShapeFamily),
						),
					].sort((a, b) => a.count - b.count)}
				/>
			</div>
		</section>
	);
}

function SettingsPage({
	prefs,
	sessions,
	storageMode,
	storageMessage,
	updatePrefs,
	onReplaceSessions,
	onClearSessions,
}: {
	prefs: UserPrefs;
	sessions: PracticeSession[];
	storageMode: StorageMode;
	storageMessage: string;
	updatePrefs: (patch: Partial<UserPrefs>) => void;
	onReplaceSessions: (sessions: PracticeSession[]) => Promise<void>;
	onClearSessions: () => Promise<void>;
}) {
	const importRef = useRef<HTMLInputElement | null>(null);
	const [importMessage, setImportMessage] = useState("");

	function exportBackup() {
		const data = exportPracticeData(sessions);
		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `kord-practice-backup-${new Date().toISOString().slice(0, 10)}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}

	async function importBackup(file: File | undefined) {
		if (!file) {
			return;
		}

		try {
			const text = await file.text();
			const importedSessions = parsePracticeImport(text);
			await onReplaceSessions(importedSessions);
			setImportMessage(
				`Imported ${importedSessions.length} practice sessions.`,
			);
		} catch (error) {
			setImportMessage(
				error instanceof Error ? error.message : "Backup import failed.",
			);
		}
	}

	return (
		<section className="settings-grid">
			<div className="panel">
				<div className="section-heading">
					<div>
						<p className="eyebrow">Settings</p>
						<h2>Notation and practice defaults</h2>
					</div>
				</div>
				<div className="field-grid">
					<Field label="Accidental display">
						<select
							className="control"
							value={prefs.accidentalPreference}
							onChange={(event) =>
								updatePrefs({
									accidentalPreference: event.target
										.value as AccidentalPreference,
								})
							}
						>
							<option value="smart">Smart</option>
							<option value="sharps">Sharps</option>
							<option value="flats">Flats</option>
						</select>
					</Field>
					<Field label="Progression notation">
						<select
							className="control"
							value={prefs.notationPreference}
							onChange={(event) =>
								updatePrefs({
									notationPreference: event.target.value as NotationPreference,
								})
							}
						>
							<option value="roman-arabic">Roman, then Arabic</option>
							<option value="arabic-first">Arabic, then Roman</option>
						</select>
					</Field>
					<Field label="Default timer">
						<select
							className="control"
							value={prefs.defaultTimerMinutes}
							onChange={(event) =>
								updatePrefs({ defaultTimerMinutes: Number(event.target.value) })
							}
						>
							{TIMER_PRESETS.map((minutes) => (
								<option key={minutes} value={minutes}>
									{minutes} minutes
								</option>
							))}
						</select>
					</Field>
				</div>
				<div className="switch-row">
					<div>
						<Label htmlFor="left-handed">Left-handed diagram mirroring</Label>
						<p className="helper-text">
							Mirrors string order while preserving chord spelling and fret
							data.
						</p>
					</div>
					<Switch
						checked={prefs.leftHanded}
						id="left-handed"
						onCheckedChange={(checked) => updatePrefs({ leftHanded: checked })}
					/>
				</div>
			</div>

			<div className="panel storage-panel">
				<div className="section-heading">
					<div>
						<p className="eyebrow">Local storage</p>
						<h2>
							{storageMode === "indexeddb"
								? "IndexedDB active"
								: "Fallback storage active"}
						</h2>
					</div>
				</div>
				<p className="storage-message">{storageMessage}</p>
				<div className="storage-actions">
					<Button className="large-touch" type="button" onClick={exportBackup}>
						<Download />
						Export backup
					</Button>
					<Button
						className="large-touch"
						type="button"
						variant="outline"
						onClick={() => importRef.current?.click()}
					>
						<Import />
						Import backup
					</Button>
					<Button
						className="large-touch"
						type="button"
						variant="outline"
						onClick={onClearSessions}
					>
						<RotateCcw />
						Clear history
					</Button>
				</div>
				<input
					accept="application/json"
					className="visually-hidden"
					ref={importRef}
					type="file"
					onChange={(event) => importBackup(event.target.files?.[0])}
				/>
				{importMessage ? <p className="helper-text">{importMessage}</p> : null}
			</div>
		</section>
	);
}

function PracticeChordCard({
	chord,
	index,
	leftHanded,
	notationPreference,
	showDiagram = true,
}: {
	chord: GeneratedChord;
	index: number;
	leftHanded: boolean;
	notationPreference: NotationPreference;
	showDiagram?: boolean;
}) {
	const primaryDegree =
		notationPreference === "arabic-first"
			? `${chord.arabicDegree} / ${chord.roman}`
			: `${chord.roman} / ${chord.arabicDegree}`;

	return (
		<article className="practice-card">
			<div className="practice-card__header">
				<span className="step-index">{index + 1}</span>
				<div>
					<p>{primaryDegree}</p>
					<h3>{chord.symbol}</h3>
				</div>
				<span className="shape-pill">{chord.shapeFamily}</span>
			</div>
			{showDiagram ? (
				<FretDiagram compact leftHanded={leftHanded} voicing={chord.voicing} />
			) : null}
			<div className="card-facts">
				<InfoBlock compact label="Formula" values={chord.formula} />
				<InfoBlock compact label="Notes" values={chord.notes} />
				<InfoBlock compact label="In key" values={chord.inKeyDegrees} />
			</div>
		</article>
	);
}

function PracticeMemory({ sessions }: { sessions: PracticeSession[] }) {
	const lastSession = sessions[0];

	return (
		<div className="panel memory-panel">
			<div>
				<p className="eyebrow">Practice memory</p>
				<h3>{lastSession ? "Last saved session" : "No saved sessions yet"}</h3>
			</div>
			{lastSession ? (
				<p>
					{keyLabel(lastSession.practiceSet.key)} ·{" "}
					{lastSession.practiceSet.templateName} ·{" "}
					{formatDuration(lastSession.timerSeconds)}
				</p>
			) : (
				<p>
					Complete and save a timer to update key, chord-quality, shape, degree,
					and note coverage.
				</p>
			)}
		</div>
	);
}

function KeyOptions() {
	return (
		<>
			<optgroup label="Major">
				{MAJOR_KEYS.map((key) => (
					<option key={key.name} value={key.name}>
						{key.label}
					</option>
				))}
			</optgroup>
			<optgroup label="Minor">
				{MINOR_KEYS.map((key) => (
					<option key={key.name} value={key.name}>
						{key.label}
					</option>
				))}
			</optgroup>
		</>
	);
}

function keyLabel(name: string) {
	return getKeyDefinition(name)?.label ?? name;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="field">
			<span>{label}</span>
			{children}
		</div>
	);
}

function InfoBlock({
	label,
	values,
	compact = false,
}: {
	label: string;
	values: string[];
	compact?: boolean;
}) {
	return (
		<div className={compact ? "info-block is-compact" : "info-block"}>
			<span>{label}</span>
			<div>
				{values.map((value) => (
					<b key={value}>{value}</b>
				))}
			</div>
		</div>
	);
}

function ToggleGroup({
	label,
	options,
	selected,
	onToggle,
}: {
	label: string;
	options: Array<{ id: string; label: string }>;
	selected: string[];
	onToggle: (id: string) => void;
}) {
	return (
		<div className="toggle-group">
			<span>{label}</span>
			<div>
				{options.map((option) => (
					<button
						aria-pressed={selected.includes(option.id)}
						className={selected.includes(option.id) ? "is-active" : ""}
						key={option.id}
						type="button"
						onClick={() => onToggle(option.id)}
					>
						{option.label}
					</button>
				))}
			</div>
		</div>
	);
}

function TabButton({
	active,
	icon: Icon,
	label,
	onClick,
}: {
	active: boolean;
	icon: typeof BookOpen;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			aria-current={active ? "page" : undefined}
			aria-label={label}
			aria-pressed={active}
			className={active ? "tab-button is-active" : "tab-button"}
			title={label}
			type="button"
			onClick={onClick}
		>
			<Icon />
			<span>{label}</span>
		</button>
	);
}

function MetricCard({ label, value }: { label: string; value: string }) {
	return (
		<div className="metric-card">
			<span>{label}</span>
			<strong>{value}</strong>
		</div>
	);
}

function CoverageBars({ items }: { items: CoverageItem[] }) {
	const max = Math.max(1, ...items.map((item) => item.count));

	return (
		<div className="coverage-bars">
			{items.map((item) => (
				<div className="coverage-row" key={`${item.id}-${item.label}`}>
					<div>
						<strong>{item.label}</strong>
						<span>{item.count} sessions</span>
					</div>
					<div className="coverage-track" aria-hidden="true">
						<span
							style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }}
						/>
					</div>
					<small>{formatRelativeDate(item.lastPracticed)}</small>
				</div>
			))}
		</div>
	);
}

function buildCoverageSummary(sessions: PracticeSession[]) {
	const keys = seedCoverage(
		KEY_DEFINITIONS.map((key) => ({ id: key.name, label: `${key.name}` })),
	);
	const qualities = seedCoverage(
		QUALITY_ORDER.map((quality) => ({
			id: quality,
			label: QUALITY_DEFINITIONS[quality].shortLabel,
		})),
	);
	const shapes = seedCoverage(
		SHAPE_FAMILIES.map((shape) => ({ id: shape, label: `${shape} shape` })),
	);
	const notes = seedCoverage(
		ROOT_OPTIONS.map((root) => ({
			id: root.value,
			label: noteNameForPc(root.pc, "smart"),
		})),
	);
	const degrees = seedCoverage(
		["1", "2", "3", "4", "5", "6", "7", "b7", "b5"].map((degree) => ({
			id: degree,
			label: degree,
		})),
	);
	const templates = seedCoverage(
		PROGRESSION_TEMPLATES.map((template) => ({
			id: template.id,
			label: template.name,
		})),
	);

	for (const session of sessions) {
		increment(keys, session.practiceSet.key, session.endedAt);
		increment(templates, session.practiceSet.templateId, session.endedAt);

		for (const chord of session.practiceSet.generatedChords) {
			increment(qualities, chord.quality, session.endedAt);
			increment(shapes, chord.shapeFamily, session.endedAt);
		}

		for (const note of session.notesCovered) {
			const pc = ROOT_OPTIONS.find(
				(root) =>
					noteNameForPc(root.pc, "smart") === note ||
					noteNameForPc(root.pc, "flats") === note ||
					noteNameForPc(root.pc, "sharps") === note,
			);
			if (pc) {
				increment(notes, pc.value, session.endedAt);
			}
		}

		for (const degree of session.degreesCovered) {
			increment(degrees, degree, session.endedAt);
		}
	}

	return {
		keys: Array.from(keys.values()),
		qualities: Array.from(qualities.values()),
		shapes: Array.from(shapes.values()),
		notes: Array.from(notes.values()),
		degrees: Array.from(degrees.values()),
		templates: Array.from(templates.values()),
	};
}

function seedCoverage(items: Array<{ id: string; label: string }>) {
	return new Map<string, CoverageItem>(
		items.map((item) => [
			item.id,
			{
				id: item.id,
				label: item.label,
				count: 0,
				lastPracticed: null,
			},
		]),
	);
}

function increment(map: Map<string, CoverageItem>, id: string, date: string) {
	const item = map.get(id);

	if (!item) {
		return;
	}

	item.count += 1;
	item.lastPracticed = mostRecent(item.lastPracticed, date);
}

function mostRecent(a: string | null, b: string) {
	if (!a) {
		return b;
	}

	return new Date(a).getTime() > new Date(b).getTime() ? a : b;
}

function toggleArrayValue<T extends string>(values: T[], value: T) {
	return values.includes(value)
		? values.filter((item) => item !== value)
		: [...values, value];
}

function formatDuration(totalSeconds: number) {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDate(value: string) {
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(value));
}

function formatRelativeDate(value: string | null) {
	if (!value) {
		return "not yet";
	}

	const days = Math.floor(
		(Date.now() - new Date(value).getTime()) / 86_400_000,
	);

	if (days <= 0) {
		return "today";
	}

	if (days === 1) {
		return "yesterday";
	}

	return `${days} days ago`;
}

function storageMessageForMode(mode: StorageMode) {
	if (mode === "indexeddb") {
		return "Practice sessions are stored locally in IndexedDB. Export a backup before clearing browser data.";
	}

	if (mode === "localstorage") {
		return "IndexedDB was unavailable, so sessions are using localStorage fallback.";
	}

	return "Browser persistence is unavailable. Sessions are held in memory until this page closes.";
}
