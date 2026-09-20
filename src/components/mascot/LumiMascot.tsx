"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";

/**
 * Lumi — small floating AI creature (spec §40):
 * rounded body, expressive eyes, small antenna light, blue/orange accents.
 * Used across home, loading, empty states and tutor interactions (spec §41).
 */
function Creature({ thinking, mood }: { thinking: boolean; mood: "happy" | "neutral" }) {
  const group = useRef<Group>(null);
  const antennaTip = useRef<Mesh>(null);
  const t0 = useRef(Math.random() * 10);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + t0.current;
    if (group.current) {
      const speed = thinking ? 5.5 : 2.2;
      group.current.position.y = Math.sin(t * speed) * (thinking ? 0.14 : 0.08);
      group.current.rotation.y = Math.sin(t * 0.6) * 0.35;
      group.current.scale.setScalar(thinking ? 1 + Math.sin(t * 9) * 0.035 : 1);
    }
    if (antennaTip.current) {
      const mat = antennaTip.current.material as unknown as { emissiveIntensity: number };
      mat.emissiveIntensity = thinking ? 2.2 + Math.sin(t * 12) * 1.4 : 1.4 + Math.sin(t * 3) * 0.5;
    }
  });

  return (
    <group ref={group}>
      {/* body */}
      <mesh castShadow position={[0, -0.1, 0]} scale={[1, 0.92, 1]}>
        <sphereGeometry args={[1.05, 64, 64]} />
        <meshStandardMaterial color="#4fc3ff" roughness={0.35} metalness={0.05} />
      </mesh>
      {/* belly */}
      <mesh position={[0, -0.28, 0.62]} scale={[0.62, 0.5, 0.5]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#fff6ea" roughness={0.6} />
      </mesh>
      {/* eyes */}
      {[-0.34, 0.34].map((x) => (
        <group key={x} position={[x, 0.22, 0.88]}>
          <mesh>
            <sphereGeometry args={[0.2, 32, 32]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </mesh>
          <mesh position={[0, mood === "happy" ? -0.01 : 0, 0.13]}>
            <sphereGeometry args={[0.095, 32, 32]} />
            <meshStandardMaterial color="#12224b" roughness={0.1} />
          </mesh>
          <mesh position={[0.04, 0.05, 0.19]}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
      {/* cheeks */}
      {[-0.62, 0.62].map((x) => (
        <mesh key={x} position={[x, -0.05, 0.72]} scale={[0.16, 0.1, 0.06]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#ff9d85" roughness={0.8} transparent opacity={0.85} />
        </mesh>
      ))}
      {/* antenna */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 0.5, 16]} />
        <meshStandardMaterial color="#12224b" />
      </mesh>
      <mesh ref={antennaTip} position={[0, 1.32, 0]}>
        <sphereGeometry args={[0.13, 32, 32]} />
        <meshStandardMaterial
          color="#ff7a59"
          emissive="#ff7a59"
          emissiveIntensity={1.4}
          roughness={0.3}
        />
      </mesh>
      {/* little feet */}
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, -1.02, 0.1]} scale={[0.9, 0.55, 1]}>
          <sphereGeometry args={[0.18, 24, 24]} />
          <meshStandardMaterial color="#1a9de8" roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

export default function LumiMascot({
  thinking = false,
  mood = "happy",
  className = "",
}: {
  thinking?: boolean;
  mood?: "happy" | "neutral";
  className?: string;
}) {
  return (
    <div className={`h-64 w-64 ${className}`} aria-label="Lumi, your AI tutor mascot">
      <Canvas camera={{ position: [0, 0.4, 4.2], fov: 42 }} dpr={[1, 2]}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 4]} intensity={1.4} />
        <directionalLight position={[-4, -2, -3]} intensity={0.4} color="#ff7a59" />
        <Creature thinking={thinking} mood={mood} />
      </Canvas>
    </div>
  );
}
