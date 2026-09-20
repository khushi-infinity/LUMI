import type { PlanItem } from "@/lib/types";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`card p-6 ${className}`}>{children}</section>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-lg font-extrabold uppercase tracking-wide text-navy/70">
      {children}
    </h2>
  );
}

export function ProgressBar({
  percent,
  caption,
}: {
  percent: number;
  caption?: string;
}) {
  const p = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <div>
      <div className="progress-track h-4 w-full">
        <div className="progress-fill h-full" style={{ width: `${p}%` }} />
      </div>
      {caption ? (
        <p className="mt-2 text-sm font-bold text-navy/70">{caption}</p>
      ) : null}
    </div>
  );
}

const KIND_META: Record<PlanItem["kind"], { icon: string; done: string; todo: string }> = {
  learn: { icon: "📘", done: "line-through opacity-50", todo: "" },
  practice: { icon: "🏋️", done: "line-through opacity-50", todo: "" },
  revise: { icon: "🔁", done: "line-through opacity-50", todo: "" },
  mock: { icon: "🎯", done: "line-through opacity-50", todo: "" },
};

export function PlanList({ items }: { items: PlanItem[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3 text-navy">
          <span aria-hidden className="mt-0.5 text-lg">
            {item.done ? "✅" : KIND_META[item.kind].icon}
          </span>
          <div>
            <span
              className={`font-bold ${item.done ? KIND_META[item.kind].done : ""}`}
            >
              {item.title}
            </span>
            {item.reason ? (
              <p className="text-xs font-semibold text-rose-low">{item.reason}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
