export type AccidentalPreference = "smart" | "sharps" | "flats";
export type GenerationMode = "strict" | "blues";
export type NeckZone = "any" | "open" | "mid" | "upper";
export type ShapeFamily = "C" | "A" | "G" | "E" | "D";
export type QualityId =
	| "major"
	| "minor"
	| "7"
	| "maj7"
	| "min7"
	| "diminished"
	| "half-diminished";

export interface QualityDefinition {
	id: QualityId;
	label: string;
	shortLabel: string;
	suffix: string;
	formula: string[];
	intervals: number[];
	family: "major" | "minor" | "dominant" | "diminished";
}

export interface KeyDefinition {
	name: string;
	tonicPc: number;
	notes: string[];
}

export interface NoteOption {
	pc: number;
	label: string;
	value: string;
}

export interface BarreInfo {
	fret: number;
	fromString: number;
	toString: number;
	finger: string;
}

export interface VoicedString {
	stringIndex: number;
	fret: number;
	note: string;
	notePc: number;
	interval: string;
	finger: string;
}

export interface ChordVoicing {
	id: string;
	rootPc: number;
	root: string;
	quality: QualityId;
	qualityLabel: string;
	symbol: string;
	shapeFamily: ShapeFamily;
	baseFret: number;
	frets: number[];
	fingers: string[];
	barres: BarreInfo[];
	strings: VoicedString[];
	notes: string[];
	intervals: string[];
	avgFret: number;
	fretSpan: number;
	difficulty: number;
}

export interface GeneratedChord {
	id: string;
	degree: number;
	roman: string;
	arabicDegree: string;
	symbol: string;
	root: string;
	rootPc: number;
	quality: QualityId;
	qualityLabel: string;
	shapeFamily: ShapeFamily;
	formula: string[];
	notes: string[];
	inKeyDegrees: string[];
	voicing: ChordVoicing;
}

export interface ProgressionTemplate {
	id: string;
	name: string;
	mode: GenerationMode;
	romanDegrees: number[];
	allowsRepeats: boolean;
	styleTag: string;
	weight: number;
}

export interface PracticeSet {
	id: string;
	key: string;
	mode: GenerationMode;
	templateId: string;
	templateName: string;
	styleTag: string;
	createdAt: string;
	neckZone: NeckZone;
	switchPractice: boolean;
	keyNotes: string[];
	generatedChords: GeneratedChord[];
	notesCovered: string[];
	degreesCovered: string[];
}

export interface GeneratorPrefs {
	keyName: string;
	mode: GenerationMode;
	enabledQualities: QualityId[];
	allowedShapes: ShapeFamily[];
	neckZone: NeckZone;
	switchPractice: boolean;
	accidentalPreference: AccidentalPreference;
}

export type GenerationResult =
	| { ok: true; set: PracticeSet }
	| { ok: false; message: string; suggestion: string };

interface VoicingTemplate {
	frets: number[];
	fingers: string[];
}

interface ShapeTemplate {
	baseRootPc: number;
	qualities: Record<QualityId, VoicingTemplate>;
}

const SHARP_NAMES = [
	"C",
	"C#",
	"D",
	"D#",
	"E",
	"F",
	"F#",
	"G",
	"G#",
	"A",
	"A#",
	"B",
];
const FLAT_NAMES = [
	"C",
	"Db",
	"D",
	"Eb",
	"E",
	"F",
	"Gb",
	"G",
	"Ab",
	"A",
	"Bb",
	"B",
];
const FLAT_LEANING_PCS = new Set([1, 3, 8, 10]);
const STRING_TUNING = [4, 9, 2, 7, 11, 4];

const NOTE_TO_PC: Record<string, number> = {
	C: 0,
	"B#": 0,
	"C#": 1,
	Db: 1,
	D: 2,
	"D#": 3,
	Eb: 3,
	E: 4,
	Fb: 4,
	"E#": 5,
	F: 5,
	"F#": 6,
	Gb: 6,
	G: 7,
	"G#": 8,
	Ab: 8,
	A: 9,
	"A#": 10,
	Bb: 10,
	B: 11,
	Cb: 11,
};

export const SHAPE_FAMILIES: ShapeFamily[] = ["C", "A", "G", "E", "D"];

