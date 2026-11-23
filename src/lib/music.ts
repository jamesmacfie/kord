export type AccidentalPreference = "smart" | "sharps" | "flats";
export type GenerationMode = "strict" | "blues";
export type KeyMode = "major" | "minor";
export type NeckZone = "any" | "open" | "mid" | "upper";
export type CagedFamily = "C" | "A" | "G" | "E" | "D";
export type ShapeFamily =
	| CagedFamily
	| "shell"
	| "drop2"
	| "triad"
	| "open"
	| "other";
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
	label: string;
	mode: KeyMode;
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

export interface ProgressionStep {
	degree: number;
	quality: QualityId;
	flat?: boolean;
}

export interface ProgressionTemplate {
	id: string;
	name: string;
	mode: GenerationMode;
	keyMode: KeyMode;
	steps: ProgressionStep[];
	styleTag: string;
	example: string;
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
const STRING_MIDI = [40, 45, 50, 55, 59, 64];
const MAX_FRET = 14;
const HAND_SPAN = 4;
const MAX_FINGERS = 4;
const MIN_SOUNDED_STRINGS = 3;
const VOICINGS_PER_CHORD = 8;
const VOICINGS_PER_FAMILY = 2;

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

export const CAGED_FAMILIES: CagedFamily[] = ["C", "A", "G", "E", "D"];
export const SHAPE_FAMILIES: ShapeFamily[] = [
	"C",
	"A",
	"G",
	"E",
	"D",
	"shell",
	"drop2",
	"triad",
	"open",
	"other",
];

export const SHAPE_LABELS: Record<ShapeFamily, string> = {
	C: "C shape",
	A: "A shape",
	G: "G shape",
	E: "E shape",
	D: "D shape",
	shell: "Shell",
	drop2: "Drop 2",
	triad: "Triad",
	open: "Open",
	other: "Other",
};

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
	{
		name: "C",
		label: "C major",
		mode: "major",
		tonicPc: 0,
		notes: ["C", "D", "E", "F", "G", "A", "B"],
	},
	{
		name: "G",
		label: "G major",
		mode: "major",
		tonicPc: 7,
		notes: ["G", "A", "B", "C", "D", "E", "F#"],
	},
	{
		name: "D",
		label: "D major",
		mode: "major",
		tonicPc: 2,
		notes: ["D", "E", "F#", "G", "A", "B", "C#"],
	},
	{
		name: "A",
		label: "A major",
		mode: "major",
		tonicPc: 9,
		notes: ["A", "B", "C#", "D", "E", "F#", "G#"],
	},
	{
		name: "E",
		label: "E major",
		mode: "major",
		tonicPc: 4,
		notes: ["E", "F#", "G#", "A", "B", "C#", "D#"],
	},
	{
		name: "B",
		label: "B major",
		mode: "major",
		tonicPc: 11,
		notes: ["B", "C#", "D#", "E", "F#", "G#", "A#"],
	},
	{
		name: "F#",
		label: "F# major",
		mode: "major",
		tonicPc: 6,
		notes: ["F#", "G#", "A#", "B", "C#", "D#", "E#"],
	},
	{
		name: "Db",
		label: "Db major",
		mode: "major",
		tonicPc: 1,
		notes: ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"],
	},
	{
		name: "Ab",
		label: "Ab major",
		mode: "major",
		tonicPc: 8,
		notes: ["Ab", "Bb", "C", "Db", "Eb", "F", "G"],
	},
	{
		name: "Eb",
		label: "Eb major",
		mode: "major",
		tonicPc: 3,
		notes: ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
	},
	{
		name: "Bb",
		label: "Bb major",
		mode: "major",
		tonicPc: 10,
		notes: ["Bb", "C", "D", "Eb", "F", "G", "A"],
	},
	{
		name: "F",
		label: "F major",
		mode: "major",
		tonicPc: 5,
		notes: ["F", "G", "A", "Bb", "C", "D", "E"],
	},
	{
		name: "Am",
		label: "A minor",
		mode: "minor",
		tonicPc: 9,
		notes: ["A", "B", "C", "D", "E", "F", "G"],
	},
	{
		name: "Em",
		label: "E minor",
		mode: "minor",
		tonicPc: 4,
		notes: ["E", "F#", "G", "A", "B", "C", "D"],
	},
	{
		name: "Bm",
		label: "B minor",
		mode: "minor",
		tonicPc: 11,
		notes: ["B", "C#", "D", "E", "F#", "G", "A"],
	},
	{
		name: "F#m",
		label: "F# minor",
		mode: "minor",
		tonicPc: 6,
		notes: ["F#", "G#", "A", "B", "C#", "D", "E"],
	},
	{
		name: "C#m",
		label: "C# minor",
		mode: "minor",
		tonicPc: 1,
		notes: ["C#", "D#", "E", "F#", "G#", "A", "B"],
	},
	{
		name: "G#m",
		label: "G# minor",
		mode: "minor",
		tonicPc: 8,
		notes: ["G#", "A#", "B", "C#", "D#", "E", "F#"],
	},
	{
		name: "D#m",
		label: "D# minor",
		mode: "minor",
		tonicPc: 3,
		notes: ["D#", "E#", "F#", "G#", "A#", "B", "C#"],
	},
	{
		name: "Bbm",
		label: "Bb minor",
		mode: "minor",
		tonicPc: 10,
		notes: ["Bb", "C", "Db", "Eb", "F", "Gb", "Ab"],
	},
	{
		name: "Fm",
		label: "F minor",
		mode: "minor",
		tonicPc: 5,
		notes: ["F", "G", "Ab", "Bb", "C", "Db", "Eb"],
	},
	{
		name: "Cm",
		label: "C minor",
		mode: "minor",
		tonicPc: 0,
		notes: ["C", "D", "Eb", "F", "G", "Ab", "Bb"],
	},
	{
		name: "Gm",
		label: "G minor",
		mode: "minor",
		tonicPc: 7,
		notes: ["G", "A", "Bb", "C", "D", "Eb", "F"],
	},
	{
		name: "Dm",
		label: "D minor",
		mode: "minor",
		tonicPc: 2,
		notes: ["D", "E", "F", "G", "A", "Bb", "C"],
	},
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
		keyMode: "major",
		steps: [
			{ degree: 1, quality: "major" },
			{ degree: 5, quality: "major" },
			{ degree: 6, quality: "minor" },
			{ degree: 4, quality: "major" },
		],
		styleTag: "Pop",
		example: "Let It Be, Don't Stop Believin', With or Without You",
		weight: 10,
	},
	{
		id: "pop-reverse-start",
		name: "vi-IV-I-V",
		mode: "strict",
		keyMode: "major",
		steps: [
			{ degree: 6, quality: "minor" },
			{ degree: 4, quality: "major" },
			{ degree: 1, quality: "major" },
			{ degree: 5, quality: "major" },
		],
		styleTag: "Pop",
		example: "Grenade, Despacito, plenty of Rolling Stones",
		weight: 8,
	},
	{
		id: "doo-wop",
		name: "I-vi-IV-V",
		mode: "strict",
		keyMode: "major",
		steps: [
			{ degree: 1, quality: "major" },
			{ degree: 6, quality: "minor" },
			{ degree: 4, quality: "major" },
			{ degree: 5, quality: "major" },
		],
		styleTag: "Doo-wop",
		example: "Stand By Me, Earth Angel, Every Breath You Take",
		weight: 7,
	},
	{
		id: "royal-road",
		name: "IV-V-iii-vi",
		mode: "strict",
		keyMode: "major",
		steps: [
			{ degree: 4, quality: "major" },
			{ degree: 5, quality: "major" },
			{ degree: 3, quality: "minor" },
			{ degree: 6, quality: "minor" },
		],
		styleTag: "J-pop",
		example: "The royal road turn, all over anime and city pop",
		weight: 4,
	},
	{
		id: "rock-three-chord",
		name: "I-IV-V",
		mode: "strict",
		keyMode: "major",
		steps: [
			{ degree: 1, quality: "major" },
			{ degree: 4, quality: "major" },
			{ degree: 5, quality: "major" },
		],
		styleTag: "Rock",
		example: "La Bamba, Twist and Shout, most early rock and roll",
		weight: 5,
	},
	{
		id: "rock-garage-loop",
		name: "I-IV-V-IV",
		mode: "strict",
		keyMode: "major",
		steps: [
			{ degree: 1, quality: "major" },
			{ degree: 4, quality: "major" },
			{ degree: 5, quality: "major" },
			{ degree: 4, quality: "major" },
		],
		styleTag: "Rock",
		example: "Wild Thing, Louie Louie",
		weight: 4,
	},
	{
		id: "mixolydian-rock",
		name: "I-bVII-IV",
		mode: "strict",
		keyMode: "major",
		steps: [
			{ degree: 1, quality: "major" },
			{ degree: 7, quality: "major", flat: true },
			{ degree: 4, quality: "major" },
		],
		styleTag: "Rock",
		example: "Sweet Home Alabama, Sweet Child O' Mine, Royals",
		weight: 4,
	},
	{
		id: "andalusian",
		name: "i-VII-VI-V",
		mode: "strict",
		keyMode: "minor",
		steps: [
			{ degree: 1, quality: "minor" },
			{ degree: 7, quality: "major" },
			{ degree: 6, quality: "major" },
			{ degree: 5, quality: "major" },
		],
		styleTag: "Minor",
		example: "Hit the Road Jack, Sultans of Swing, flamenco",
		weight: 5,
	},
	{
		id: "minor-vamp",
		name: "i-VII-VI-VII",
		mode: "strict",
		keyMode: "minor",
		steps: [
			{ degree: 1, quality: "minor" },
			{ degree: 7, quality: "major" },
			{ degree: 6, quality: "major" },
			{ degree: 7, quality: "major" },
		],
		styleTag: "Minor",
		example: "The same descent, looping instead of resolving",
		weight: 4,
	},
	{
		id: "minor-axis",
		name: "i-VI-III-VII",
		mode: "strict",
		keyMode: "minor",
		steps: [
			{ degree: 1, quality: "minor" },
			{ degree: 6, quality: "major" },
			{ degree: 3, quality: "major" },
			{ degree: 7, quality: "major" },
		],
		styleTag: "Minor",
		example: "Zombie, Save Tonight",
		weight: 8,
	},
	{
		id: "minor-lift",
		name: "VI-VII-i",
		mode: "strict",
		keyMode: "minor",
		steps: [
			{ degree: 6, quality: "major" },
			{ degree: 7, quality: "major" },
			{ degree: 1, quality: "minor" },
		],
		styleTag: "Minor",
		example: "The Wonderwall prechorus, Bad Romance",
		weight: 5,
	},
	{
		id: "minor-three-chord",
		name: "i-iv-v",
		mode: "strict",
		keyMode: "minor",
		steps: [
			{ degree: 1, quality: "minor" },
			{ degree: 4, quality: "minor" },
			{ degree: 5, quality: "minor" },
		],
		styleTag: "Minor",
		example: "The plain minor answer to I-IV-V",
		weight: 4,
	},
	{
		id: "minor-cadence",
		name: "i-iv-V",
		mode: "strict",
		keyMode: "minor",
		steps: [
			{ degree: 1, quality: "minor" },
			{ degree: 4, quality: "minor" },
			{ degree: 5, quality: "major" },
		],
		styleTag: "Minor",
		example: "A major V borrowed from harmonic minor, so it pulls home",
		weight: 4,
	},
	{
		id: "minor-blues",
		name: "i7-iv7-i7-V7",
		mode: "blues",
		keyMode: "minor",
		steps: [
			{ degree: 1, quality: "min7" },
			{ degree: 4, quality: "min7" },
			{ degree: 1, quality: "min7" },
			{ degree: 5, quality: "7" },
		],
		styleTag: "Blues",
		example: "Minor sevenths on i and iv, a dominant V to turn it around",
		weight: 5,
	},
	{
		id: "minor-two-five-one",
		name: "iim7b5-V7-i7",
		mode: "strict",
		keyMode: "minor",
		steps: [
			{ degree: 2, quality: "half-diminished" },
			{ degree: 5, quality: "7" },
			{ degree: 1, quality: "min7" },
		],
		styleTag: "Jazz",
		example: "The minor 2-5-1, all over jazz and Latin standards",
		weight: 5,
	},
	{
		id: "blues-turnaround",
		name: "I7-IV7-I7-V7",
		mode: "blues",
		keyMode: "major",
		steps: [
			{ degree: 1, quality: "7" },
			{ degree: 4, quality: "7" },
			{ degree: 1, quality: "7" },
			{ degree: 5, quality: "7" },
		],
		styleTag: "Blues",
		example: "The bones of a 12-bar blues",
		weight: 7,
	},
	{
		id: "blues-walk-home",
		name: "I7-IV7-V7-I7",
		mode: "blues",
		keyMode: "major",
		steps: [
			{ degree: 1, quality: "7" },
			{ degree: 4, quality: "7" },
			{ degree: 5, quality: "7" },
			{ degree: 1, quality: "7" },
		],
		styleTag: "Blues",
		example: "The walk home at the end of a blues chorus",
		weight: 5,
	},
	{
		id: "two-five-one",
		name: "ii7-V7-Imaj7",
		mode: "strict",
		keyMode: "major",
		steps: [
			{ degree: 2, quality: "min7" },
			{ degree: 5, quality: "7" },
			{ degree: 1, quality: "maj7" },
		],
		styleTag: "Jazz",
		example: "The turnaround under most jazz and R&B standards",
		weight: 5,
	},
	{
		id: "circle-motion",
		name: "vi7-ii7-V7-Imaj7",
		mode: "strict",
		keyMode: "major",
		steps: [
			{ degree: 6, quality: "min7" },
			{ degree: 2, quality: "min7" },
			{ degree: 5, quality: "7" },
			{ degree: 1, quality: "maj7" },
		],
		styleTag: "Jazz",
		example: "Roots falling in fourths, smooth to voice-lead",
		weight: 6,
	},
	{
		id: "cadential-jazz-pop",
		name: "ii7-V7-Imaj7-vi7",
		mode: "strict",
		keyMode: "major",
		steps: [
			{ degree: 2, quality: "min7" },
			{ degree: 5, quality: "7" },
			{ degree: 1, quality: "maj7" },
			{ degree: 6, quality: "min7" },
		],
		styleTag: "Jazz",
		example: "A 2-5-1 that hands you back to the top",
		weight: 6,
	},
	{
		id: "neo-soul-vamp",
		name: "Imaj7-IVmaj7",
		mode: "strict",
		keyMode: "major",
		steps: [
			{ degree: 1, quality: "maj7" },
			{ degree: 4, quality: "maj7" },
		],
		styleTag: "Neo-soul",
		example: "The two-chord rock that neo-soul and lo-fi live on",
		weight: 4,
	},
	{
		id: "neo-soul-minor-vamp",
		name: "vi7-IVmaj7",
		mode: "strict",
		keyMode: "major",
		steps: [
			{ degree: 6, quality: "min7" },
			{ degree: 4, quality: "maj7" },
		],
		styleTag: "Neo-soul",
		example: "The minor-to-major lift, warmer than it looks",
		weight: 3,
	},
	{
		id: "neo-soul-descent",
		name: "Imaj7-iii7-vi7-IVmaj7",
		mode: "strict",
		keyMode: "major",
		steps: [
			{ degree: 1, quality: "maj7" },
			{ degree: 3, quality: "min7" },
			{ degree: 6, quality: "min7" },
			{ degree: 4, quality: "maj7" },
		],
		styleTag: "Neo-soul",
		example: "Sevenths on every chord, the R&B ballad shape",
		weight: 4,
	},
];

