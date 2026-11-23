import {
	type CagedFamily,
	type KeyMode,
	NECK_FRETS,
	type NeckMap,
	type NeckNote,
	type NeckSpan,
} from "#/lib/music";

export type NeckLabel = "degree" | "note";

interface NeckDiagramProps {
	map: NeckMap;
	mode: KeyMode;
	label: string;
	enabledShapes: CagedFamily[];
	noteLabel?: NeckLabel;
	leftHanded?: boolean;
}

const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];
const PAD_LEFT = 30;
const OPEN_WIDTH = 44;
const FRET_WIDTH = 62;
const PAD_RIGHT = 18;
const NUT_X = PAD_LEFT + OPEN_WIDTH;
const VIEW_WIDTH = NUT_X + NECK_FRETS * FRET_WIDTH + PAD_RIGHT;
const LANE_HEIGHT = 22;
const LANE_GAP = 4;
const HEADER_TOP = 6;
const STRING_GAP = 34;
const BOARD_HEIGHT = 5 * STRING_GAP;
const DOT_RADIUS = 13;
const INLAYS = [3, 5, 7, 9, 15];
const FRETS = Array.from({ length: NECK_FRETS + 1 }, (_, fret) => fret);
const STRINGS = [0, 1, 2, 3, 4, 5];

export function NeckDiagram({
	map,
	mode,
	label,
	enabledShapes,
	noteLabel = "degree",
	leftHanded = false,
}: NeckDiagramProps) {
	const enabled = new Set(enabledShapes);
	const spans = map.spans.filter((span) => enabled.has(span.shape));
	const lanes = assignLanes(spans);
	const laneCount = Math.max(1, ...lanes.map((lane) => lane + 1));
	const boardTop = HEADER_TOP + laneCount * (LANE_HEIGHT + LANE_GAP) + 14;
	const hasLabels = map.groups.some((group) => group.label);
	const viewHeight = boardTop + BOARD_HEIGHT + (hasLabels ? 64 : 40);

	const notes = map.notes
		.map((note) => ({
			...note,
			shapes: note.shapes.filter((shape) => enabled.has(shape)),
		}))
		.filter((note) => note.shapes.length > 0);
	const notesById = new Map(notes.map((note) => [note.id, note]));
	const groups = map.groups
		.map((group) => ({
			...group,
			shapes: group.shapes.filter((shape) => enabled.has(shape)),
			points: group.noteIds
				.map((id) => notesById.get(id))
				.filter((note): note is NeckNote => Boolean(note)),
		}))
		.filter((group) => group.shapes.length > 0 && group.points.length > 1);

	function flip(x: number) {
		return leftHanded ? VIEW_WIDTH - x : x;
	}

	function fretLineX(line: number) {
		return flip(NUT_X + line * FRET_WIDTH);
	}

	function noteX(fret: number) {
		return flip(
			fret === 0
				? PAD_LEFT + OPEN_WIDTH / 2
				: NUT_X + (fret - 0.5) * FRET_WIDTH,
		);
	}

	function stringY(stringIndex: number) {
		return boardTop + (5 - stringIndex) * STRING_GAP;
	}

	const suffix = mode === "minor" ? "m" : "";

	return (
		<figure className="neck-diagram">
			<div className="neck-diagram__scroll">
				<svg
					aria-label={label}
					className="neck-diagram__svg"
					role="img"
					viewBox={`0 0 ${VIEW_WIDTH} ${viewHeight}`}
				>
					{spans.map((span, index) => {
						const y = HEADER_TOP + lanes[index] * (LANE_HEIGHT + LANE_GAP);
						const left =
							span.from === 0 ? flip(PAD_LEFT) : fretLineX(span.from - 1);
						const right = fretLineX(span.to);
						const x = Math.min(left, right);
						const width = Math.abs(right - left);

						return (
							<g
								className={`neck-span is-${span.shape.toLowerCase()}`}
								key={`span-${span.shape}-${span.from}`}
							>
								<rect height={LANE_HEIGHT} rx={5} width={width} x={x} y={y} />
								{width > 34 ? (
									<text x={x + width / 2} y={y + LANE_HEIGHT / 2 + 4}>
										{width > 90
											? `${span.shape}${suffix} shape`
											: `${span.shape}${suffix}`}
									</text>
								) : null}
							</g>
						);
					})}

					<rect
						className="neck-diagram__board"
						height={BOARD_HEIGHT + 24}
						width={NECK_FRETS * FRET_WIDTH}
						x={Math.min(fretLineX(0), fretLineX(NECK_FRETS))}
						y={boardTop - 12}
					/>

					{INLAYS.map((fret) => (
						<circle
							className="neck-diagram__inlay"
							cx={noteX(fret)}
							cy={boardTop + BOARD_HEIGHT / 2}
							key={`inlay-${fret}`}
							r={6}
						/>
					))}
					{[1.5, 3.5].map((gap) => (
						<circle
							className="neck-diagram__inlay"
							cx={noteX(12)}
							cy={boardTop + gap * STRING_GAP}
							key={`inlay-12-${gap}`}
							r={6}
						/>
					))}

					{FRETS.map((line) => (
						<line
							className={
								line === 0 ? "neck-diagram__nut" : "neck-diagram__fret"
							}
							key={`fret-${line}`}
							x1={fretLineX(line)}
							x2={fretLineX(line)}
							y1={boardTop - 12}
							y2={boardTop + BOARD_HEIGHT + 12}
						/>
					))}

					{STRINGS.map((stringIndex) => (
						<g key={`string-${stringIndex}`}>
							<line
								className="neck-diagram__string"
								strokeWidth={1 + (5 - stringIndex) * 0.32}
								x1={flip(PAD_LEFT)}
								x2={fretLineX(NECK_FRETS)}
								y1={stringY(stringIndex)}
								y2={stringY(stringIndex)}
							/>
							<text
								className="neck-diagram__string-label"
								x={flip(PAD_LEFT - 16)}
								y={stringY(stringIndex) + 4}
							>
								{STRING_NAMES[stringIndex]}
							</text>
						</g>
					))}

					{FRETS.map((fret) => (
						<text
							className="neck-diagram__fret-number"
							key={`fret-number-${fret}`}
							x={noteX(fret)}
							y={boardTop + BOARD_HEIGHT + 32}
						>
							{fret}
						</text>
					))}

					{groups.map((group) => (
						<polyline
							className={`neck-line is-${group.shapes[0].toLowerCase()} is-${group.kind}`}
							key={group.id}
							points={group.points
								.map(
									(note) => `${noteX(note.fret)},${stringY(note.stringIndex)}`,
								)
								.join(" ")}
						/>
					))}

					{groups.map((group) =>
						group.label ? (
							<text
								className="neck-diagram__group-label"
								key={`label-${group.id}`}
								x={
									group.points.reduce(
										(sum, note) => sum + noteX(note.fret),
										0,
									) / group.points.length
								}
								y={boardTop + BOARD_HEIGHT + 56}
							>
								{group.label}
							</text>
						) : null,
					)}

					{notes.map((note) => (
						<NeckDot
							cx={noteX(note.fret)}
							cy={stringY(note.stringIndex)}
							key={note.id}
							label={noteLabel === "note" ? note.note : note.degree}
							note={note}
							shapes={leftHanded ? [...note.shapes].reverse() : note.shapes}
						/>
					))}
				</svg>
			</div>
		</figure>
	);
}