export const ROOT_OPTIONS: NoteOption[] = [
	{ pc: 0, label: "C", value: "0" },
	{ pc: 1, label: "C# / Db", value: "1" },
	{ pc: 2, label: "D", value: "2" },
	{ pc: 3, label: "D# / Eb", value: "3" },
	{ pc: 4, label: "E", value: "4" },
	{ pc: 5, label: "F", value: "5" },
	{ pc: 6, label: "F# / Gb", value: "6" },
	{ pc: 7, label: "G", value: "7" },
	{ pc: 8, label: "G# / Ab", value: "8" },
	{ pc: 9, label: "A", value: "9" },
	{ pc: 10, label: "A# / Bb", value: "10" },
	{ pc: 11, label: "B", value: "11" },
];

export const KEY_DEFINITIONS: KeyDefinition[] = [
	{ name: "C", tonicPc: 0, notes: ["C", "D", "E", "F", "G", "A", "B"] },
	{ name: "G", tonicPc: 7, notes: ["G", "A", "B", "C", "D", "E", "F#"] },
	{ name: "D", tonicPc: 2, notes: ["D", "E", "F#", "G", "A", "B", "C#"] },
	{ name: "A", tonicPc: 9, notes: ["A", "B", "C#", "D", "E", "F#", "G#"] },
	{ name: "E", tonicPc: 4, notes: ["E", "F#", "G#", "A", "B", "C#", "D#"] },
	{ name: "B", tonicPc: 11, notes: ["B", "C#", "D#", "E", "F#", "G#", "A#"] },
	{ name: "F#", tonicPc: 6, notes: ["F#", "G#", "A#", "B", "C#", "D#", "E#"] },
	{ name: "Db", tonicPc: 1, notes: ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"] },
	{ name: "Ab", tonicPc: 8, notes: ["Ab", "Bb", "C", "Db", "Eb", "F", "G"] },
	{ name: "Eb", tonicPc: 3, notes: ["Eb", "F", "G", "Ab", "Bb", "C", "D"] },
	{ name: "Bb", tonicPc: 10, notes: ["Bb", "C", "D", "Eb", "F", "G", "A"] },
	{ name: "F", tonicPc: 5, notes: ["F", "G", "A", "Bb", "C", "D", "E"] },
];

export const QUALITY_DEFINITIONS: Record<QualityId, QualityDefinition> = {
	major: {
		id: "major",
		label: "Major",
		shortLabel: "Maj",
		suffix: "",
		formula: ["1", "3", "5"],
		intervals: [0, 4, 7],
		family: "major",
	},
	minor: {
		id: "minor",
		label: "Minor",
		shortLabel: "Min",
		suffix: "m",
		formula: ["1", "b3", "5"],
		intervals: [0, 3, 7],
		family: "minor",
	},
	"7": {
		id: "7",
		label: "Dominant 7",
		shortLabel: "7",
		suffix: "7",
		formula: ["1", "3", "5", "b7"],
		intervals: [0, 4, 7, 10],
		family: "dominant",
	},
	maj7: {
		id: "maj7",
		label: "Major 7",
		shortLabel: "Maj7",
		suffix: "maj7",
		formula: ["1", "3", "5", "7"],
		intervals: [0, 4, 7, 11],
		family: "major",
	},
	min7: {
		id: "min7",
		label: "Minor 7",
		shortLabel: "Min7",
		suffix: "m7",
		formula: ["1", "b3", "5", "b7"],
		intervals: [0, 3, 7, 10],
		family: "minor",
	},
	diminished: {
		id: "diminished",
		label: "Diminished",
		shortLabel: "Dim",
		suffix: "dim",
		formula: ["1", "b3", "b5"],
		intervals: [0, 3, 6],
		family: "diminished",
	},
	"half-diminished": {
		id: "half-diminished",
		label: "Half-diminished 7",
		shortLabel: "m7b5",
		suffix: "m7b5",
		formula: ["1", "b3", "b5", "b7"],
		intervals: [0, 3, 6, 10],
		family: "diminished",
	},
};

export const QUALITY_ORDER: QualityId[] = [
	"major",
	"minor",
	"7",
	"maj7",
	"min7",
	"diminished",
	"half-diminished",
];

export const PROGRESSION_TEMPLATES: ProgressionTemplate[] = [
	{
		id: "pop-axis",
		name: "I-V-vi-IV",
		mode: "strict",
		romanDegrees: [1, 5, 6, 4],
		allowsRepeats: false,
		styleTag: "Pop",
		weight: 10,
	},
	{
		id: "pop-reverse-start",
		name: "vi-IV-I-V",
		mode: "strict",
		romanDegrees: [6, 4, 1, 5],
		allowsRepeats: false,
		styleTag: "Pop reverse start",
		weight: 8,
	},
	{
		id: "doo-wop",
		name: "I-vi-IV-V",
		mode: "strict",
		romanDegrees: [1, 6, 4, 5],
		allowsRepeats: false,
		styleTag: "Doo-wop family",
		weight: 7,
	},
	{
		id: "cadential-jazz-pop",
		name: "ii-V-I-vi",
		mode: "strict",
		romanDegrees: [2, 5, 1, 6],
		allowsRepeats: false,
		styleTag: "Cadential jazz/pop",
		weight: 6,
	},
	{
		id: "circle-motion",
		name: "vi-ii-V-I",
		mode: "strict",
		romanDegrees: [6, 2, 5, 1],
		allowsRepeats: false,
		styleTag: "Circle motion",
		weight: 6,
	},
	{
		id: "blues-turnaround",
		name: "I7-IV7-I7-V7",
		mode: "blues",
		romanDegrees: [1, 4, 1, 5],
		allowsRepeats: true,
		styleTag: "Blues color",
		weight: 7,
	},
	{
		id: "blues-walk-home",
		name: "I7-IV7-V7-I7",
		mode: "blues",
		romanDegrees: [1, 4, 5, 1],
		allowsRepeats: true,
		styleTag: "Blues color",
		weight: 5,
	},
];

const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];

