import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

function Field({ position, size, color }: { position: [number, number, number]; size: [number, number, number]; color: string }) {
  return (
    <mesh position={position} receiveShadow castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.92} />
    </mesh>
  );
}

function PalmTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.14, 1.7, 7]} />
        <meshStandardMaterial color="#79583b" roughness={1} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => (
        <mesh key={index} position={[Math.cos((index / 7) * Math.PI * 2) * 0.36, 1.65, Math.sin((index / 7) * Math.PI * 2) * 0.36]} rotation={[0.35, (index / 7) * Math.PI * 2, -0.45]} castShadow>
          <coneGeometry args={[0.13, 1.05, 5]} />
          <meshStandardMaterial color={index % 2 ? '#397548' : '#4d8a4e'} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function VillageHouse({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.05, 0.84, 0.9]} />
        <meshStandardMaterial color="#d9bd91" roughness={0.96} />
      </mesh>
      <mesh position={[0, 1.02, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.82, 0.65, 4]} />
        <meshStandardMaterial color="#a65335" roughness={0.9} />
      </mesh>
      <mesh position={[0.18, 0.25, 0.456]}>
        <boxGeometry args={[0.2, 0.42, 0.025]} />
        <meshStandardMaterial color="#67452e" roughness={1} />
      </mesh>
    </group>
  );
}

function FarmScene() {
  const rows = [];
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 13; col += 1) {
      const x = col * 0.72 - 4.4;
      const z = row * 0.58 - 2.3;
      const shade = (row + col) % 3;
      rows.push(
        <group key={`${row}-${col}`} position={[x, 0.05, z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[0.035, 0.42]} />
            <meshStandardMaterial color={shade === 0 ? '#6f9f42' : '#8cb65a'} roughness={1} />
          </mesh>
        </group>
      );
    }
  }

  return (
    <>
      <color attach="background" args={['#c4e2dc']} />
      <fog attach="fog" args={['#c4e2dc', 12, 24]} />
      <ambientLight intensity={1.25} />
      <directionalLight position={[5, 10, 5]} intensity={2.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <hemisphereLight args={['#e4f5ff', '#7d9c52', 0.8]} />
      <group position={[0, -0.55, 0]} rotation={[-0.12, -0.18, 0]}>
        <Field position={[0, -0.08, 0]} size={[15, 0.18, 8]} color="#8d9f5b" />
        <Field position={[-1.8, 0.02, -0.7]} size={[7.5, 0.06, 4.9]} color="#537f3f" />
        <Field position={[2.9, 0.025, 0.7]} size={[5.2, 0.07, 4.8]} color="#6b9849" />
        <Field position={[-0.2, 0.045, -0.8]} size={[0.22, 0.05, 5.2]} color="#a9c5a1" />
        <Field position={[2.15, 0.05, 0.65]} size={[0.18, 0.05, 4.5]} color="#b5d1ad" />
        {rows}
        <VillageHouse position={[-4.4, 0.04, -1.6]} />
        <VillageHouse position={[-3.1, 0.04, -2.1]} />
        <PalmTree position={[-5.4, 0.02, 0.4]} scale={0.8} />
        <PalmTree position={[-2.5, 0.02, 1.9]} scale={0.68} />
        <PalmTree position={[4.7, 0.02, -1.8]} scale={0.88} />
        <PalmTree position={[5.5, 0.02, 1.4]} scale={0.7} />
      </group>
    </>
  );
}

export default function FarmWorld3D() {
  return (
    <section aria-label="Interactive 3D Indian farm landscape" className="relative isolate min-h-[250px] overflow-hidden rounded-[1.75rem] border border-emerald-900/10 bg-[#c4e2dc] shadow-[0_18px_50px_-28px_rgba(24,76,42,0.55)] sm:min-h-[300px]">
      <div className="absolute inset-0">
        <Canvas shadows camera={{ position: [7.8, 6.4, 9.2], fov: 35 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: false }}>
          <Suspense fallback={null}>
            <FarmScene />
          </Suspense>
        </Canvas>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#f4f8ed]/95 via-[#f4f8ed]/75 to-transparent sm:from-[#f4f8ed]/95 sm:via-[#f4f8ed]/65" />
      <div className="relative z-10 flex min-h-[250px] max-w-xl flex-col items-start justify-center p-5 sm:min-h-[300px] sm:p-8">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-800/10 bg-white/75 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          Your farm, in a new dimension
        </span>
        <h1 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight text-[#183b28] sm:text-4xl">
          Farming smarter starts with seeing the whole farm.
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[#3d5d49] sm:text-base">
          A living 3D farm view, alongside the crop, weather and financial insights that help guide your next decision.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-[#28543a]">
          <span className="rounded-full bg-white/80 px-3 py-2 shadow-sm">Crop health</span>
          <span className="rounded-full bg-white/80 px-3 py-2 shadow-sm">Soil & water</span>
          <span className="rounded-full bg-white/80 px-3 py-2 shadow-sm">Yield insights</span>
        </div>
      </div>
    </section>
  );
}
