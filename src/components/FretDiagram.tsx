import type { ChordVoicing, VoicedString } from "#/lib/music";

interface FretDiagramProps {
	voicing: ChordVoicing;
	leftHanded?: boolean;
	compact?: boolean;
}

const STRING_LABELS = ["E", "A", "D", "G", "B", "E"];
const VIEW_WIDTH = 360;
const VIEW_HEIGHT = 430;
const LEFT = 42;
const RIGHT = 28;
const TOP = 62;
const FRET_GAP = 52;
const STRING_GAP = (VIEW_WIDTH - LEFT - RIGHT) / 5;
const VISIBLE_FRETS = 5;
const FRET_LINES = [0, 1, 2, 3, 4, 5];

export function FretDiagram({
	voicing,
	leftHanded = false,
	compact = false,
}: FretDiagramProps) {
	const renderedStrings = leftHanded ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5];
	const stringsByIndex = new Map(
		voicing.strings.map((string) => [string.stringIndex, string]),
	);
	const visibleStrings = renderedStrings
		.map((stringIndex) => stringsByIndex.get(stringIndex))
		.filter((string): string is VoicedString => Boolean(string));

	function xForString(stringIndex: number) {
		const renderedIndex = renderedStrings.indexOf(stringIndex);
		return LEFT + renderedIndex * STRING_GAP;
	}

	function yForFret(fret: number) {
		return TOP + (fret - voicing.baseFret + 0.5) * FRET_GAP;
	}

	return (
		<figure className={compact ? "fret-diagram is-compact" : "fret-diagram"}>
			<svg
				aria-label={`${voicing.symbol} ${voicing.shapeFamily}-shape chord diagram. Frets ${voicing.frets.map((fret) => (fret < 0 ? "x" : fret)).join(", ")} from low E to high E.`}
				className="fret-diagram__svg"
				role="img"
				viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
			>
				{FRET_LINES.map((index) => {
					const y = TOP + index * FRET_GAP;
					const isNut = voicing.baseFret === 1 && index === 0;

					return (
						<line
							className={isNut ? "fret-diagram__nut" : "fret-diagram__fret"}
							key={`fret-${index}`}
							x1={LEFT}
							x2={VIEW_WIDTH - RIGHT}
							y1={y}
							y2={y}
						/>
					);
				})}

				{renderedStrings.map((stringIndex) => (
					<line
						className="fret-diagram__string"
						key={`string-${stringIndex}`}
						x1={xForString(stringIndex)}
						x2={xForString(stringIndex)}
						y1={TOP}
						y2={TOP + VISIBLE_FRETS * FRET_GAP}
					/>
				))}

				{voicing.baseFret > 1 ? (
					<text className="fret-diagram__base" x={10} y={TOP + 30}>
						{voicing.baseFret}fr
					</text>
				) : null}

				{voicing.barres.map((barre) => {
					const startX = xForString(barre.fromString);
					const endX = xForString(barre.toString);
					const y = yForFret(barre.fret);

					return (
						<g
							key={`barre-${barre.fret}-${barre.fromString}-${barre.toString}`}
						>
							<rect
								className="fret-diagram__barre"
								height={28}
								rx={14}
								width={Math.abs(endX - startX) + 28}
								x={Math.min(startX, endX) - 14}
								y={y - 14}
							/>
							<text
								className="fret-diagram__barre-label"
								x={Math.min(startX, endX) - 24}
								y={y + 4}
							>
								{barre.finger}
							</text>
						</g>
					);
				})}

				{visibleStrings.map((string) => {
					if (string.fret < 0) {
						return (
							<text
								className="fret-diagram__mute"
								key={`mute-${string.stringIndex}`}
								x={xForString(string.stringIndex)}
								y={32}
							>
								x
							</text>
						);
					}

					if (string.fret === 0) {
						return (
							<text
								className="fret-diagram__open"
								key={`open-${string.stringIndex}`}
								x={xForString(string.stringIndex)}
								y={32}
							>
								o
							</text>
						);
					}

					return null;
				})}

				{visibleStrings
					.filter((string) => string.fret > 0)
					.map((string) => {
						const x = xForString(string.stringIndex);
						const y = yForFret(string.fret);

						return (
							<g
								className={intervalClass(string.interval)}
								key={`dot-${string.stringIndex}-${string.fret}`}
							>
								<circle className="fret-diagram__dot" cx={x} cy={y} r={21} />
								<text className="fret-diagram__interval" x={x} y={y - 2}>
									{string.interval}
								</text>
								<text className="fret-diagram__note" x={x} y={y + 13}>
									{string.note}
								</text>
								{string.finger ? (
									<text className="fret-diagram__finger" x={x + 18} y={y - 18}>
										{string.finger}
									</text>
								) : null}
							</g>
						);
					})}

				{visibleStrings.map((string) => (
					<text
						className="fret-diagram__string-label"
						key={`label-${string.stringIndex}`}
						x={xForString(string.stringIndex)}
						y={VIEW_HEIGHT - 22}
					>
						{STRING_LABELS[string.stringIndex]}
					</text>
				))}
			</svg>

			{voicing.barres.length > 0 ? (
				<figcaption className="fret-diagram__caption">
					Barre: finger {voicing.barres[0].finger} at fret{" "}
					{voicing.barres[0].fret}
				</figcaption>
			) : (
				<figcaption className="fret-diagram__caption">
					Open and muted strings shown above the nut.
				</figcaption>
			)}
		</figure>
	);
}

function intervalClass(interval: string) {
	if (interval === "1") {
		return "fret-diagram__marker is-root";
	}

	if (interval.includes("3")) {
		return "fret-diagram__marker is-third";
	}

	if (interval.includes("5")) {
		return "fret-diagram__marker is-fifth";
	}

	if (interval.includes("7")) {
		return "fret-diagram__marker is-seventh";
	}

	return "fret-diagram__marker";
}