const STRICT_QUALITY_CANDIDATES: Record<number, QualityId[]> = {
	1: ["major", "maj7"],
	2: ["minor", "min7"],
	3: ["minor", "min7"],
	4: ["major", "maj7"],
	5: ["major", "7"],
	6: ["minor", "min7"],
	7: ["diminished", "half-diminished"],
};

const BLUES_QUALITY_CANDIDATES: Record<number, QualityId[]> = {
	1: ["7", "major"],
	2: ["minor", "min7"],
	3: ["minor", "min7"],
	4: ["7", "major"],
	5: ["7", "major"],
	6: ["minor", "min7"],
	7: ["diminished", "half-diminished"],
};

const SHAPE_TEMPLATES: Record<ShapeFamily, ShapeTemplate> = {
	C: {
		baseRootPc: 0,
		qualities: {
			major: {
				frets: [-1, 3, 2, 0, 1, 0],
				fingers: ["", "3", "2", "", "1", ""],
			},
			minor: {
				frets: [-1, 3, 1, 0, 1, -1],
				fingers: ["", "3", "1", "", "2", ""],
			},
			"7": {
				frets: [-1, 3, 2, 3, 1, 0],
				fingers: ["", "3", "2", "4", "1", ""],
			},
			maj7: { frets: [-1, 3, 2, 0, 0, 0], fingers: ["", "3", "2", "", "", ""] },
			min7: {
				frets: [-1, 3, 1, 3, 1, -1],
				fingers: ["", "3", "1", "4", "1", ""],
			},
			diminished: {
				frets: [-1, 3, 4, 5, 4, -1],
				fingers: ["", "1", "2", "4", "3", ""],
			},
			"half-diminished": {
				frets: [-1, 3, 4, 3, 4, -1],
				fingers: ["", "1", "3", "1", "4", ""],
			},
		},
	},
	A: {
		baseRootPc: 9,
		qualities: {
			major: {
				frets: [-1, 0, 2, 2, 2, 0],
				fingers: ["", "", "1", "2", "3", ""],
			},
			minor: {
				frets: [-1, 0, 2, 2, 1, 0],
				fingers: ["", "", "2", "3", "1", ""],
			},
			"7": { frets: [-1, 0, 2, 0, 2, 0], fingers: ["", "", "2", "", "3", ""] },
			maj7: {
				frets: [-1, 0, 2, 1, 2, 0],
				fingers: ["", "", "2", "1", "3", ""],
			},
			min7: { frets: [-1, 0, 2, 0, 1, 0], fingers: ["", "", "2", "", "1", ""] },
			diminished: {
				frets: [-1, 0, 1, 2, 1, -1],
				fingers: ["", "", "1", "3", "2", ""],
			},
			"half-diminished": {
				frets: [-1, 0, 1, 0, 1, -1],
				fingers: ["", "", "1", "", "2", ""],
			},
		},
	},
	G: {
		baseRootPc: 7,
		qualities: {
			major: {
				frets: [3, 2, 0, 0, 0, 3],
				fingers: ["3", "2", "", "", "", "4"],
			},
			minor: {
				frets: [3, 1, 0, 0, 3, 3],
				fingers: ["3", "1", "", "", "4", "4"],
			},
			"7": { frets: [3, 2, 0, 0, 0, 1], fingers: ["3", "2", "", "", "", "1"] },
			maj7: { frets: [3, 2, 0, 0, 0, 2], fingers: ["3", "1", "", "", "", "2"] },
			min7: {
				frets: [3, 1, 0, 0, 3, 1],
				fingers: ["3", "1", "", "", "4", "1"],
			},
			diminished: {
				frets: [3, 4, 5, 3, -1, -1],
				fingers: ["1", "2", "4", "1", "", ""],
			},
			"half-diminished": {
				frets: [3, -1, 3, 3, 2, -1],
				fingers: ["2", "", "3", "4", "1", ""],
			},
		},
	},
	E: {
		baseRootPc: 4,
		qualities: {
			major: {
				frets: [0, 2, 2, 1, 0, 0],
				fingers: ["", "2", "3", "1", "", ""],
			},
			minor: { frets: [0, 2, 2, 0, 0, 0], fingers: ["", "2", "3", "", "", ""] },
			"7": { frets: [0, 2, 0, 1, 0, 0], fingers: ["", "2", "", "1", "", ""] },
			maj7: { frets: [0, 2, 1, 1, 0, 0], fingers: ["", "3", "1", "2", "", ""] },
			min7: { frets: [0, 2, 0, 0, 0, 0], fingers: ["", "2", "", "", "", ""] },
			diminished: {
				frets: [0, 1, 2, 0, -1, -1],
				fingers: ["", "1", "3", "", "", ""],
			},
			"half-diminished": {
				frets: [0, 1, 0, 0, -1, -1],
				fingers: ["", "1", "", "", "", ""],
			},
		},
	},
	D: {
		baseRootPc: 2,
		qualities: {
			major: {
				frets: [-1, -1, 0, 2, 3, 2],
				fingers: ["", "", "", "1", "3", "2"],
			},
			minor: {
				frets: [-1, -1, 0, 2, 3, 1],
				fingers: ["", "", "", "2", "3", "1"],
			},
			"7": {
				frets: [-1, -1, 0, 2, 1, 2],
				fingers: ["", "", "", "2", "1", "3"],
			},
			maj7: {
				frets: [-1, -1, 0, 2, 2, 2],
				fingers: ["", "", "", "1", "2", "3"],
			},
			min7: {
				frets: [-1, -1, 0, 2, 1, 1],
				fingers: ["", "", "", "3", "1", "1"],
			},
			diminished: {
				frets: [-1, -1, 0, 1, 3, 1],
				fingers: ["", "", "", "1", "3", "2"],
			},
			"half-diminished": {
				frets: [-1, -1, 0, 1, 1, 1],
				fingers: ["", "", "", "1", "2", "3"],
			},
		},
	},
};

