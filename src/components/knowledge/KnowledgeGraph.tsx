import type { ConceptMastery } from "@/lib/types";
import { MASTERY_STATES, masteryState } from "@/lib/memory/store";

const STATE_COLOR: Record<string, string> = {
  strong: "#3ecf8e",
  developing: "#ffc24b",
  weak: "#ff6b6b",
};

/**
 * Knowledge graph (spec §21). Color states: 🟢 strong, 🟡 developing,
 * 🔴 needs attention. Layout is a tidy tree: every leaf owns a horizontal
 * slot, parents center over their children, so nodes can never overlap
 * no matter how wide a subtree is.
 */
function layout(mastery: ConceptMastery[]) {
  const SLOT = 132;
  const TOP = 64;
  const DEPTH = 148;

  const childrenOf = (concept: string) =>
    mastery.filter((m) => m.parent === concept);
  const pos = new Map<string, { x: number; y: number }>();
  let cursor = 0;

  const place = (m: ConceptMastery, depth: number): number => {
    const kids = childrenOf(m.concept);
    const y = TOP + depth * DEPTH;
    if (kids.length === 0) {
      const x = SLOT / 2 + cursor * SLOT;
      cursor += 1;
      pos.set(m.concept, { x, y });
      return x;
    }
    const childXs = kids.map((k) => place(k, depth + 1));
    const x = (Math.min(...childXs) + Math.max(...childXs)) / 2;
    pos.set(m.concept, { x, y });
    return x;
  };

  mastery.filter((m) => !m.parent).forEach((m) => place(m, 0));
  // Stray nodes without a parent link still get a slot (defensive).
  mastery
    .filter((m) => m.parent && !pos.has(m.concept))
    .forEach((m) => {
      const x = SLOT / 2 + cursor * SLOT;
      cursor += 1;
      pos.set(m.concept, { x, y: TOP + 2 * DEPTH });
    });

  const width = Math.max(SLOT * cursor + 40, 640);
  const height = TOP + 2 * DEPTH + 90;
  return { pos, width, height };
}

/** Split a long label onto two lines so neighbors never collide. */
function Label({
  x,
  y,
  text,
}: {
  x: number;
  y: number;
  text: string;
}) {
  const words = text.split(" ");
  if (words.length < 2 || text.length <= 12) {
    return (
      <text x={x} y={y} textAnchor="middle" className="fill-navy text-[13px] font-extrabold">
        {text}
      </text>
    );
  }
  const mid = Math.ceil(words.length / 2);
  const l1 = words.slice(0, mid).join(" ");
  const l2 = words.slice(mid).join(" ");
  return (
    <text x={x} y={y - 6} textAnchor="middle" className="fill-navy text-[13px] font-extrabold">
      <tspan x={x} dy="0">{l1}</tspan>
      <tspan x={x} dy="14">{l2}</tspan>
    </text>
  );
}

export function KnowledgeGraph({ mastery }: { mastery: ConceptMastery[] }) {
  const { pos, width, height } = layout(mastery);
  const childrenOf = (concept: string) =>
    mastery.filter((m) => m.parent === concept);

  const edges = mastery
    .filter((m) => m.parent && pos.has(m.concept) && pos.has(m.parent))
    .map((m) => ({
      x1: pos.get(m.parent!)!.x,
      y1: pos.get(m.parent!)!.y,
      x2: pos.get(m.concept)!.x,
      y2: pos.get(m.concept)!.y,
    }));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto h-auto w-full min-w-[680px] max-w-4xl"
        role="img"
        aria-label="Knowledge graph of mastered concepts"
      >
        {edges.map((e, i) => (
          <line
            key={i}
            x1={e.x1}
            y1={e.y1 + 28}
            x2={e.x2}
            y2={e.y2 - 28}
            stroke="rgba(18,34,75,0.18)"
            strokeWidth={2.5}
          />
        ))}
        {mastery
          .filter((m) => pos.has(m.concept))
          .map((m) => {
            const { x, y } = pos.get(m.concept)!;
            const state = masteryState(m.mastery_score);
            const color = STATE_COLOR[state];
            const long = m.label.length > 12 && m.label.includes(" ");
            return (
              <g key={m.concept}>
                <Label x={x} y={long ? y - 40 : y - 36} text={m.label} />
                <circle cx={x} cy={y} r={26} fill="#fff" stroke={color} strokeWidth={5} />
                <text
                  x={x}
                  y={y + 4.5}
                  textAnchor="middle"
                  className="text-[11px] font-extrabold"
                  fill={color}
                >
                  {Math.round(m.mastery_score * 100)}%
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
