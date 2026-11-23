import { describe, expect, it } from "vitest";

import { NECK_STRING_SETS, QUALITY_ORDER, ROUTINE_VIEWS } from "./music";
import {
	chordFromSearch,
	chordToSearch,
	DEFAULT_CHORD,
	DEFAULT_ROUTINE,
	type RoutineState,
	routineFromSearch,
	routineToSearch,
	validateAppSearch,
} from "./url-state";

function roundTrip(routine: RoutineState) {
	const search = validateAppSearch(
		routineToSearch(routine) as Record<string, unknown>,
	);
	return routineFromSearch(search);
}

describe("URL state", () => {
	it("keeps the default routine out of the URL", () => {
		const search = routineToSearch(DEFAULT_ROUTINE);

		expect(Object.values(search).every((value) => value === undefined)).toBe(
			true,
		);
		expect(roundTrip(DEFAULT_ROUTINE)).toEqual(DEFAULT_ROUTINE);
	});

	it("round-trips every routine option through the URL", () => {
		const variants: RoutineState[] = [];

		for (let tonicPc = 0; tonicPc < 12; tonicPc += 1) {
			variants.push({ ...DEFAULT_ROUTINE, tonicPc, mode: "major" });
		}
		for (const view of ROUTINE_VIEWS) {
			variants.push({ ...DEFAULT_ROUTINE, view: view.id, showAll: true });
		}
		for (const low of NECK_STRING_SETS.triads) {
			for (const triadInversion of [0, 1, 2] as const) {
				variants.push({
					...DEFAULT_ROUTINE,
					triadStrings: low,
					triadInversion,
				});
			}
		}
		for (const low of NECK_STRING_SETS.thirds) {
			variants.push({ ...DEFAULT_ROUTINE, thirdStrings: low });
		}
		for (const low of NECK_STRING_SETS.sixths) {
			variants.push({ ...DEFAULT_ROUTINE, sixthStrings: low });
		}
		variants.push(
			{ ...DEFAULT_ROUTINE, noteLabel: "note" },
			{ ...DEFAULT_ROUTINE, shapes: [] },
			{ ...DEFAULT_ROUTINE, shapes: ["A", "E"] },
		);

		for (const routine of variants) {
			expect(roundTrip(routine)).toEqual(routine);
		}
	});

	it("writes string sets the way guitarists number them", () => {
		const search = routineToSearch({
			...DEFAULT_ROUTINE,
			triadStrings: 3,
			thirdStrings: 0,
			sixthStrings: 0,
			shapes: ["C", "G"],
		});

		expect(search).toMatchObject({
			triads: "1-3",
			thirds: "5-6",
			sixths: "4-6",
			shapes: "CG",
		});
	});

	it("falls back to the saved routine only when the URL has none", () => {
		const saved: RoutineState = {
			...DEFAULT_ROUTINE,
			tonicPc: 7,
			mode: "major",
			view: "pentatonic",
		};

		expect(routineFromSearch({}, saved)).toEqual(saved);
		// Any routine param means the URL is complete, with gaps at defaults.
		expect(routineFromSearch({ view: "scale" }, saved)).toEqual({
			...DEFAULT_ROUTINE,
			view: "scale",
		});
	});

	it("round-trips every chord in the explorer", () => {
		for (let rootPc = 0; rootPc < 12; rootPc += 1) {
			for (const quality of QUALITY_ORDER) {
				const chord = chordToSearch(rootPc, quality);
				const search = validateAppSearch({ chord });

				expect(chordFromSearch(search)).toEqual({ rootPc, quality });
			}
		}
		expect(chordToSearch(DEFAULT_CHORD.rootPc, DEFAULT_CHORD.quality)).toBe(
			undefined,
		);
	});

	it("drops values it cannot read", () => {
		expect(
			validateAppSearch({
				tab: "nope",
				chord: "H7",
				shape: "Z",
				in: "Q",
				prog: "not-a-progression",
				key: "Dm",
				view: "everything",
				triads: "1-2",
				thirds: 7,
				shapes: "CXZ",
				all: "yes",
			}),
		).toEqual({});
		expect(
			validateAppSearch({
				tab: "routine",
				key: "Bb",
				mode: "major",
				all: true,
			}),
		).toEqual({ tab: "routine", key: "Bb", mode: "major", all: true });
	});
});