export function mod(value: number, divisor: number) {
	return ((value % divisor) + divisor) % divisor;
}

export function noteNameForPc(
	pc: number,
	preference: AccidentalPreference = "smart",
	keyName?: string,
) {
	const normalizedPc = mod(pc, 12);
	const key = keyName ? getKeyDefinition(keyName) : undefined;
	const keyNote = key?.notes.find((note) => NOTE_TO_PC[note] === normalizedPc);

	if (keyNote) {
		return keyNote;
	}

	if (preference === "sharps") {
		return SHARP_NAMES[normalizedPc];
	}

	if (preference === "flats") {
		return FLAT_NAMES[normalizedPc];
	}

	return FLAT_LEANING_PCS.has(normalizedPc)
		? FLAT_NAMES[normalizedPc]
		: SHARP_NAMES[normalizedPc];
}

export function getKeyDefinition(name: string) {
	return KEY_DEFINITIONS.find((key) => key.name === name);
}

export function getMajorScalePcs(keyName: string) {
	const key = getKeyDefinition(keyName) ?? KEY_DEFINITIONS[0];
	return MAJOR_SCALE_INTERVALS.map((interval) =>
		mod(key.tonicPc + interval, 12),
	);
}

export function chordSymbol(
	rootPc: number,
	quality: QualityId,
	preference: AccidentalPreference = "smart",
	keyName?: string,
) {
	return `${noteNameForPc(rootPc, preference, keyName)}${QUALITY_DEFINITIONS[quality].suffix}`;
}

