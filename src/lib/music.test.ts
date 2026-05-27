import { describe, expect, it } from "vitest";

import {
	chordInKeyDegrees,
	chordNotes,
	generatePracticeSet,
	getVoicings,
	parseChordSymbol,
	QUALITY_DEFINITIONS,
	type QualityId,
	SHAPE_FAMILIES,
} from "./music";

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
});
