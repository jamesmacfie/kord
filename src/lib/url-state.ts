import {
	CAGED_FAMILIES,
	type CagedFamily,
	chordSymbol,
	getKeyDefinition,
	type KeyMode,
	NECK_STRING_SETS,
	type NeckStrings,
	noteNameForPc,
	PROGRESSION_TEMPLATES,
	parseChordSymbol,
	type QualityId,
	ROUTINE_VIEWS,
	type RoutineView,
	SHAPE_FAMILIES,
	type ShapeFamily,
	type TriadInversion,
} from "#/lib/music";

// The URL carries what is on screen, so a refresh or a shared link lands on the
// same view. Every value is a short readable token, and a value at its default
// stays out of the URL. Unknown or malformed values drop out silently, which
// leaves that option at its default rather than breaking the page.

export const APP_TABS = [
	"explore",
	"progressions",
	"routine",
	"practice",
	"progress",
	"settings",
] as const;
export type AppTab = (typeof APP_TABS)[number];
export type ShapeChoice = ShapeFamily | "any";
export type NeckLabel = "degree" | "note";

export interface AppSearch {
	tab?: AppTab;
	/** Explore: chord symbol, shape, and key context. */
	chord?: string;
	shape?: ShapeChoice;
	in?: string;
	/** Progressions: key and template. */
	pkey?: string;
	prog?: string;
	/** Routine. */
	key?: string;
	mode?: KeyMode;
	view?: RoutineView;
	triads?: string;
	inversion?: InversionToken;
	thirds?: string;
	sixths?: string;
	labels?: LabelToken;
	shapes?: string;
	all?: boolean;
}

export interface RoutineState {
	tonicPc: number;
	mode: KeyMode;
	view: RoutineView;
	triadStrings: NeckStrings;
	triadInversion: TriadInversion;
	thirdStrings: number;
	sixthStrings: number;
	noteLabel: NeckLabel;
	shapes: CagedFamily[];
	showAll: boolean;
}

export const DEFAULT_ROUTINE: RoutineState = {
	tonicPc: 2,
	mode: "minor",
	view: "chord-tones",
	triadStrings: "all",
	triadInversion: 0,
	thirdStrings: 4,
	sixthStrings: 3,
	noteLabel: "degree",
	shapes: CAGED_FAMILIES,
	showAll: false,
};

export const DEFAULT_CHORD = { rootPc: 0, quality: "maj7" as QualityId };
export const DEFAULT_SHAPE: ShapeChoice = "C";
export const DEFAULT_PROGRESSION_KEY = "C";

const INVERSION_TOKENS = ["root", "1st", "2nd"] as const;
type InversionToken = (typeof INVERSION_TOKENS)[number];
const LABEL_TOKENS = ["intervals", "notes"] as const;
type LabelToken = (typeof LABEL_TOKENS)[number];
const STRING_GAPS = { triads: 2, thirds: 1, sixths: 2 } as const;
const ROUTINE_KEYS = [
	"key",
	"mode",
	"view",
	"triads",
	"inversion",
	"thirds",
	"sixths",
	"labels",
	"shapes",
	"all",
] as const;

/** Router hook: keep the search params that parse, drop the rest. */
export function validateAppSearch(raw: Record<string, unknown>): AppSearch {
	const search: AppSearch = {
		tab: oneOf(raw.tab, APP_TABS),
		chord: chordToken(raw.chord),
		shape: oneOf(raw.shape, [...SHAPE_FAMILIES, "any"] as const),
		in: keyToken(raw.in),
		pkey: keyToken(raw.pkey),
		prog: oneOf(
			raw.prog,
			PROGRESSION_TEMPLATES.map((template) => template.id),
		),
		key: noteToken(raw.key),
		mode: oneOf(raw.mode, ["major", "minor"] as const),
		view: oneOf(
			raw.view,
			ROUTINE_VIEWS.map((view) => view.id),
		),
		triads:
			text(raw.triads) === "all" ? "all" : stringSetToken(raw.triads, "triads"),
		inversion: oneOf(raw.inversion, INVERSION_TOKENS),
		thirds: stringSetToken(raw.thirds, "thirds"),
		sixths: stringSetToken(raw.sixths, "sixths"),
		labels: oneOf(raw.labels, LABEL_TOKENS),
		shapes: shapesToken(raw.shapes),
		all: raw.all === true || raw.all === "true" ? true : undefined,
	};

	return Object.fromEntries(
		Object.entries(search).filter(([, value]) => value !== undefined),
	) as AppSearch;
}

export function hasRoutineParams(search: AppSearch) {
	return ROUTINE_KEYS.some((key) => search[key] !== undefined);
}

export function chordFromSearch(search: AppSearch) {
	const parsed = search.chord ? parseChordSymbol(search.chord) : null;
	return parsed
		? { rootPc: parsed.rootPc, quality: parsed.quality }
		: DEFAULT_CHORD;
}