export function chordNotes(
	rootPc: number,
	quality: QualityId,
	preference: AccidentalPreference = "smart",
	keyName?: string,
) {
	return QUALITY_DEFINITIONS[quality].intervals.map((interval) =>
		noteNameForPc(rootPc + interval, preference, keyName),
	);
}

export function degreeForPcInKey(pc: number, keyName: string) {
	const scale = getMajorScalePcs(keyName);
	const exactIndex = scale.indexOf(mod(pc, 12));

	if (exactIndex >= 0) {
		return `${exactIndex + 1}`;
	}

	const flatIndex = scale.findIndex(
		(scalePc) => mod(scalePc - 1, 12) === mod(pc, 12),
	);

	if (flatIndex >= 0) {
		return `b${flatIndex + 1}`;
	}

	const sharpIndex = scale.findIndex(
		(scalePc) => mod(scalePc + 1, 12) === mod(pc, 12),
	);

	if (sharpIndex >= 0) {
		return `#${sharpIndex + 1}`;
	}

	return "outside";
}

export function chordInKeyDegrees(
	rootPc: number,
	quality: QualityId,
	keyName: string,
) {
	return QUALITY_DEFINITIONS[quality].intervals.map((interval) =>
		degreeForPcInKey(rootPc + interval, keyName),
	);
}