function NeckDot({
	note,
	shapes,
	cx,
	cy,
	label,
}: {
	note: NeckNote;
	shapes: CagedFamily[];
	cx: number;
	cy: number;
	label: string;
}) {
	const classes = [
		"neck-dot",
		note.isRoot ? "is-root" : "",
		note.isAlternate ? "is-alternate" : "",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<g className={classes}>
			<title>
				{`${note.note} (${note.degree}), string ${6 - note.stringIndex} fret ${note.fret}: ${shapes.map((shape) => `${shape} shape`).join(", ")}`}
			</title>
			{shapes.length === 1 ? (
				<circle
					className={`neck-dot__fill is-${shapes[0].toLowerCase()}`}
					cx={cx}
					cy={cy}
					r={DOT_RADIUS}
				/>
			) : (
				shapes.map((shape, index) => (
					<path
						className={`neck-dot__fill is-${shape.toLowerCase()}`}
						d={wedgePath(cx, cy, DOT_RADIUS, index, shapes.length)}
						key={shape}
					/>
				))
			)}
			<circle className="neck-dot__ring" cx={cx} cy={cy} r={DOT_RADIUS} />
			<text className="neck-dot__label" x={cx} y={cy + 4}>
				{label}
			</text>
		</g>
	);
}

// Slices start at the top and run anticlockwise, so two shapes split into a
// left half and a right half, with the shape nearer the nut on the left.
function wedgePath(
	cx: number,
	cy: number,
	r: number,
	index: number,
	count: number,
) {
	const start = Math.PI + (index * 2 * Math.PI) / count;
	const end = Math.PI + ((index + 1) * 2 * Math.PI) / count;
	const point = (angle: number) => {
		const x = (cx + r * Math.sin(angle)).toFixed(2);
		const y = (cy + r * Math.cos(angle)).toFixed(2);
		return `${x} ${y}`;
	};
	const largeArc = end - start > Math.PI ? 1 : 0;
	const arc = `A ${r} ${r} 0 ${largeArc} 0 ${point(end)}`;

	return `M ${cx} ${cy} L ${point(start)} ${arc} Z`;
}

function assignLanes(spans: NeckSpan[]) {
	const laneEnds: number[] = [];

	return spans.map((span) => {
		const lane = laneEnds.findIndex((end) => end < span.from);
		const chosen = lane >= 0 ? lane : laneEnds.length;
		laneEnds[chosen] = span.to;
		return chosen;
	});
}