export function chordToSearch(rootPc: number, quality: QualityId) {
	const isDefault =
		rootPc === DEFAULT_CHORD.rootPc && quality === DEFAULT_CHORD.quality;
	return isDefault ? undefined : chordSymbol(rootPc, quality, "flats");
}

export function routineFromSearch(
	search: AppSearch,
	fallback: RoutineState = DEFAULT_ROUTINE,
): RoutineState {
	// With no routine params at all, the last routine stands in for the
	// defaults. With any, the URL is the whole story and gaps mean defaults.
	const base = hasRoutineParams(search) ? DEFAULT_ROUTINE : fallback;
	const key = search.key ? parseChordSymbol(search.key) : null;

	return {
		tonicPc: key?.rootPc ?? base.tonicPc,
		mode: search.mode ?? base.mode,
		view: search.view ?? base.view,
		triadStrings:
			search.triads === "all"
				? "all"
				: (stringSetFromToken(search.triads, "triads") ?? base.triadStrings),
		triadInversion: search.inversion
			? (INVERSION_TOKENS.indexOf(search.inversion) as TriadInversion)
			: base.triadInversion,
		thirdStrings:
			stringSetFromToken(search.thirds, "thirds") ?? base.thirdStrings,
		sixthStrings:
			stringSetFromToken(search.sixths, "sixths") ?? base.sixthStrings,
		noteLabel: search.labels
			? search.labels === "notes"
				? "note"
				: "degree"
			: base.noteLabel,
		shapes:
			search.shapes === undefined
				? base.shapes
				: CAGED_FAMILIES.filter((shape) => search.shapes?.includes(shape)),
		showAll: search.all ?? base.showAll,
	};
}

export function routineToSearch(routine: RoutineState): AppSearch {
	const d = DEFAULT_ROUTINE;
	const unless = <T>(same: boolean, value: T) => (same ? undefined : value);

	return {
		key: unless(
			routine.tonicPc === d.tonicPc,
			noteNameForPc(routine.tonicPc, "flats"),
		),
		mode: unless(routine.mode === d.mode, routine.mode),
		view: unless(routine.view === d.view, routine.view),
		triads: unless(
			routine.triadStrings === d.triadStrings,
			routine.triadStrings === "all"
				? "all"
				: stringSetToToken(routine.triadStrings, "triads"),
		),
		inversion: unless(
			routine.triadInversion === d.triadInversion,
			INVERSION_TOKENS[routine.triadInversion],
		),
		thirds: unless(
			routine.thirdStrings === d.thirdStrings,
			stringSetToToken(routine.thirdStrings, "thirds"),
		),
		sixths: unless(
			routine.sixthStrings === d.sixthStrings,
			stringSetToToken(routine.sixthStrings, "sixths"),
		),
		labels: unless(
			routine.noteLabel === d.noteLabel,
			routine.noteLabel === "note" ? "notes" : "intervals",
		),
		shapes: unless(
			routine.shapes.length === CAGED_FAMILIES.length,
			routine.shapes.length > 0 ? routine.shapes.join("") : "none",
		),
		all: routine.showAll ? true : undefined,
	};
}

/** String sets read as guitarists count them, high e first: "1-3". */
function stringSetToToken(low: number, kind: keyof typeof STRING_GAPS) {
	return `${6 - (low + STRING_GAPS[kind])}-${6 - low}`;
}

function stringSetFromToken(
	token: string | undefined,
	kind: keyof typeof STRING_GAPS,
) {
	return NECK_STRING_SETS[kind].find(
		(low) => stringSetToToken(low, kind) === token,
	);
}

function stringSetToken(value: unknown, kind: keyof typeof STRING_GAPS) {
	const token = text(value);
	return stringSetFromToken(token, kind) === undefined ? undefined : token;
}

function shapesToken(value: unknown) {
	const token = text(value);

	if (token === "none") {
		return token;
	}

	return token && /^[CAGED]+$/.test(token) ? token : undefined;
}

function chordToken(value: unknown) {
	const token = text(value);
	return token && parseChordSymbol(token) ? token : undefined;
}

function noteToken(value: unknown) {
	const token = text(value);
	return token && parseChordSymbol(token)?.quality === "major"
		? token
		: undefined;
}

function keyToken(value: unknown) {
	const token = text(value);
	return token && getKeyDefinition(token) ? token : undefined;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]) {
	const token = text(value);
	return token !== undefined && (allowed as readonly string[]).includes(token)
		? (token as T)
		: undefined;
}

// The router JSON-parses search values, so a bare number arrives as a number.
function text(value: unknown) {
	if (typeof value === "string") {
		return value;
	}

	return typeof value === "number" ? String(value) : undefined;
}
