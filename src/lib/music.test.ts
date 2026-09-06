import { describe, expect, it } from "vitest";

import {
	buildProgression,
	CAGED_FAMILIES,
	chordInKeyDegrees,
	chordNotes,
	generatePracticeSet,
	getVoicings,
	KEY_DEFINITIONS,
	PROGRESSION_TEMPLATES,
	parseChordSymbol,
	QUALITY_DEFINITIONS,
	QUALITY_ORDER,
	type QualityId,
	SHAPE_FAMILIES,
} from "./music";

const MINOR_ALLOWED: Record<number, QualityId[]> = {
	1: ["minor", "min7"],
	2: ["diminished", "half-diminished"],
	3: ["major", "maj7"],
	4: ["minor", "min7"],
	5: ["minor", "min7", "major", "7"],
	6: ["major", "maj7"],
	7: ["major", "7"],
};

const STRICT_ALLOWED: Record<number, QualityId[]> = {
	1: ["major", "maj7"],
	2: ["minor", "min7"],
	3: ["minor", "min7"],
	4: ["major", "maj7"],
	5: ["major", "7"],
	6: ["minor", "min7"],
	7: ["diminished", "half-diminished"],
};

describe("music theory helpers", () => {
	it("normalizes common chord-symbol aliases", () => {
		expect(parseChordSymbol("Cmaj7")).toMatchObject({
			rootPc: 0,
			quality: "maj7",
		});
		expect(parseChordSymbol("Bb7")).toMatchObject({ rootPc: 10, quality: "7" });
		expect(parseChordSymbol("Em7")).toMatchObject({
			rootPc: 4,
			quality: "min7",
		});
		expect(parseChordSymbol("CΔ7")).toMatchObject({
			rootPc: 0,
			quality: "maj7",
		});
		expect(parseChordSymbol("Cø7")).toMatchObject({
			rootPc: 0,
			quality: "half-diminished",
		});
		expect(parseChordSymbol("C-")).toMatchObject({
			rootPc: 0,
			quality: "minor",
		});
	});

	it("maps chord notes and in-key degrees for the PRD example", () => {
		expect(chordNotes(7, "major", "smart", "G")).toEqual(["G", "B", "D"]);
		expect(chordNotes(2, "7", "smart", "G")).toEqual(["D", "F#", "A", "C"]);
		expect(chordInKeyDegrees(2, "7", "G")).toEqual(["5", "7", "2", "4"]);
		expect(chordInKeyDegrees(4, "min7", "G")).toEqual(["6", "1", "3", "5"]);
		expect(chordInKeyDegrees(0, "maj7", "G")).toEqual(["4", "6", "1", "3"]);
	});

	it("builds readable CAGED voicings for required acceptance chords", () => {
		const cMajorSeven = getVoicings(0, "maj7", ["C"], "smart");
		const bFlatSeven = getVoicings(10, "7", ["A"], "smart");
		const eMinorSeven = getVoicings(4, "min7", ["E"], "smart");

		expect(cMajorSeven[0].symbol).toBe("Cmaj7");
		expect(bFlatSeven[0].symbol).toBe("Bb7");
		expect(eMinorSeven[0].symbol).toBe("Em7");
		expect(
			cMajorSeven[0].strings.some((string) => string.interval === "7"),
		).toBe(true);
	});

	it("keeps strict generated progressions inside the strict candidate map", () => {
		const result = generatePracticeSet({
			keyName: "G",
			mode: "strict",
			enabledQualities: Object.keys(QUALITY_DEFINITIONS) as QualityId[],
			allowedShapes: SHAPE_FAMILIES,
			neckZone: "any",
			switchPractice: true,
			accidentalPreference: "smart",
		});

		expect(result.ok).toBe(true);

		if (!result.ok) {
			return;
		}

		expect(result.set.generatedChords).toHaveLength(4);

		for (const chord of result.set.generatedChords) {
			expect(STRICT_ALLOWED[chord.degree]).toContain(chord.quality);
		}
	});

	it("builds a chosen progression with its own fixed qualities", () => {
		const template = PROGRESSION_TEMPLATES.find(
			(item) => item.id === "neo-soul-vamp",
		);

		if (!template) {
			throw new Error("neo-soul-vamp template is missing");
		}

		const chords = buildProgression(template, "G");

		expect(chords.map((chord) => chord.symbol)).toEqual(["Gmaj7", "Cmaj7"]);
		expect(chords.map((chord) => chord.roman)).toEqual(["Imaj7", "IVmaj7"]);
	});

	it("lowers borrowed degrees and labels them with a flat", () => {
		const template = PROGRESSION_TEMPLATES.find(
			(item) => item.id === "mixolydian-rock",
		);

		if (!template) {
			throw new Error("mixolydian-rock template is missing");
		}

		const chords = buildProgression(template, "C");

		expect(chords.map((chord) => chord.symbol)).toEqual(["C", "Bb", "F"]);
		expect(chords.map((chord) => chord.roman)).toEqual(["I", "bVII", "IV"]);
		expect(chords[1].inKeyDegrees).toEqual(["b7", "2", "4"]);
	});

	it("spells a minor key off the natural minor scale", () => {
		const template = PROGRESSION_TEMPLATES.find(
			(item) => item.id === "andalusian",
		);

		if (!template) {
			throw new Error("andalusian template is missing");
		}

		const chords = buildProgression(template, "Am");

		expect(chords.map((chord) => chord.symbol)).toEqual(["Am", "G", "F", "E"]);
		expect(chords.map((chord) => chord.roman)).toEqual(["i", "VII", "VI", "V"]);
		expect(chords[0].inKeyDegrees).toEqual(["1", "3", "5"]);
	});

	it("keeps a progression inside the neck zone it was asked for", () => {
		const template = PROGRESSION_TEMPLATES.find(
			(item) => item.id === "pop-axis",
		);

		if (!template) {
			throw new Error("pop-axis template is missing");
		}

		const open = buildProgression(template, "C", "smart", "open");
		const upper = buildProgression(template, "C", "smart", "upper");

		expect(open).toHaveLength(4);
		expect(upper).toHaveLength(4);

		for (const chord of open) {
			expect(chord.voicing.avgFret).toBeLessThanOrEqual(4.5);
		}

		for (const chord of upper) {
			expect(chord.voicing.avgFret).toBeGreaterThanOrEqual(6.5);
		}
	});

	it("spells the raised seventh that carries the major V", () => {
		expect(chordNotes(4, "major", "smart", "Am")).toEqual(["E", "G#", "B"]);
		expect(chordInKeyDegrees(4, "major", "Am")).toEqual(["5", "#7", "2"]);
		expect(chordNotes(7, "major", "smart", "Cm")).toEqual(["G", "B", "D"]);
		expect(chordNotes(0, "major", "smart", "Fm")).toEqual(["C", "E", "G"]);
	});

	it("keeps minor generated progressions inside the minor candidate map", () => {
		const result = generatePracticeSet({
			keyName: "Em",
			mode: "strict",
			enabledQualities: Object.keys(QUALITY_DEFINITIONS) as QualityId[],
			allowedShapes: SHAPE_FAMILIES,
			neckZone: "any",
			switchPractice: true,
			accidentalPreference: "smart",
		});

		expect(result.ok).toBe(true);

		if (!result.ok) {
			return;
		}

		for (const chord of result.set.generatedChords) {
			expect(MINOR_ALLOWED[chord.degree]).toContain(chord.quality);
		}
	});

	it("only offers a key the progressions written for its mode", () => {
		for (const key of KEY_DEFINITIONS) {
			const matching = PROGRESSION_TEMPLATES.filter(
				(template) => template.keyMode === key.mode,
			);

			expect(matching.length).toBeGreaterThan(0);
		}
	});

	it("only sounds chord tones, whatever shape the search finds", () => {
		for (const quality of QUALITY_ORDER) {
			for (let rootPc = 0; rootPc < 12; rootPc += 1) {
				for (const voicing of getVoicings(rootPc, quality)) {
					for (const string of voicing.strings) {
						if (string.fret < 0) {
							continue;
						}

						expect(string.interval).not.toBe("color");
					}
				}
			}
		}
	});

	it("only returns shapes a hand can actually make", () => {
		for (const quality of QUALITY_ORDER) {
			for (let rootPc = 0; rootPc < 12; rootPc += 1) {
				for (const voicing of getVoicings(rootPc, quality)) {
					const sounded = voicing.frets.filter((fret) => fret >= 0);
					const fingers = new Set(
						voicing.fingers.filter((finger) => finger !== ""),
					);

					expect(sounded.length).toBeGreaterThanOrEqual(3);
					expect(voicing.fretSpan).toBeLessThanOrEqual(3);
					expect(fingers.size).toBeLessThanOrEqual(4);
				}
			}
		}
	});

	it("finds shapes that no CAGED template holds", () => {
		const families = new Set(
			QUALITY_ORDER.flatMap((quality) =>
				getVoicings(0, quality).map((voicing) => voicing.shapeFamily),
			),
		);
		const beyondCaged = [...families].filter(
			(family) => !CAGED_FAMILIES.includes(family as never),
		);

		expect(beyondCaged.length).toBeGreaterThan(0);
	});

	it("drops the fifth for a shell and never for a triad", () => {
		const shells = getVoicings(0, "maj7").filter(
			(voicing) => voicing.shapeFamily === "shell",
		);

		expect(shells.length).toBeGreaterThan(0);

		for (const shell of shells) {
			const pcs = shell.strings
				.filter((string) => string.fret >= 0)
				.map((string) => string.notePc);

			expect(pcs).not.toContain(7);
			expect(pcs).toContain(0);
			expect(pcs).toContain(11);
		}

		for (const voicing of getVoicings(0, "major")) {
			expect(voicing.shapeFamily).not.toBe("shell");
		}
	});

	it("still finds the CAGED shapes and labels them", () => {
		const openC = getVoicings(0, "major", ["C"]).find((voicing) =>
			voicing.frets.every((fret, index) => fret === [-1, 3, 2, 0, 1, 0][index]),
		);
		const barreF = getVoicings(5, "major", ["E"]).find((voicing) =>
			voicing.frets.every((fret, index) => fret === [1, 3, 3, 2, 1, 1][index]),
		);

		expect(openC?.shapeFamily).toBe("C");
		expect(barreF?.shapeFamily).toBe("E");
		// The index finger barres the first fret, the rest fall where a hand puts them.
		expect(barreF?.fingers).toEqual(["1", "3", "4", "2", "1", "1"]);
	});
});
