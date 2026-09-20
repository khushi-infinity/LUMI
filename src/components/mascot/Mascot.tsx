"use client";

import dynamic from "next/dynamic";

/** 3D runs client-side only; a friendly placeholder shows while it loads. */
const LumiMascot = dynamic(() => import("@/components/mascot/LumiMascot"), {
  ssr: false,
  loading: () => (
    <div
      className="grid h-64 w-64 place-items-center rounded-full bg-white/40 text-6xl"
      aria-label="Lumi is waking up"
    >
      🤖
    </div>
  ),
});

export default function Mascot(props: {
  thinking?: boolean;
  mood?: "happy" | "neutral";
  className?: string;
}) {
  return <LumiMascot {...props} />;
}
