import type { ConceptMastery } from "@/lib/types";
import { MASTERY_STATES, masteryState } from "@/lib/memory/store";

const STATE_COLOR: Record<string, string> = {
  strong: "#3ecf8e",
  developing: "#ffc24b",
  weak: "#ff6b6b",
};

/**
 * Knowledge graph (spec §21): one of the most visually interesting screens.
 * Color states — 🟢 strong, 🟡 developing, 🔴 needs attention, ⚪ not studied.
 * Layout: simple parent/child tree rendered as SVG (no layout lib needed).
 */
export function KnowledgeGraph({ mastery }: { mastery: ConceptMastery[] }) {
  const roots = mastery.filter((m) => !m.parent);
  const childrenOf = (concept: string) =>
    mastery.filter((m) => m.parent === concept);

  type PlacedNode = { m: ConceptMastery; x: number; y: number };
  const nodes: PlacedNode[] = [];
  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];

  // Layer 1: roots spread across the top; Layer 2: children; Layer 3: grandchildren.
  const rootCount = roots.length;
  roots.forEach((root, ri) => {
    const rx = ((ri + 1) / (rootCount + 1)) * 760 + 20;
    const ry = 70;
    nodes.push({ m: root, x: rx, y: ry });

    const kids = childrenOf(root.concept);
    kids.forEach((kid, ki) => {
      const kx = rx - 110 + (ki * 220) / Math.max(1, kids.length - 1 || 1);
      const ky = 190;
      nodes.push({ m: kid, x: kx, y: ky });
      edges.push({ x1: rx, y1: ry, x2: kx, y2: ky });

      const grand = childrenOf(kid.concept);
      grand.forEach((g, gi) => {
        const gx = kx - 80 + (gi * 160) / Math.max(1, grand.length - 1 || 1);
        const gy = 300;
        nodes.push({ m: g, x: gx, y: gy });
        edges.push({ x1: kx, y1: ky, x2: gx, y2: gy });
      });
    });
  });

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox="0 0 800 380"
        className="mx-auto h-auto w-full min-w-[640px] max-w-3xl"
        role="img"
        aria-label="Knowledge graph of mastered concepts"
      >
        {edges.map((e, i) => (
          <line
            key={i}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke="rgba(18,34,75,0.18)"
            strokeWidth={2.5}
          />
        ))}
        {nodes.map(({ m, x, y }) => {
          const state = masteryState(m.mastery_score);
          const color = STATE_COLOR[state];
          return (
            <g key={m.concept}>
              <circle cx={x} cy={y} r={26} fill="#fff" stroke={color} strokeWidth={5} />
              <text
                x={x}
                y={y - 34}
                textAnchor="middle"
                className="fill-navy text-[13px] font-extrabold"
                style={{ fontFamily: "inherit" }}
              >
                {m.label}
              </text>
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                className="text-[11px] font-extrabold"
                fill={color}
              >
                {MASTERY_STATES[state].dot} {Math.round(m.mastery_score * 100)}%
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-center gap-4 text-xs font-bold text-navy/60">
        {(["strong", "developing", "weak"] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: STATE_COLOR[s] }}
            />
            {MASTERY_STATES[s].label}
          </span>
        ))}
      </div>
    </div>
  );
}
