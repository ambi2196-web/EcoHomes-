import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Html } from "@react-three/drei";
import * as THREE from "three";

// ── Zone colour palettes ───────────────────────────────────────────────────

const ZONE_PALETTE: Record<string, { wall: string; roof: string; ground: string; trim: string }> = {
  composite:  { wall: "#f5e6c8", roof: "#8b6914", ground: "#c8d89a", trim: "#7c5c2a" },
  hot_dry:    { wall: "#fdf8ed", roof: "#c4a264", ground: "#d4c4a0", trim: "#a0784a" },
  warm_humid: { wall: "#e8f5e9", roof: "#4a7c59", ground: "#a5d6a7", trim: "#2e6b40" },
  temperate:  { wall: "#fce4ec", roof: "#c62828", ground: "#aed581", trim: "#8d3b3b" },
  cold:       { wall: "#e8eaf6", roof: "#37474f", ground: "#b0bec5", trim: "#263238" },
};

// ── Sub-components ─────────────────────────────────────────────────────────

function Window({ position, width = 0.8, height = 0.9 }: {
  position: [number, number, number]; width?: number; height?: number;
}) {
  return (
    <group position={position}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[width + 0.08, height + 0.08, 0.04]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      {/* Glass */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[width, height, 0.02]} />
        <meshStandardMaterial color="#a8d4e6" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function Door({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[1.08, 2.28, 0.04]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      {/* Door panel */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[1.0, 2.2, 0.05]} />
        <meshStandardMaterial color="#8b6914" />
      </mesh>
      {/* Handle */}
      <mesh position={[0.35, -0.1, 0.07]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

function FlatRoof({ w, d, y, color }: { w: number; d: number; y: number; color: string }) {
  return (
    <group>
      {/* Roof slab */}
      <mesh position={[0, y + 0.1, 0]} castShadow>
        <boxGeometry args={[w + 0.4, 0.2, d + 0.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Parapet */}
      {[
        { pos: [0, y + 0.35, -(d / 2 + 0.2)], size: [w + 0.4, 0.3, 0.15] },
        { pos: [0, y + 0.35,  (d / 2 + 0.2)], size: [w + 0.4, 0.3, 0.15] },
        { pos: [-(w / 2 + 0.2), y + 0.35, 0], size: [0.15, 0.3, d + 0.4] },
        { pos: [ (w / 2 + 0.2), y + 0.35, 0], size: [0.15, 0.3, d + 0.4] },
      ].map((p, i) => (
        <mesh key={i} position={p.pos as [number,number,number]}>
          <boxGeometry args={p.size as [number,number,number]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

function GabledRoof({ w, d, y, color }: { w: number; d: number; y: number; color: string }) {
  const shape = new THREE.Shape();
  const h = 1.8;
  shape.moveTo(-w / 2 - 0.2, 0);
  shape.lineTo(0, h);
  shape.lineTo(w / 2 + 0.2, 0);
  shape.closePath();
  const extrudeSettings = { depth: d + 0.4, bevelEnabled: false };
  return (
    <mesh position={[0, y, -(d / 2 + 0.2)]} rotation={[0, 0, 0]} castShadow>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.7, 8, 8]} />
        <meshStandardMaterial color="#388e3c" />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 0.5, 8]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
    </group>
  );
}

function Compass() {
  return (
    <Html position={[0, 0.1, 0]} center style={{ pointerEvents: "none" }}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="30" fill="white" fillOpacity="0.85" stroke="#ccc" strokeWidth="1" />
        <text x="32" y="14" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#2e7d32">N</text>
        <text x="32" y="56" textAnchor="middle" fontSize="9" fill="#666">S</text>
        <text x="10" y="36" textAnchor="middle" fontSize="9" fill="#666">W</text>
        <text x="54" y="36" textAnchor="middle" fontSize="9" fill="#666">E</text>
        <polygon points="32,16 34,30 30,30" fill="#2e7d32" />
        <polygon points="32,48 34,34 30,34" fill="#aaa" />
      </svg>
    </Html>
  );
}

// ── Auto-rotate helper ─────────────────────────────────────────────────────

function AutoRotate({ enabled }: { enabled: boolean }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, delta) => {
    if (enabled && ref.current) ref.current.rotation.y += delta * 0.15;
  });
  return <group ref={ref} />;
}

// ── Main building ──────────────────────────────────────────────────────────

interface BuildingProps {
  plotAreaSqm: number;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  parkingBays: number;
  zone: string;
}

function Building({ plotAreaSqm, floors, bedrooms, bathrooms, parkingBays, zone }: BuildingProps) {
  const palette = ZONE_PALETTE[zone] || ZONE_PALETTE.composite;

  // Derive dimensions
  const aspect = 1.25;
  const plotW = Math.sqrt(plotAreaSqm * aspect);
  const plotD = plotAreaSqm / plotW;
  const bW = plotW * 0.65;
  const bD = plotD * 0.65;
  const floorH = 3.0;
  const totalH = floors * floorH;

  // Window positions on front facade (south face, z = -bD/2)
  const frontWindowCount = Math.min(bedrooms + 1, 5);
  const windowSpacing = bW / (frontWindowCount + 1);

  // Side windows
  const sideWindowCount = Math.min(floors + 1, 3);

  const isCold = zone === "cold" || zone === "temperate";

  return (
    <group>
      {/* ── Ground plane ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[plotW + 4, plotD + 4]} />
        <meshStandardMaterial color={palette.ground} />
      </mesh>

      {/* ── Driveway / path ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, plotD / 2 + 1]}>
        <planeGeometry args={[2.5, 4]} />
        <meshStandardMaterial color="#c8bca8" />
      </mesh>

      {/* ── Main building walls ── */}
      <mesh position={[0, totalH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[bW, totalH, bD]} />
        <meshStandardMaterial color={palette.wall} />
      </mesh>

      {/* ── Floor separators (visible lines) ── */}
      {Array.from({ length: floors - 1 }).map((_, i) => (
        <mesh key={i} position={[0, (i + 1) * floorH, 0]}>
          <boxGeometry args={[bW + 0.05, 0.15, bD + 0.05]} />
          <meshStandardMaterial color={palette.trim} />
        </mesh>
      ))}

      {/* ── Roof ── */}
      {isCold
        ? <GabledRoof w={bW} d={bD} y={totalH} color={palette.roof} />
        : <FlatRoof w={bW} d={bD} y={totalH} color={palette.roof} />}

      {/* ── Front facade windows ── */}
      {Array.from({ length: frontWindowCount }).map((_, i) => {
        const x = (i + 1) * windowSpacing - bW / 2;
        return Array.from({ length: floors }).map((_, f) => (
          <Window
            key={`fw-${i}-${f}`}
            position={[x, floorH * f + floorH / 2 + 0.1, -(bD / 2 + 0.01)]}
          />
        ));
      })}

      {/* ── Front door ── */}
      <Door position={[0, 1.1, -(bD / 2 + 0.01)]} />

      {/* ── Side windows (left) ── */}
      {Array.from({ length: sideWindowCount }).map((_, i) => {
        const z = (i + 1) * (bD / (sideWindowCount + 1)) - bD / 2;
        return (
          <Window
            key={`sw-${i}`}
            position={[-(bW / 2 + 0.01), totalH / 2, z]}
            width={0.7}
            height={0.85}
          />
        );
      })}

      {/* ── Parking slab ── */}
      {parkingBays > 0 && (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[bW / 2 + 1.5, 0, 0]}>
            <planeGeometry args={[parkingBays * 2.8, bD * 0.6]} />
            <meshStandardMaterial color="#b0a898" />
          </mesh>
          {/* Parking boundary line */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[bW / 2 + 0.01, 0.01, 0]}>
            <planeGeometry args={[0.06, bD * 0.6]} />
            <meshStandardMaterial color="#888" />
          </mesh>
        </>
      )}

      {/* ── Decorative trees ── */}
      <Tree position={[-plotW / 2 + 1.2, 0, plotD / 2 - 1.2]} />
      <Tree position={[ plotW / 2 - 1.2, 0, plotD / 2 - 1.2]} />
      {floors <= 2 && <Tree position={[-plotW / 2 + 1.2, 0, -plotD / 2 + 1.5]} />}

      {/* ── Compass (on ground, bottom corner) ── */}
      <group position={[-plotW / 2 + 1, 0, -plotD / 2 + 1]}>
        <Compass />
      </group>
    </group>
  );
}

// ── Canvas wrapper ─────────────────────────────────────────────────────────

export interface Home3DModelProps {
  plotAreaSqm: number;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  parkingBays: number;
  zone?: string;
}

export default function Home3DModel({
  plotAreaSqm = 150,
  floors = 2,
  bedrooms = 3,
  bathrooms = 2,
  parkingBays = 1,
  zone = "composite",
}: Home3DModelProps) {
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <div className="relative w-full" style={{ height: 480 }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[18, 14, 18]} fov={45} />
        <OrbitControls
          enablePan={false}
          minDistance={8}
          maxDistance={55}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
          onStart={() => setAutoRotate(false)}
        />

        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[15, 25, 10]}
          intensity={1.4}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-far={80}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
        />
        <hemisphereLight args={["#87CEEB", "#c8d89a", 0.4]} />

        {/* Scene */}
        <Suspense fallback={null}>
          <Building
            plotAreaSqm={plotAreaSqm}
            floors={floors}
            bedrooms={bedrooms}
            bathrooms={bathrooms}
            parkingBays={parkingBays}
            zone={zone}
          />
        </Suspense>

        {/* Subtle fog for depth */}
        <fog attach="fog" args={["#f0f4f0", 40, 90]} />
      </Canvas>

      {/* Controls hint */}
      <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white/70 rounded-lg px-2 py-1 pointer-events-none">
        Drag to rotate · Scroll to zoom
      </div>
      {autoRotate && (
        <div className="absolute bottom-3 left-3 text-xs text-gray-400 bg-white/70 rounded-lg px-2 py-1 pointer-events-none">
          Auto-rotating · click to take control
        </div>
      )}
    </div>
  );
}