const SCALE_INTERVALS: Record<KeyMode, number[]> = {
	major: [0, 2, 4, 5, 7, 9, 11],
	minor: [0, 2, 3, 5, 7, 8, 10],
};

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

// Natural minor, except degree 5, which also offers the major and dominant
// chords that harmonic minor supplies. Most minor music leans on that V.
const MINOR_QUALITY_CANDIDATES: Record<number, QualityId[]> = {
	1: ["minor", "min7"],
	2: ["diminished", "half-diminished"],
	3: ["major", "maj7"],
	4: ["minor", "min7"],
	5: ["minor", "min7", "major", "7"],
	6: ["major", "maj7"],
	7: ["major", "7"],
};

const SHAPE_TEMPLATES: Record<CagedFamily, ShapeTemplate> = {
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

	if (key && isRaisedSeventh(key, normalizedPc)) {
		const raised = raisedSeventhName(key);

		if (raised) {
			return raised;
		}
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

// Harmonic minor raises the seventh, which is how a minor key gets a major V.
// The note sits outside the natural minor scale, so it needs its own spelling
// and its own degree, or E major in A minor reads as "E Ab B" at degree b1.
function isRaisedSeventh(key: KeyDefinition, pc: number) {
	return key.mode === "minor" && mod(pc, 12) === mod(key.tonicPc - 1, 12);
}

function raisedSeventhName(key: KeyDefinition) {
	const seventh = key.notes[6];
	const raised = seventh.endsWith("b") ? seventh.slice(0, -1) : `${seventh}#`;

	// G# minor and D# minor would need a double sharp, which we cannot spell.
	return NOTE_TO_PC[raised] === mod(key.tonicPc - 1, 12) ? raised : null;
}

export function getScalePcs(keyName: string) {
	const key = getKeyDefinition(keyName) ?? KEY_DEFINITIONS[0];
	return SCALE_INTERVALS[key.mode].map((interval) =>
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
	const scale = getScalePcs(keyName);
	const exactIndex = scale.indexOf(mod(pc, 12));

	if (exactIndex >= 0) {
		return `${exactIndex + 1}`;
	}

	const key = getKeyDefinition(keyName);

	if (key && isRaisedSeventh(key, pc)) {
		return "#7";
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

// Voicings come from searching the fretboard, not from a fixed shape table.
// Given the chord's notes we enumerate every playable way to sound them inside
// a four-fret hand span, work out a fingering, and score it. CAGED shapes still
// turn up, because they are particular solutions, and so are shells, triads and
// drop 2s that no template held.
export function buildVoicing(
	rootPc: number,
	quality: QualityId,
	shapeFamily: CagedFamily,
	preference: AccidentalPreference = "smart",
	keyName?: string,
): ChordVoicing {
	const shape = SHAPE_TEMPLATES[shapeFamily];
	const shift = mod(rootPc - shape.baseRootPc, 12);
	const frets = shape.qualities[quality].frets.map((fret) =>
		fret < 0 ? -1 : fret + shift,
	);

	return makeVoicing(rootPc, quality, frets, preference, keyName);
}

export function getVoicings(
	rootPc: number,
	quality: QualityId,
	shapes: ShapeFamily[] = SHAPE_FAMILIES,
	preference: AccidentalPreference = "smart",
	keyName?: string,
	neckZone: NeckZone = "any",
) {
	const allowed = new Set(shapes);
	const perFamily = new Map<ShapeFamily, number>();
	const picked: ChordVoicing[] = [];

	for (const frets of searchVoicings(rootPc, quality)) {
		const voicing = makeVoicing(rootPc, quality, frets, preference, keyName);

		if (
			!allowed.has(voicing.shapeFamily) ||
			!voicingFitsZone(voicing, neckZone)
		) {
			continue;
		}

		// Cap each family so the shortlist stays varied instead of filling up
		// with eight near-identical grips.
		const used = perFamily.get(voicing.shapeFamily) ?? 0;

		if (used >= VOICINGS_PER_FAMILY) {
			continue;
		}

		perFamily.set(voicing.shapeFamily, used + 1);
		picked.push(voicing);

		if (picked.length >= VOICINGS_PER_CHORD) {
			break;
		}
	}

	return picked;
}

const searchCache = new Map<string, number[][]>();

// Returns fret arrays, cheapest first. Cached because templateCanGenerate asks
// the same questions hundreds of times per Generate.
function searchVoicings(rootPc: number, quality: QualityId) {
	const cacheKey = `${rootPc}:${quality}`;
	const cached = searchCache.get(cacheKey);

	if (cached) {
		return cached;
	}

	const chordPcs = QUALITY_DEFINITIONS[quality].intervals.map((interval) =>
		mod(rootPc + interval, 12),
	);
	const required = requiredPitchClasses(rootPc, quality);
	const seen = new Set<string>();
	const found: Array<{ frets: number[]; cost: number }> = [];

	for (let base = 1; base + HAND_SPAN - 1 <= MAX_FRET; base++) {
		const perString = STRING_TUNING.map((openPc, stringIndex) => {
			const options = [-1];

			if (chordPcs.includes(openPc)) {
				options.push(0);
			}

			for (let fret = base; fret < base + HAND_SPAN; fret++) {
				if (chordPcs.includes(mod(STRING_TUNING[stringIndex] + fret, 12))) {
					options.push(fret);
				}
			}

			return options;
		});

		walkStrings(perString, (frets) => {
			const key = frets.join(",");

			if (seen.has(key)) {
				return;
			}

			seen.add(key);

			if (!isPlayableShape(frets, required)) {
				return;
			}

			found.push({
				frets: [...frets],
				cost: shapeCost(rootPc, quality, frets),
			});
		});
	}

	const ordered = found
		.sort((a, b) => a.cost - b.cost)
		.map((entry) => entry.frets);

	searchCache.set(cacheKey, ordered);

	return ordered;
}

function walkStrings(
	perString: number[][],
	onCandidate: (frets: number[]) => void,
) {
	const frets: number[] = [];

	function walk(stringIndex: number) {
		if (stringIndex === perString.length) {
			onCandidate(frets);
			return;
		}

		for (const fret of perString[stringIndex]) {
			frets.push(fret);
			walk(stringIndex + 1);
			frets.pop();
		}
	}

	walk(0);
}

// The perfect fifth is the one tone a seventh chord can spare. Dropping it is
// what makes a shell voicing, and it is why shells exist at all.
function requiredPitchClasses(rootPc: number, quality: QualityId) {
	const intervals = QUALITY_DEFINITIONS[quality].intervals;
	const canDropFifth = intervals.length > 3 && intervals.includes(7);

	return intervals
		.filter((interval) => !(canDropFifth && interval === 7))
		.map((interval) => mod(rootPc + interval, 12));
}

function isPlayableShape(frets: number[], required: number[]) {
	const sounded = frets.filter((fret) => fret >= 0);

	if (sounded.length < MIN_SOUNDED_STRINGS) {
		return false;
	}

	if (innerMuteCount(frets) > 1) {
		return false;
	}

	const heard = new Set(
		frets.map((fret, index) =>
			fret >= 0 ? mod(STRING_TUNING[index] + fret, 12) : -1,
		),
	);

	if (!required.every((pc) => heard.has(pc))) {
		return false;
	}

	return assignFingers(frets) !== null;
}

function innerMuteCount(frets: number[]) {
	const sounded = frets
		.map((fret, index) => ({ fret, index }))
		.filter((entry) => entry.fret >= 0);
	const first = sounded[0]?.index ?? 0;
	const last = sounded[sounded.length - 1]?.index ?? 0;

	return frets.filter(
		(fret, index) => fret < 0 && index > first && index < last,
	).length;
}

interface Fingering {
	fingers: string[];
	barres: BarreInfo[];
	fingerCount: number;
	// Three or more strings on one fret that no single finger can barre. Two
	// adjacent strings under two fingers is ordinary; three is a claw.
	crampedGroups: number;
}

// Fingers go on in fret order. A group of strings sharing a fret becomes a
// barre when one finger could really cover it: three or more strings, or two at
// the lowest fret in the shape. Anything between the ends of a barre has to sit
// at that fret or higher, since the finger presses straight through.
function assignFingers(frets: number[]): Fingering | null {
	const fretted = frets
		.map((fret, stringIndex) => ({ fret, stringIndex }))
		.filter((entry) => entry.fret > 0);
	const fingers = frets.map(() => "");

	if (fretted.length === 0) {
		return { fingers, barres: [], fingerCount: 0, crampedGroups: 0 };
	}

	const lowestFret = Math.min(...fretted.map((entry) => entry.fret));
	const distinctFrets = Array.from(
		new Set(fretted.map((entry) => entry.fret)),
	).sort((a, b) => a - b);
	const barres: BarreInfo[] = [];
	let nextFinger = 1;
	let crampedGroups = 0;

	for (const fret of distinctFrets) {
		const atFret = fretted.filter((entry) => entry.fret === fret);
		const from = Math.min(...atFret.map((entry) => entry.stringIndex));
		const to = Math.max(...atFret.map((entry) => entry.stringIndex));
		const blocked = frets.some(
			(other, index) =>
				index > from && index < to && other >= 0 && other < fret,
		);
		const worthBarring =
			atFret.length >= 3 || (atFret.length === 2 && fret === lowestFret);

		if (worthBarring && !blocked) {
			if (nextFinger > MAX_FINGERS) {
				return null;
			}

			const finger = `${nextFinger}`;
			nextFinger += 1;

			for (const entry of atFret) {
				fingers[entry.stringIndex] = finger;
			}

			barres.push({ fret, fromString: from, toString: to, finger });
			continue;
		}

		if (atFret.length >= 3) {
			crampedGroups += 1;
		}

		for (const entry of atFret) {
			if (nextFinger > MAX_FINGERS) {
				return null;
			}

			fingers[entry.stringIndex] = `${nextFinger}`;
			nextFinger += 1;
		}
	}

	return { fingers, barres, fingerCount: nextFinger - 1, crampedGroups };
}

function shapeCost(rootPc: number, quality: QualityId, frets: number[]) {
	const fretted = frets.filter((fret) => fret > 0);
	const sounded = frets.filter((fret) => fret >= 0);
	const span =
		fretted.length > 0 ? Math.max(...fretted) - Math.min(...fretted) : 0;
	const avgFret =
		fretted.length > 0
			? fretted.reduce((sum, fret) => sum + fret, 0) / fretted.length
			: 0;
	const fingering = assignFingers(frets);
	const bassPc = bassPitchClass(frets);

	const wideBarres = (fingering?.barres ?? []).filter(
		(barre) => barre.toString - barre.fromString >= 2,
	).length;

	return (
		span * 0.28 +
		avgFret * 0.11 +
		innerMuteCount(frets) * 0.5 +
		(6 - sounded.length) * 0.25 +
		(bassPc === rootPc ? 0 : 0.45) +
		wideBarres * 0.25 +
		(fingering?.crampedGroups ?? 0) * 0.4 +
		Math.max(0, (fingering?.fingerCount ?? MAX_FINGERS) - 3) * 0.2 +
		(["7", "maj7", "min7", "half-diminished"].includes(quality) ? 0.6 : 0)
	);
}

function bassPitchClass(frets: number[]) {
	for (let index = 0; index < frets.length; index += 1) {
		if (frets[index] >= 0) {
			return mod(STRING_TUNING[index] + frets[index], 12);
		}
	}

	return -1;
}

function makeVoicing(
	rootPc: number,
	quality: QualityId,
	frets: number[],
	preference: AccidentalPreference,
	keyName?: string,
): ChordVoicing {
	const fingering = assignFingers(frets) ?? {
		fingers: frets.map(() => ""),
		barres: [],
		fingerCount: 0,
		crampedGroups: 0,
	};
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
			finger: fingering.fingers[stringIndex],
		};
	});
	const symbol = chordSymbol(rootPc, quality, preference, keyName);

	return {
		id: `${symbol}-${frets.join(",")}`,
		rootPc,
		root: noteNameForPc(rootPc, preference, keyName),
		quality,
		qualityLabel: QUALITY_DEFINITIONS[quality].label,
		symbol,
		shapeFamily: shapeFamilyFor(rootPc, quality, frets),
		baseFret,
		frets,
		fingers: fingering.fingers,
		barres: fingering.barres,
		strings,
		notes: chordNotes(rootPc, quality, preference, keyName),
		intervals: QUALITY_DEFINITIONS[quality].formula,
		avgFret,
		fretSpan: Math.max(0, maxFret - minFret),
		difficulty: Number((1 + shapeCost(rootPc, quality, frets)).toFixed(2)),
	};
}

function shapeFamilyFor(
	rootPc: number,
	quality: QualityId,
	frets: number[],
): ShapeFamily {
	for (const family of CAGED_FAMILIES) {
		const shape = SHAPE_TEMPLATES[family];
		const shift = mod(rootPc - shape.baseRootPc, 12);
		const expected = shape.qualities[quality].frets.map((fret) =>
			fret < 0 ? -1 : fret + shift,
		);

		if (expected.every((fret, index) => fret === frets[index])) {
			return family;
		}
	}

	const intervals = QUALITY_DEFINITIONS[quality].intervals;
	const sounded = frets.filter((fret) => fret >= 0);
	const heard = new Set(
		frets.map((fret, index) =>
			fret >= 0 ? mod(STRING_TUNING[index] + fret, 12) : -1,
		),
	);

	if (
		intervals.length > 3 &&
		intervals.includes(7) &&
		!heard.has(mod(rootPc + 7, 12))
	) {
		return "shell";
	}

	if (sounded.length === 4 && isDropTwo(frets)) {
		return "drop2";
	}

	if (sounded.length === 3) {
		return "triad";
	}

	if (frets.some((fret) => fret === 0)) {
		return "open";
	}

	return "other";
}

// Raise the bass an octave. If it slots in second from the top and leaves a
// stack inside one octave, the voicing is a close position with its second
// voice dropped, which is what drop 2 means.
function isDropTwo(frets: number[]) {
	const pitches = frets
		.map((fret, index) => (fret >= 0 ? STRING_MIDI[index] + fret : null))
		.filter((pitch): pitch is number => pitch !== null)
		.sort((a, b) => a - b);

	if (pitches.length !== 4) {
		return false;
	}

	if (new Set(pitches.map((pitch) => mod(pitch, 12))).size !== 4) {
		return false;
	}

	const [low, ...rest] = pitches;
	const raised = low + 12;

	return raised > rest[1] && raised < rest[2] && rest[2] - rest[0] < 12;
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
			message: "No shape families are enabled.",
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
			suggestion: "Choose one of the major or minor keys in the key selector.",
		};
	}

	const templates = PROGRESSION_TEMPLATES.filter(
		(template) =>
			template.keyMode === key.mode &&
			(template.mode === "strict" || prefs.mode === "blues") &&
			templateSuitsGenerator(template, key.mode, prefs.mode),
	);
	const viableTemplates = templates.filter((template) =>
		templateCanGenerate(template, key, prefs),
	);

	if (viableTemplates.length === 0) {
		return {
			ok: false,
			message: "No valid four-chord progression matches the current filters.",
			suggestion:
				"Broaden the chord-quality filters, allow more shapes, or set the neck zone to Any.",
		};
	}

	const template = weightedPick(
		viableTemplates.map((item) => ({
			item,
			weight: item.weight,
		})),
	);
	const scalePcs = getScalePcs(key.name);
	const chordPlans = template.steps.map((step) => ({
		step,
		rootPc: stepRootPc(step, scalePcs),
		quality: chooseQualityForDegree(
			step.degree,
			key.mode,
			prefs.mode,
			prefs.enabledQualities,
		),
	}));

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
	const generatedChords = chordPlans.map((plan, index) =>
		toGeneratedChord(
			{ ...plan.step, quality: plan.quality },
			index,
			voicingChain[index],
			key.name,
			prefs.accidentalPreference,
		),
	);
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

export function buildProgression(
	template: ProgressionTemplate,
	keyName: string,
	preference: AccidentalPreference = "smart",
	neckZone: NeckZone = "any",
): GeneratedChord[] {
	const key = getKeyDefinition(keyName);

	if (!key) {
		return [];
	}

	const scalePcs = getScalePcs(key.name);
	const candidates = template.steps.map((step) =>
		getVoicings(
			stepRootPc(step, scalePcs),
			step.quality,
			SHAPE_FAMILIES,
			preference,
			key.name,
			neckZone,
		),
	);

	if (candidates.some((options) => options.length === 0)) {
		return [];
	}

	const chain = chooseSmoothestVoicingChain(candidates);

	return template.steps.map((step, index) =>
		toGeneratedChord(step, index, chain[index], key.name, preference),
	);
}

function stepRootPc(step: ProgressionStep, scalePcs: number[]) {
	const pc = scalePcs[step.degree - 1];
	return step.flat ? mod(pc - 1, 12) : pc;
}

function toGeneratedChord(
	step: ProgressionStep,
	index: number,
	voicing: ChordVoicing,
	keyName: string,
	preference: AccidentalPreference,
): GeneratedChord {
	return {
		id: `${index + 1}-${voicing.id}`,
		degree: step.degree,
		roman: romanNumeral(step.degree, step.quality, step.flat),
		arabicDegree: `${step.flat ? "b" : ""}${step.degree}`,
		symbol: voicing.symbol,
		root: voicing.root,
		rootPc: voicing.rootPc,
		quality: step.quality,
		qualityLabel: QUALITY_DEFINITIONS[step.quality].label,
		shapeFamily: voicing.shapeFamily,
		formula: QUALITY_DEFINITIONS[step.quality].formula,
		notes: chordNotes(voicing.rootPc, step.quality, preference, keyName),
		inKeyDegrees: chordInKeyDegrees(voicing.rootPc, step.quality, keyName),
		voicing,
	};
}

// The random practice generator only handles four diatonic chords whose fixed
// quality is one it would pick anyway, so borrowed chords and two- or
// three-chord vamps stay out of its pool and keep the printed name honest.
function templateSuitsGenerator(
	template: ProgressionTemplate,
	keyMode: KeyMode,
	mode: GenerationMode,
) {
	const source = qualityCandidateMap(keyMode, mode);

	return (
		template.steps.length === 4 &&
		template.steps.every(
			(step) => !step.flat && source[step.degree].includes(step.quality),
		)
	);
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
	const scalePcs = getScalePcs(key.name);

	return template.steps.every((step) => {
		const rootPc = stepRootPc(step, scalePcs);
		return candidateQualitiesForDegree(
			step.degree,
			key.mode,
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
	keyMode: KeyMode,
	mode: GenerationMode,
	enabledQualities: QualityId[],
) {
	const candidates = candidateQualitiesForDegree(
		degree,
		keyMode,
		mode,
		enabledQualities,
	);

	if (candidates.length === 0) {
		return qualityCandidateMap(keyMode, mode)[degree][0];
	}

	const weighted = candidates.map((candidate) => ({
		item: candidate,
		weight: preferredQualityWeight(degree, keyMode, candidate, mode),
	}));

	return weightedPick(weighted);
}

function candidateQualitiesForDegree(
	degree: number,
	keyMode: KeyMode,
	mode: GenerationMode,
	enabledQualities: QualityId[],
) {
	return qualityCandidateMap(keyMode, mode)[degree].filter((quality) =>
		enabledQualities.includes(quality),
	);
}

// Minor keys read off one map. Blues colour already lives in it, on degrees 5
// and 7, so there is no separate minor blues map to keep in step.
function qualityCandidateMap(keyMode: KeyMode, mode: GenerationMode) {
	if (keyMode === "minor") {
		return MINOR_QUALITY_CANDIDATES;
	}

	return mode === "blues"
		? BLUES_QUALITY_CANDIDATES
		: STRICT_QUALITY_CANDIDATES;
}

function preferredQualityWeight(
	degree: number,
	keyMode: KeyMode,
	quality: QualityId,
	mode: GenerationMode,
) {
	if (mode === "blues" && [1, 4, 5].includes(degree) && quality === "7") {
		return 5;
	}

	if (keyMode === "minor" && degree === 5 && ["major", "7"].includes(quality)) {
		return 3;
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

function romanNumeral(degree: number, quality: QualityId, flat = false) {
	const prefix = flat ? "b" : "";
	const base = prefix + ["I", "II", "III", "IV", "V", "VI", "VII"][degree - 1];

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

// ---------------------------------------------------------------------------
// CAGED neck map
//
// The routine pane draws the whole neck for one key and colours every note by
// the CAGED shape (or shapes) it sits in. A shape's territory is its pentatonic
// box: two notes per string, and neighbouring boxes share the note where they
// meet. That gives the two facts the views lean on. Every pentatonic note
// belongs to exactly two shapes, and every other scale note falls strictly
// between two box notes on its string, so it belongs to exactly one.
// ---------------------------------------------------------------------------

export type RoutineView =
	| "chord-tones"
	| "pentatonic"
	| "switch"
	| "scale"
	| "triads"
	| "thirds"
	| "sixths";
export type IntervalSource = "chord" | "scale";
export type NeckStrings = number | "all";

export interface RoutineViewDefinition {
	id: RoutineView;
	label: string;
	description: string;
}

export interface NeckNote {
	id: string;
	stringIndex: number;
	fret: number;
	pc: number;
	note: string;
	degree: string;
	/** Shapes this note sits in, ordered from the nut outward. */
	shapes: CagedFamily[];
	isRoot: boolean;
	/** The switch view marks the parallel mode's third this way. */
	isAlternate: boolean;
}

export interface NeckGroup {
	id: string;
	shapes: CagedFamily[];
	/** Note ids ordered from the low string up, joined by a line. */
	noteIds: string[];
	/** Outlines are drawn faintly beneath a view, shapes at full strength. */
	kind: "shape" | "outline";
	/** Chord name for a diatonic triad, such as "Gm" or "Edim". */
	label?: string;
}

export interface NeckSpan {
	shape: CagedFamily;
	from: number;
	to: number;
}

export interface NeckMap {
	notes: NeckNote[];
	groups: NeckGroup[];
	spans: NeckSpan[];
}

export interface NeckMapOptions {
	tonicPc: number;
	mode: KeyMode;
	view: RoutineView;
	strings?: NeckStrings;
	/** Which interval only thirds read; sixths always walk the scale. */
	source?: IntervalSource;
	/** Bass of each string-set triad: 0 root, 1 third, 2 fifth. */
	inversion?: TriadInversion;
	accidentalPreference?: AccidentalPreference;
}

export type TriadInversion = 0 | 1 | 2;

export const TRIAD_INVERSIONS: Array<{ id: TriadInversion; label: string }> = [
	{ id: 0, label: "Root position" },
	{ id: 1, label: "1st inversion" },
	{ id: 2, label: "2nd inversion" },
];

export const NECK_FRETS = 15;
export const STRING_COUNT = 6;

export const ROUTINE_VIEWS: RoutineViewDefinition[] = [
	{
		id: "chord-tones",
		label: "Chord tones",
		description:
			"Every root, third, and fifth of the tonic chord, with the five chord shapes outlined beneath.",
	},
	{
		id: "pentatonic",
		label: "Pentatonic",
		description:
			"The five pentatonic boxes. Each note is shared by the two shapes that meet on it.",
	},
	{
		id: "switch",
		label: "Major/minor switch",
		description:
			"Root and fifth stay put. The solid third is this key's; the faded third is the parallel key's, one fret away.",
	},
	{
		id: "scale",
		label: "Full scale",
		description:
			"The full scale. Notes added to the pentatonic sit inside a single shape.",
	},
	{
		id: "triads",
		label: "Triads",
		description:
			"The tonic triad in each CAGED shape, or every triad in the key climbing one string set.",
	},
	{
		id: "thirds",
		label: "Thirds",
		description:
			"Pairs a third apart on two neighbouring strings, climbing the neck.",
	},
	{
		id: "sixths",
		label: "Sixths",
		description:
			"Pairs a sixth apart through the whole scale, across a skipped string, climbing the neck.",
	},
];

/** String sets, by the index of their lowest string (0 is low E). */
export const NECK_STRING_SETS: Record<
	"triads" | "thirds" | "sixths",
	number[]
> = {
	triads: [3, 2, 1, 0],
	thirds: [4, 3, 2, 1, 0],
	sixths: [3, 2, 1, 0],
};

const STRING_SPAN: Record<"triads" | "thirds" | "sixths", number[]> = {
	triads: [0, 1, 2],
	thirds: [0, 1],
	sixths: [0, 2],
};

const DEGREE_LABELS = [
	"R",
	"b2",
	"2",
	"b3",
	"3",
	"4",
	"b5",
	"5",
	"b6",
	"6",
	"b7",
	"7",
];

const NECK_PITCH_SETS: Record<
	"chord" | "pentatonic" | "scale",
	Record<KeyMode, number[]>
> = {
	chord: { major: [0, 4, 7], minor: [0, 3, 7] },
	pentatonic: { major: [0, 2, 4, 7, 9], minor: [0, 3, 5, 7, 10] },
	scale: { major: SCALE_INTERVALS.major, minor: SCALE_INTERVALS.minor },
};

// The five pentatonic boxes of A minor, as [low, high] frets per string from
// low E. They climb the neck in order, so each box's high fret on a string is
// the next box's low fret. C major uses the same five boxes under the names of
// its own chord shapes, one step back round the CAGED cycle.
const PENTATONIC_BOXES: Record<CagedFamily, Array<[number, number]>> = {
	E: [
		[5, 8],
		[5, 7],
		[5, 7],
		[5, 7],
		[5, 8],
		[5, 8],
	],
	D: [
		[8, 10],
		[7, 10],
		[7, 10],
		[7, 9],
		[8, 10],
		[8, 10],
	],
	C: [
		[10, 12],
		[10, 12],
		[10, 12],
		[9, 12],
		[10, 13],
		[10, 12],
	],
	A: [
		[12, 15],
		[12, 15],
		[12, 14],
		[12, 14],
		[13, 15],
		[12, 15],
	],
	G: [
		[15, 17],
		[15, 17],
		[14, 17],
		[14, 17],
		[15, 17],
		[15, 17],
	],
};

const MAJOR_SHAPE_BOX: Record<CagedFamily, CagedFamily> = {
	C: "A",
	A: "G",
	G: "E",
	E: "D",
	D: "C",
};

// The tonic chord in each shape, in the same frame as the boxes: A minor and
// C major. The minor C shape keeps the flat third on the top string, which the
// open Cm grip has to drop but a moved-up one can reach.
const NECK_VOICINGS: Record<KeyMode, Record<CagedFamily, number[]>> = {
	minor: {
		E: [5, 7, 7, 5, 5, 5],
		D: [-1, -1, 7, 9, 10, 8],
		C: [-1, 12, 10, 9, 10, 8],
		A: [-1, 12, 14, 14, 13, 12],
		G: [17, 15, 14, 14, 17, 17],
	},
	major: {
		G: [8, 7, 5, 5, 5, 8],
		E: [8, 10, 10, 9, 8, 8],
		D: [-1, -1, 10, 12, 13, 12],
		C: [-1, 15, 14, 12, 13, 12],
		A: [-1, 15, 17, 17, 17, 15],
	},
};

const NECK_REFERENCE_TONIC: Record<KeyMode, number> = { minor: 9, major: 0 };

type RegionKind = "scale" | "chord";

interface NeckContext {
	tonicPc: number;
	mode: KeyMode;
	shift: number;
	keyName?: string;
	preference: AccidentalPreference;
}

interface Membership {
	shape: CagedFamily;
	low: number;
}

export function shapeWindow(
	mode: KeyMode,
	shape: CagedFamily,
	stringIndex: number,
	kind: RegionKind,
): [number, number] {
	const box = mode === "minor" ? shape : MAJOR_SHAPE_BOX[shape];
	const [low, high] = PENTATONIC_BOXES[box][stringIndex];

	if (kind === "scale") {
		return [low, high];
	}

	// Chord views widen a box to take in its own chord shape, which only
	// matters where the grip reaches past the box.
	const voiced = NECK_VOICINGS[mode][shape][stringIndex];
	return voiced < 0
		? [low, high]
		: [Math.min(low, voiced), Math.max(high, voiced)];
}

function neckOffsets(shift: number, low: number, high: number) {
	const offsets: number[] = [];

	for (let turn = -2; turn <= 2; turn += 1) {
		const offset = shift + turn * 12;

		if (high + offset >= 0 && low + offset <= NECK_FRETS) {
			offsets.push(offset);
		}
	}

	return offsets;
}

function membershipAt(
	ctx: NeckContext,
	stringIndex: number,
	fret: number,
	kind: RegionKind,
): Membership[] {
	const found: Membership[] = [];

	for (const shape of CAGED_FAMILIES) {
		const [low, high] = shapeWindow(ctx.mode, shape, stringIndex, kind);

		for (const offset of neckOffsets(ctx.shift, low, high)) {
			if (fret >= low + offset && fret <= high + offset) {
				found.push({ shape, low: low + offset });
			}
		}
	}

	return found.sort((a, b) => a.low - b.low);
}

function makeNeckNote(
	ctx: NeckContext,
	stringIndex: number,
	fret: number,
	shapes: CagedFamily[],
	isAlternate = false,
): NeckNote {
	const pc = mod(STRING_TUNING[stringIndex] + fret, 12);
	const semis = mod(pc - ctx.tonicPc, 12);

	return {
		id: `${stringIndex}:${fret}`,
		stringIndex,
		fret,
		pc,
		note: noteNameForPc(pc, ctx.preference, ctx.keyName),
		degree: DEGREE_LABELS[semis],
		shapes,
		isRoot: semis === 0,
		isAlternate,
	};
}

function semisAt(ctx: NeckContext, stringIndex: number, fret: number) {
	return mod(STRING_TUNING[stringIndex] + fret - ctx.tonicPc, 12);
}

function voicingPlacements(ctx: NeckContext) {
	const placements: Array<{ shape: CagedFamily; frets: number[] }> = [];

	for (const shape of CAGED_FAMILIES) {
		const frets = NECK_VOICINGS[ctx.mode][shape];
		const sounded = frets.filter((fret) => fret >= 0);
		const low = Math.min(...sounded);
		const high = Math.max(...sounded);

		// A grip only counts when all of it fits on the drawn neck. The cycle
		// repeats every twelve frets, so another copy always does.
		for (const offset of neckOffsets(ctx.shift, low, high)) {
			if (low + offset >= 0 && high + offset <= NECK_FRETS) {
				placements.push({
					shape,
					frets: frets.map((fret) => (fret < 0 ? -1 : fret + offset)),
				});
			}
		}
	}

	return placements.sort(
		(a, b) =>
			Math.min(...a.frets.filter((fret) => fret >= 0)) -
			Math.min(...b.frets.filter((fret) => fret >= 0)),
	);
}

function neckSpans(ctx: NeckContext, kind: RegionKind): NeckSpan[] {
	const spans: NeckSpan[] = [];

	for (const shape of CAGED_FAMILIES) {
		const windows = Array.from({ length: STRING_COUNT }, (_, stringIndex) =>
			shapeWindow(ctx.mode, shape, stringIndex, kind),
		);
		const low = Math.min(...windows.map(([from]) => from));
		const high = Math.max(...windows.map(([, to]) => to));

		for (const offset of neckOffsets(ctx.shift, low, high)) {
			spans.push({
				shape,
				from: Math.max(0, low + offset),
				to: Math.min(NECK_FRETS, high + offset),
			});
		}
	}

	return spans.sort((a, b) => a.from - b.from || a.to - b.to);
}

/** Shapes every note shares, or if they share none, every shape any touches. */
function sharedShapes(memberships: Membership[][]) {
	const [first, ...rest] = memberships;
	const shared = first
		.map((item) => item.shape)
		.filter((shape) =>
			rest.every((list) => list.some((item) => item.shape === shape)),
		);

	if (shared.length > 0) {
		return shared;
	}

	const union = memberships.flat().sort((a, b) => a.low - b.low);
	return uniqueStrings(union.map((item) => item.shape)) as CagedFamily[];
}

export function buildNeckMap(options: NeckMapOptions): NeckMap {
	const { mode, view } = options;
	const tonicPc = mod(options.tonicPc, 12);
	const key = KEY_DEFINITIONS.find(
		(item) => item.mode === mode && item.tonicPc === tonicPc,
	);
	const ctx: NeckContext = {
		tonicPc,
		mode,
		shift: mod(tonicPc - NECK_REFERENCE_TONIC[mode], 12),
		keyName: key?.name,
		preference: options.accidentalPreference ?? "smart",
	};
	const strings = options.strings ?? "all";
	// Views built from the whole scale use the scale's territory, and views
	// built from the tonic chord widen it to take in the chord shapes.
	const onScale =
		view === "pentatonic" ||
		view === "scale" ||
		view === "sixths" ||
		(view === "thirds" && options.source === "scale") ||
		(view === "triads" && strings !== "all");
	const region: RegionKind = onScale ? "scale" : "chord";
	const spans = neckSpans(ctx, region);

	switch (view) {
		case "pentatonic":
		case "scale":
			return {
				notes: scanNeck(ctx, NECK_PITCH_SETS[view][mode], "scale"),
				groups: [],
				spans,
			};
		case "chord-tones":
			return {
				notes: scanNeck(ctx, NECK_PITCH_SETS.chord[mode], "chord"),
				groups: voicingGroups(ctx, "outline"),
				spans,
			};
		case "switch": {
			const alternate = mode === "major" ? 3 : 4;
			const notes = scanNeck(
				ctx,
				[0, 3, 4, 7],
				"chord",
				(semis) => semis === alternate,
			);
			return { notes, groups: voicingGroups(ctx, "outline"), spans };
		}
		case "triads":
			return strings === "all"
				? fullShapeMap(ctx, spans)
				: stackedMap(ctx, strings, "triads", region, spans, options.inversion);
		case "thirds":
		case "sixths":
			return stackedMap(
				ctx,
				strings === "all" ? NECK_STRING_SETS[view][0] : strings,
				view,
				region,
				spans,
			);
	}
}

function scanNeck(
	ctx: NeckContext,
	pitchSet: number[],
	kind: RegionKind,
	isAlternate: (semis: number) => boolean = () => false,
) {
	const notes: NeckNote[] = [];

	for (let stringIndex = 0; stringIndex < STRING_COUNT; stringIndex += 1) {
		for (let fret = 0; fret <= NECK_FRETS; fret += 1) {
			const semis = semisAt(ctx, stringIndex, fret);

			if (!pitchSet.includes(semis)) {
				continue;
			}

			const shapes = membershipAt(ctx, stringIndex, fret, kind).map(
				(item) => item.shape,
			);
			notes.push(
				makeNeckNote(ctx, stringIndex, fret, shapes, isAlternate(semis)),
			);
		}
	}

	return notes;
}

function voicingGroups(ctx: NeckContext, kind: NeckGroup["kind"]) {
	return voicingPlacements(ctx).map(
		(placement, index): NeckGroup => ({
			id: `${placement.shape}-${index}`,
			shapes: [placement.shape],
			kind,
			noteIds: placement.frets.flatMap((fret, stringIndex) =>
				fret < 0 ? [] : [`${stringIndex}:${fret}`],
			),
		}),
	);
}

function fullShapeMap(ctx: NeckContext, spans: NeckSpan[]): NeckMap {
	const groups = voicingGroups(ctx, "shape");
	const shapesById = new Map<string, CagedFamily[]>();

	for (const group of groups) {
		for (const id of group.noteIds) {
			const shapes = shapesById.get(id) ?? [];
			shapes.push(group.shapes[0]);
			shapesById.set(id, shapes);
		}
	}

	const notes = Array.from(shapesById, ([id, shapes]) => {
		const [stringIndex, fret] = id.split(":").map(Number);
		return makeNeckNote(ctx, stringIndex, fret, shapes);
	}).sort((a, b) => a.stringIndex - b.stringIndex || a.fret - b.fret);

	return { notes, groups, spans };
}

// Triads, thirds, and sixths are all a stack of notes, one per string, each a
// set number of rungs up a ladder of pitches from the one below. Start a stack
// on every ladder note of the lowest string and the views cover the whole neck.
// Sixths and string-set triads climb the scale, so every chord in the key
// appears. Thirds climb either the scale or the tonic chord's own tones.
const TRIAD_STEPS: Record<TriadInversion, number[]> = {
	0: [2, 2],
	1: [2, 3],
	2: [3, 2],
};

function stackedMap(
	ctx: NeckContext,
	lowString: number,
	kind: "triads" | "thirds" | "sixths",
	region: RegionKind,
	spans: NeckSpan[],
	inversion: TriadInversion = 0,
): NeckMap {
	const strings = STRING_SPAN[kind].map((offset) => lowString + offset);

	if (strings[strings.length - 1] >= STRING_COUNT) {
		return { notes: [], groups: [], spans };
	}

	const chord = NECK_PITCH_SETS.chord[ctx.mode];
	const scale = NECK_PITCH_SETS.scale[ctx.mode];
	const ladder = region === "chord" ? chord : scale;
	// On chord tones a third is one rung up. On the scale it is two, and a
	// sixth is five.
	const steps =
		kind === "triads"
			? TRIAD_STEPS[inversion]
			: kind === "sixths"
				? [5]
				: [ladder === chord ? 1 : 2];

	const notes: NeckNote[] = [];
	const groups: NeckGroup[] = [];

	for (let fret = 0; fret <= NECK_FRETS; fret += 1) {
		const start = ladder.indexOf(semisAt(ctx, strings[0], fret));

		if (start < 0) {
			continue;
		}

		const placed: Array<{ stringIndex: number; fret: number }> = [
			{ stringIndex: strings[0], fret },
		];
		let pitch = STRING_MIDI[strings[0]] + fret;
		let index = start;

		strings.slice(1).forEach((stringIndex, position) => {
			pitch += intervalUp(ladder, index, steps[position]);
			index += steps[position];
			placed.push({ stringIndex, fret: pitch - STRING_MIDI[stringIndex] });
		});

		if (!placed.every((item) => item.fret >= 0 && item.fret <= NECK_FRETS)) {
			continue;
		}

		// On chord tones the fifth up to the root is a fourth, not a third.
		const rise = pitch - (STRING_MIDI[strings[0]] + fret);

		if (kind === "thirds" && (rise < 3 || rise > 4)) {
			continue;
		}

		const memberships = placed.map((item) =>
			membershipAt(ctx, item.stringIndex, item.fret, region),
		);
		const shapes = sharedShapes(memberships);
		const groupNotes = placed.map((item) =>
			makeNeckNote(ctx, item.stringIndex, item.fret, shapes),
		);

		notes.push(...groupNotes);
		groups.push({
			id: `${kind}-${fret}`,
			shapes,
			kind: "shape",
			noteIds: groupNotes.map((note) => note.id),
			label:
				kind === "triads"
					? diatonicTriadName(ctx, mod(start - inversion * 2, 7))
					: undefined,
		});
	}

	return { notes, groups, spans };
}

/** Name the triad built on a scale degree (0-based), such as "Gm" or "Edim". */
function diatonicTriadName(ctx: NeckContext, degree: number) {
	const scale = NECK_PITCH_SETS.scale[ctx.mode];
	const root = scale[degree];
	const third = mod(scale[(degree + 2) % 7] - root, 12);
	const fifth = mod(scale[(degree + 4) % 7] - root, 12);
	const suffix = fifth === 6 ? "dim" : third === 3 ? "m" : "";
	const name = noteNameForPc(ctx.tonicPc + root, ctx.preference, ctx.keyName);

	return `${name}${suffix}`;
}

/** Semitones from rung `index` of a ladder to `rungs` rungs above it. */
function intervalUp(ladder: number[], index: number, rungs: number) {
	const size = ladder.length;
	const from = ladder[index % size] + 12 * Math.floor(index / size);
	const target = index + rungs;
	const to = ladder[target % size] + 12 * Math.floor(target / size);
	return to - from;
}