export function parseChordSymbol(input: string) {
	const trimmed = input.trim();

	if (!trimmed) {
		return null;
	}

	const match = trimmed.match(/^([A-Ga-g])([#b♯♭]?)(.*)$/u);

	if (!match) {
		return null;
	}

	const accidental = match[2].replace("♯", "#").replace("♭", "b");
	const root = `${match[1].toUpperCase()}${accidental}`;
	const pc = NOTE_TO_PC[root];

	if (pc === undefined) {
		return null;
	}

	const suffix = match[3].trim();
	const normalized = suffix
		.replaceAll(" ", "")
		.replaceAll("♭", "b")
		.replaceAll("♯", "#")
		.replaceAll("△", "Δ");
	const lower = normalized.toLowerCase();
	let quality: QualityId | null = null;

	if (["", "maj", "major", "M"].includes(normalized)) {
		quality = "major";
	} else if (
		["maj7", "ma7", "major7"].includes(lower) ||
		["M7", "Δ7"].includes(normalized)
	) {
		quality = "maj7";
	} else if (
		[
			"m7b5",
			"min7b5",
			"-7b5",
			"ø7",
			"half-diminished",
			"halfdiminished",
		].includes(lower)
	) {
		quality = "half-diminished";
	} else if (["m7", "min7", "-7", "minor7"].includes(lower)) {
		quality = "min7";
	} else if (["m", "min", "-", "minor"].includes(lower)) {
		quality = "minor";
	} else if (["7", "dom7", "dominant7"].includes(lower)) {
		quality = "7";
	} else if (["dim", "diminished", "o", "°"].includes(lower)) {
		quality = "diminished";
	}

	if (!quality) {
		return null;
	}

	return { rootPc: pc, rootName: root, quality };
}

export function buildVoicing(
	rootPc: number,
	quality: QualityId,
	shapeFamily: ShapeFamily,
	preference: AccidentalPreference = "smart",
	keyName?: string,
): ChordVoicing {
	const shape = SHAPE_TEMPLATES[shapeFamily];
	const template = shape.qualities[quality];
	const shift = mod(rootPc - shape.baseRootPc, 12);
	const frets = template.frets.map((fret) => (fret < 0 ? -1 : fret + shift));
	const hasOpenStrings = frets.some((fret) => fret === 0);
	const fretted = frets.filter((fret) => fret > 0);
	const minFret = fretted.length > 0 ? Math.min(...fretted) : 1;
	const maxFret = fretted.length > 0 ? Math.max(...fretted) : 1;
	const baseFret = hasOpenStrings || minFret <= 1 ? 1 : minFret;
	const avgFret =
		fretted.length > 0
			? fretted.reduce((sum, fret) => sum + fret, 0) / fretted.length
			: 0;
	const strings = frets.map((fret, stringIndex): VoicedString => {
		const notePc = fret >= 0 ? mod(STRING_TUNING[stringIndex] + fret, 12) : -1;
		return {
			stringIndex,
			fret,
			note: fret >= 0 ? noteNameForPc(notePc, preference, keyName) : "",
			notePc,
			interval: fret >= 0 ? intervalLabelForPc(rootPc, quality, notePc) : "",
			finger: fingerForString(template, shift, stringIndex),
		};
	});
	const barres = barresForTemplate(template, shift);
	const symbol = chordSymbol(rootPc, quality, preference, keyName);
	const intervals = QUALITY_DEFINITIONS[quality].formula;
	const notes = chordNotes(rootPc, quality, preference, keyName);
	const fretSpan = Math.max(0, maxFret - minFret);
	const qualityCost = ["7", "maj7", "min7", "half-diminished"].includes(quality)
		? 0.6
		: 0;
	const muteCost = frets.filter((fret) => fret < 0).length * 0.15;
	const difficulty = Number(
		(1 + fretSpan * 0.35 + avgFret * 0.06 + qualityCost + muteCost).toFixed(2),
	);

	return {
		id: `${symbol}-${shapeFamily}`,
		rootPc,
		root: noteNameForPc(rootPc, preference, keyName),
		quality,
		qualityLabel: QUALITY_DEFINITIONS[quality].label,
		symbol,
		shapeFamily,
		baseFret,
		frets,
		fingers: strings.map((string) => string.finger),
		barres,
		strings,
		notes,
		intervals,
		avgFret,
		fretSpan,
		difficulty,
	};
}

export function getVoicings(
	rootPc: number,
	quality: QualityId,
	shapes: ShapeFamily[] = SHAPE_FAMILIES,
	preference: AccidentalPreference = "smart",
	keyName?: string,
	neckZone: NeckZone = "any",
) {
	return shapes
		.map((shape) => buildVoicing(rootPc, quality, shape, preference, keyName))
		.filter((voicing) => voicingFitsZone(voicing, neckZone))
		.sort((a, b) => a.difficulty - b.difficulty || a.avgFret - b.avgFret);
}

export function generatePracticeSet(prefs: GeneratorPrefs): GenerationResult {
	if (prefs.enabledQualities.length === 0) {
		return {
			ok: false,
			message: "No chord qualities are enabled.",
			suggestion:
				"Enable at least one quality such as Major, Minor, Dominant 7, or Minor 7.",
		};
	}

	if (prefs.allowedShapes.length === 0) {
		return {
			ok: false,
			message: "No CAGED shape families are enabled.",
			suggestion: "Enable at least one shape family, or choose Any shape.",
		};
	}

	const key =
		prefs.keyName === "random"
			? weightedPick(
					KEY_DEFINITIONS.map((definition) => ({
						item: definition,
						weight: 1,
					})),
				)
			: getKeyDefinition(prefs.keyName);

	if (!key) {
		return {
			ok: false,
			message: "The selected key is not supported.",
			suggestion: "Choose one of the 12 major keys in the key selector.",
		};
	}

	const templates = PROGRESSION_TEMPLATES.filter(
		(template) => template.mode === "strict" || prefs.mode === "blues",
	);
	const viableTemplates = templates.filter((template) =>
		templateCanGenerate(template, key, prefs),
	);

	if (viableTemplates.length === 0) {
		return {
			ok: false,
			message: "No valid four-chord progression matches the current filters.",
			suggestion:
				"Broaden the chord-quality filters, allow more CAGED shapes, or set the neck zone to Any.",
		};
	}

	const template = weightedPick(
		viableTemplates.map((item) => ({
			item,
			weight: item.weight,
		})),
	);
	const scalePcs = getMajorScalePcs(key.name);
	const chordPlans = template.romanDegrees.map((degree) => {
		const rootPc = scalePcs[degree - 1];
		const quality = chooseQualityForDegree(
			degree,
			prefs.mode,
			prefs.enabledQualities,
		);
		return { degree, rootPc, quality };
	});

	const chordCandidates = chordPlans.map((plan) =>
		getVoicings(
			plan.rootPc,
			plan.quality,
			prefs.allowedShapes,
			prefs.accidentalPreference,
			key.name,
			prefs.neckZone,
		),
	);

	if (chordCandidates.some((candidates) => candidates.length === 0)) {
		return {
			ok: false,
			message:
				"The template was valid harmonically, but no playable voicing chain survived.",
			suggestion: "Try a wider neck zone or add more shape families.",
		};
	}

	const voicingChain = prefs.switchPractice
		? chooseSmoothestVoicingChain(chordCandidates)
		: chordCandidates.map((candidates) => candidates[0]);
	const generatedChords = chordPlans.map((plan, index): GeneratedChord => {
		const voicing = voicingChain[index];

		return {
			id: `${index + 1}-${voicing.id}`,
			degree: plan.degree,
			roman: romanNumeral(plan.degree, plan.quality),
			arabicDegree: `${plan.degree}`,
			symbol: voicing.symbol,
			root: voicing.root,
			rootPc: plan.rootPc,
			quality: plan.quality,
			qualityLabel: QUALITY_DEFINITIONS[plan.quality].label,
			shapeFamily: voicing.shapeFamily,
			formula: QUALITY_DEFINITIONS[plan.quality].formula,
			notes: chordNotes(
				plan.rootPc,
				plan.quality,
				prefs.accidentalPreference,
				key.name,
			),
			inKeyDegrees: chordInKeyDegrees(plan.rootPc, plan.quality, key.name),
			voicing,
		};
	});
	const notesCovered = uniqueStrings(
		generatedChords.flatMap((chord) => chord.notes),
	);
	const degreesCovered = uniqueStrings(
		generatedChords.flatMap((chord) => chord.inKeyDegrees),
	);

	return {
		ok: true,
		set: {
			id: createId(),
			key: key.name,
			mode: prefs.mode,
			templateId: template.id,
			templateName: template.name,
			styleTag: template.styleTag,
			createdAt: new Date().toISOString(),
			neckZone: prefs.neckZone,
			switchPractice: prefs.switchPractice,
			keyNotes: key.notes,
			generatedChords,
			notesCovered,
			degreesCovered,
		},
	};
}

function fingerForString(
	template: VoicingTemplate,
	shift: number,
	stringIndex: number,
) {
	const templateFret = template.frets[stringIndex];

	if (templateFret < 0) {
		return "";
	}

	if (templateFret === 0 && shift > 0) {
		return "1";
	}

	return template.fingers[stringIndex];
}

function barresForTemplate(
	template: VoicingTemplate,
	shift: number,
): BarreInfo[] {
	if (shift <= 0) {
		return [];
	}

	const movedOpenStrings = template.frets
		.map((fret, stringIndex) => ({ fret, stringIndex }))
		.filter((entry) => entry.fret === 0)
		.map((entry) => entry.stringIndex);

	if (movedOpenStrings.length < 2) {
		return [];
	}

	return [
		{
			fret: shift,
			fromString: Math.min(...movedOpenStrings),
			toString: Math.max(...movedOpenStrings),
			finger: "1",
		},
	];
}

function intervalLabelForPc(
	rootPc: number,
	quality: QualityId,
	notePc: number,
) {
	const diff = mod(notePc - rootPc, 12);
	const intervals = QUALITY_DEFINITIONS[quality].intervals;
	const index = intervals.indexOf(diff);

	return index >= 0 ? QUALITY_DEFINITIONS[quality].formula[index] : "color";
}

function voicingFitsZone(voicing: ChordVoicing, zone: NeckZone) {
	if (zone === "any") {
		return true;
	}

	if (zone === "open") {
		return voicing.avgFret <= 4.5;
	}

	if (zone === "mid") {
		return voicing.avgFret >= 3.5 && voicing.avgFret <= 8;
	}

	return voicing.avgFret >= 6.5 && voicing.avgFret <= 12;
}

function templateCanGenerate(
	template: ProgressionTemplate,
	key: KeyDefinition,
	prefs: GeneratorPrefs,
) {
	const scalePcs = getMajorScalePcs(key.name);

	return template.romanDegrees.every((degree) => {
		const rootPc = scalePcs[degree - 1];
		return candidateQualitiesForDegree(
			degree,
			prefs.mode,
			prefs.enabledQualities,
		).some(
			(quality) =>
				getVoicings(
					rootPc,
					quality,
					prefs.allowedShapes,
					prefs.accidentalPreference,
					key.name,
					prefs.neckZone,
				).length > 0,
		);
	});
}

function chooseQualityForDegree(
	degree: number,
	mode: GenerationMode,
	enabledQualities: QualityId[],
) {
	const candidates = candidateQualitiesForDegree(
		degree,
		mode,
		enabledQualities,
	);

	if (candidates.length === 0) {
		return STRICT_QUALITY_CANDIDATES[degree][0];
	}

	const weighted = candidates.map((candidate) => ({
		item: candidate,
		weight: preferredQualityWeight(degree, candidate, mode),
	}));

	return weightedPick(weighted);
}

function candidateQualitiesForDegree(
	degree: number,
	mode: GenerationMode,
	enabledQualities: QualityId[],
) {
	const source =
		mode === "blues" ? BLUES_QUALITY_CANDIDATES : STRICT_QUALITY_CANDIDATES;

	return source[degree].filter((quality) => enabledQualities.includes(quality));
}

function preferredQualityWeight(
	degree: number,
	quality: QualityId,
	mode: GenerationMode,
) {
	if (mode === "blues" && [1, 4, 5].includes(degree) && quality === "7") {
		return 5;
	}

	if (degree === 5 && quality === "7") {
		return 4;
	}

	if ([2, 6].includes(degree) && quality === "min7") {
		return 3;
	}

	if ([1, 4].includes(degree) && quality === "maj7") {
		return 2;
	}

	return 1;
}

function chooseSmoothestVoicingChain(candidates: ChordVoicing[][]) {
	let bestChain: ChordVoicing[] = [];
	let bestScore = Number.POSITIVE_INFINITY;

	function walk(index: number, chain: ChordVoicing[], score: number) {
		if (index === candidates.length) {
			if (score < bestScore) {
				bestScore = score;
				bestChain = chain;
			}
			return;
		}

		for (const candidate of candidates[index]) {
			const previous = chain.at(-1);
			const nextScore = previous
				? score + transitionCost(previous, candidate)
				: score;
			walk(
				index + 1,
				[...chain, candidate],
				nextScore + candidate.difficulty * 0.2,
			);
		}
	}

	walk(0, [], 0);

	return bestChain;
}

function transitionCost(from: ChordVoicing, to: ChordVoicing) {
	const fretDistance = Math.abs(from.avgFret - to.avgFret);
	const spanPressure = Math.abs(from.fretSpan - to.fretSpan) * 0.25;
	const shapeChange = from.shapeFamily === to.shapeFamily ? 0 : 0.4;
	const sharedToneCredit = sharedPitchClasses(from, to) * 0.35;

	return Math.max(
		0,
		fretDistance + spanPressure + shapeChange - sharedToneCredit,
	);
}

function sharedPitchClasses(a: ChordVoicing, b: ChordVoicing) {
	const aNotes = new Set(
		a.strings
			.filter((string) => string.fret >= 0)
			.map((string) => string.notePc),
	);
	const bNotes = new Set(
		b.strings
			.filter((string) => string.fret >= 0)
			.map((string) => string.notePc),
	);
	let count = 0;

	for (const pc of aNotes) {
		if (bNotes.has(pc)) {
			count += 1;
		}
	}

	return count;
}

function romanNumeral(degree: number, quality: QualityId) {
	const base = ["I", "II", "III", "IV", "V", "VI", "VII"][degree - 1];

	if (quality === "minor") {
		return base.toLowerCase();
	}

	if (quality === "min7") {
		return `${base.toLowerCase()}7`;
	}

	if (quality === "diminished") {
		return `${base.toLowerCase()}dim`;
	}

	if (quality === "half-diminished") {
		return `${base.toLowerCase()}m7b5`;
	}

	if (quality === "7") {
		return `${base}7`;
	}

	if (quality === "maj7") {
		return `${base}maj7`;
	}

	return base;
}

function weightedPick<T>(items: Array<{ item: T; weight: number }>) {
	const total = items.reduce((sum, entry) => sum + entry.weight, 0);
	let cursor = Math.random() * total;

	for (const entry of items) {
		cursor -= entry.weight;

		if (cursor <= 0) {
			return entry.item;
		}
	}

	return items[items.length - 1].item;
}

function uniqueStrings(values: string[]) {
	return Array.from(new Set(values));
}

function createId() {
	if (globalThis.crypto?.randomUUID) {
		return globalThis.crypto.randomUUID();
	}

	return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
