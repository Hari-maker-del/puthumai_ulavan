import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import { Suspense, useMemo, useState, type ReactNode } from 'react';
import { DataTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';

type CropStage = 'seedling' | 'growing' | 'harvest';

const stageLabels: Record<CropStage, string> = {
  seedling: 'Young paddy',
  growing: 'Growing paddy',
  harvest: 'Golden harvest',
};

function Field({ position, size, color, roughness = 0.92, map }: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  roughness?: number;
  map?: Texture;
}) {
  return (
    <mesh position={position} receiveShadow castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} map={map} bumpMap={map} bumpScale={map ? 0.025 : 0} roughness={roughness} />
    </mesh>
  );
}

function RiceClump({ position, stage, variation = 0 }: {
  position: [number, number, number];
  stage: CropStage;
  variation?: number;
}) {
  const height = stage === 'seedling' ? 0.19 : stage === 'growing' ? 0.36 : 0.44;
  const leafColor = stage === 'harvest'
    ? (variation % 2 ? '#c5a747' : '#d6bd5a')
    : (variation % 2 ? '#4d853d' : '#75a94b');

  return (
    <group position={position}>
      {Array.from({ length: 5 }, (_, index) => {
        const angle = (index / 5) * Math.PI * 2 + variation * 0.4;
        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * 0.045, height * 0.48, Math.sin(angle) * 0.045]}
            rotation={[0.16 + (index % 2) * 0.13, angle, -0.22 + (index % 3) * 0.14]}
            castShadow
          >
            <coneGeometry args={[0.025, height, 5]} />
            <meshStandardMaterial color={leafColor} roughness={0.95} />
          </mesh>
        );
      })}
      {stage === 'harvest' && (
        <mesh position={[0, height * 0.93, 0]} rotation={[0.2, variation, 0.28]} castShadow>
          <coneGeometry args={[0.045, 0.18, 5]} />
          <meshStandardMaterial color="#e2c86b" roughness={0.9} />
        </mesh>
      )}
    </group>
  );
}

function CoconutTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.95, 0]} rotation={[0, 0, -0.07]} castShadow>
        <cylinderGeometry args={[0.09, 0.15, 1.9, 9]} />
        <meshStandardMaterial color="#79563a" roughness={0.96} />
      </mesh>
      {Array.from({ length: 9 }, (_, index) => {
        const angle = (index / 9) * Math.PI * 2;
        return (
          <group key={index} position={[Math.cos(angle) * 0.08, 1.88, Math.sin(angle) * 0.08]} rotation={[0.12, -angle, -0.55]}>
            <mesh position={[0.27, -0.12, 0]} rotation={[0, 0, -0.08]} castShadow>
              <coneGeometry args={[0.105, 0.86, 5]} />
              <meshStandardMaterial color={index % 2 ? '#286b3c' : '#43844a'} roughness={0.92} />
            </mesh>
          </group>
        );
      })}
      {Array.from({ length: 3 }, (_, index) => (
        <mesh key={index} position={[Math.cos(index * 2.1) * 0.13, 1.72, Math.sin(index * 2.1) * 0.13]} castShadow>
          <sphereGeometry args={[0.075, 8, 7]} />
          <meshStandardMaterial color="#6e7c36" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function BananaPlant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.15, 0.8, 8]} />
        <meshStandardMaterial color="#7b8050" roughness={0.95} />
      </mesh>
      {Array.from({ length: 6 }, (_, index) => {
        const angle = (index / 6) * Math.PI * 2;
        return (
          <mesh key={index} position={[Math.cos(angle) * 0.3, 0.84 + (index % 2) * 0.08, Math.sin(angle) * 0.3]} rotation={[0.16, angle, -0.62 + (index % 3) * 0.2]} castShadow>
            <coneGeometry args={[0.13, 1.05, 5]} />
            <meshStandardMaterial color={index % 2 ? '#427b3d' : '#5d9146'} roughness={0.9} side={2} />
          </mesh>
        );
      })}
    </group>
  );
}

function VillageHouse({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.08, 0.84, 0.94]} />
        <meshStandardMaterial color="#d7bd92" roughness={0.98} />
      </mesh>
      <mesh position={[0, 0.97, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.83, 0.62, 4]} />
        <meshStandardMaterial color="#a54e32" roughness={0.94} />
      </mesh>
      <mesh position={[0.18, 0.25, 0.476]}>
        <boxGeometry args={[0.2, 0.42, 0.025]} />
        <meshStandardMaterial color="#65442f" roughness={1} />
      </mesh>
      {[-0.31, 0.34].map((x) => (
        <mesh key={x} position={[x, 0.56, 0.477]}>
          <boxGeometry args={[0.16, 0.17, 0.026]} />
          <meshStandardMaterial color="#7c9a94" roughness={0.4} metalness={0.05} />
        </mesh>
      ))}
      <mesh position={[0, 0.035, 0.52]} receiveShadow>
        <boxGeometry args={[1.35, 0.07, 1.12]} />
        <meshStandardMaterial color="#9d8a6a" roughness={1} />
      </mesh>
    </group>
  );
}

function createProceduralTexture(
  base: [number, number, number],
  variation: number,
  repeat: [number, number],
): DataTexture {
  const size = 128;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      // Deterministic pixel noise gives the scene a textured surface without remote assets.
      const seed = (Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263)) >>> 0;
      const noise = ((Math.imul(seed ^ (seed >>> 13), 1274126177) >>> 0) % (variation * 2 + 1)) - variation;
      data[index] = Math.max(0, Math.min(255, base[0] + noise));
      data[index + 1] = Math.max(0, Math.min(255, base[1] + noise));
      data[index + 2] = Math.max(0, Math.min(255, base[2] + noise));
      data[index + 3] = 255;
    }
  }

  const texture = new DataTexture(data, size, size);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function FarmScene({ stage }: { stage: CropStage }) {
  const earthTexture = useMemo(() => createProceduralTexture([126, 101, 67], 24, [7, 4]), []);
  const grassTexture = useMemo(() => createProceduralTexture([104, 130, 69], 19, [6, 3]), []);
  const crops: ReactNode[] = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 11; col += 1) {
      const x = col * 0.38 - 2.0;
      const z = row * 0.39 - 1.42;
      crops.push(
        <RiceClump key={`rice-${row}-${col}`} position={[x, 0.08, z]} stage={stage} variation={(row * 3 + col) % 5} />
      );
    }
  }

  const secondPlot: ReactNode[] = [];
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      secondPlot.push(
        <RiceClump
          key={`second-${row}-${col}`}
          position={[2.45 + col * 0.31, 0.08, -1.15 + row * 0.42]}
          stage={stage}
          variation={(row + col * 2) % 5}
        />
      );
    }
  }

  return (
    <>
      <Sky
        distance={450000}
        sunPosition={[90, 24, 70]}
        inclination={0.48}
        azimuth={0.22}
        turbidity={7.5}
        rayleigh={2.2}
        mieCoefficient={0.004}
        mieDirectionalG={0.82}
      />
      <fog attach="fog" args={['#c8dfd9', 15, 32]} />
      <ambientLight intensity={0.48} />
      <hemisphereLight args={['#e8f4ff', '#68794a', 1.2]} />
      <directionalLight
        position={[7, 12, 5]}
        intensity={2.7}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.00015}
      />
      <group position={[0, -0.58, 0]} rotation={[-0.08, -0.16, 0]}>
        {/* Uneven earth base and raised, muddy field bunds */}
        <Field position={[0, -0.12, 0]} size={[15.5, 0.32, 8.5]} color="#ffffff" map={grassTexture} />
        <Field position={[-0.15, -0.005, -0.02]} size={[5.0, 0.13, 3.55]} color="#ffffff" map={earthTexture} />
        <Field position={[3.55, -0.005, 0.04]} size={[3.0, 0.13, 3.35]} color="#ffffff" map={earthTexture} />

        {/* Shallow paddy water with narrow raised soil borders */}
        <Field position={[-0.15, 0.068, -0.02]} size={[4.75, 0.025, 3.28]} color="#7fae9d" roughness={0.22} />
        <Field position={[3.55, 0.068, 0.04]} size={[2.78, 0.025, 3.08]} color="#8ab6a5" roughness={0.2} />
        {/* Soft surface rings suggest breeze and small movement in the shallow water. */}
        {[
          [-1.45, -0.75, 0.2],
          [0.75, 0.55, 0.16],
          [3.25, -0.62, 0.18],
          [4.1, 0.62, 0.12],
        ].map(([x, z, radius], index) => (
          <mesh key={`water-ripple-${index}`} position={[x, 0.086, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius * 0.7, radius, 32]} />
            <meshBasicMaterial color="#d7eee1" transparent opacity={0.42} side={2} />
          </mesh>
        ))}
        <Field position={[-0.15, 0.09, -1.78]} size={[5.0, 0.1, 0.12]} color="#8a7652" />
        <Field position={[-0.15, 0.09, 1.74]} size={[5.0, 0.1, 0.12]} color="#8a7652" />
        <Field position={[-2.68, 0.09, -0.02]} size={[0.12, 0.1, 3.55]} color="#8a7652" />
        <Field position={[2.36, 0.09, -0.02]} size={[0.12, 0.1, 3.55]} color="#8a7652" />
        <Field position={[3.55, 0.09, -1.68]} size={[3.0, 0.1, 0.12]} color="#8a7652" />
        <Field position={[3.55, 0.09, 1.76]} size={[3.0, 0.1, 0.12]} color="#8a7652" />

        {/* Narrow irrigation channel crossing the foreground */}
        <Field position={[0.45, 0.015, 2.42]} size={[11.7, 0.1, 0.42]} color="#8a7652" />
        <Field position={[0.45, 0.073, 2.42]} size={[11.45, 0.025, 0.27]} color="#5d9f9e" roughness={0.18} />
        <Field position={[-5.35, 0.1, 2.42]} size={[0.14, 0.15, 0.48]} color="#a18b64" />
        <Field position={[6.25, 0.1, 2.42]} size={[0.14, 0.15, 0.48]} color="#a18b64" />

        {crops}
        {secondPlot}
        {/* Farm access track */}
        <Field position={[0.4, 0.04, 3.05]} size={[11.8, 0.08, 0.42]} color="#ffffff" map={earthTexture} />
        {/* Wheel-worn grooves and scattered stones break up the smooth access track. */}
        {[-0.1, 0.1].map((offset) => (
          <Field key={offset} position={[0.4, 0.083, 3.05 + offset]} size={[11.45, 0.012, 0.025]} color="#8e7958" />
        ))}
        {Array.from({ length: 18 }, (_, index) => (
          <mesh
            key={`track-stone-${index}`}
            position={[-5.1 + index * 0.62, 0.09, 2.86 + (index % 3) * 0.17]}
            rotation={[0, index * 0.7, 0]}
            scale={[0.7 + (index % 3) * 0.2, 0.5, 0.7]}
            receiveShadow
          >
            <dodecahedronGeometry args={[0.055, 0]} />
            <meshStandardMaterial color={index % 2 ? '#887d68' : '#a79b7f'} roughness={1} />
          </mesh>
        ))}

        <VillageHouse position={[-4.7, 0.02, -1.7]} />
        <VillageHouse position={[-3.45, 0.02, -2.25]} />
        <CoconutTree position={[-5.7, 0.02, 0.15]} scale={0.85} />
        <CoconutTree position={[-3.1, 0.02, 2.95]} scale={0.66} />
        <CoconutTree position={[5.3, 0.02, -1.7]} scale={0.92} />
        <CoconutTree position={[6.0, 0.02, 1.25]} scale={0.7} />
        <BananaPlant position={[-4.8, 0.02, 1.25]} scale={0.72} />
        <BananaPlant position={[4.65, 0.02, 2.95]} scale={0.78} />

        {/* Distant green ridgeline gives the scene a rural horizon */}
        <mesh position={[-4.9, 1.25, -5.4]} scale={[3.8, 1.3, 0.5]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color="#7d9e78" roughness={1} />
        </mesh>
        <mesh position={[0.2, 1.05, -5.7]} scale={[4.8, 1.0, 0.55]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color="#92ad88" roughness={1} />
        </mesh>
        <mesh position={[4.9, 1.35, -5.4]} scale={[3.2, 1.25, 0.5]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color="#779778" roughness={1} />
        </mesh>
      </group>
    </>
  );
}

export default function FarmWorld3D() {
  const [stage, setStage] = useState<CropStage>('growing');

  return (
    <section aria-label="Interactive 3D Indian farm landscape" className="relative isolate min-h-[300px] overflow-hidden rounded-[1.75rem] border border-emerald-900/10 bg-[#b8d8d5] shadow-[0_18px_50px_-28px_rgba(24,76,42,0.55)] sm:min-h-[360px]">
      <div className="absolute inset-0">
        <Canvas shadows camera={{ position: [7.8, 6.4, 9.2], fov: 35 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: false }}>
          <Suspense fallback={null}>
            <FarmScene stage={stage} />
            <OrbitControls enablePan={false} minDistance={8} maxDistance={17} minPolarAngle={0.45} maxPolarAngle={Math.PI / 2.05} />
          </Suspense>
        </Canvas>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#f4f8ed]/95 via-[#f4f8ed]/78 to-transparent sm:from-[#f4f8ed]/95 sm:via-[#f4f8ed]/68" />
      <div className="relative z-10 flex min-h-[300px] max-w-xl flex-col items-start justify-center p-5 sm:min-h-[360px] sm:p-8">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-800/10 bg-white/75 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          Tamil Nadu farm world
        </span>
        <h1 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight text-[#183b28] sm:text-4xl">
          A closer view of life in the fields.
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[#3d5d49] sm:text-base">
          Explore paddy plots, village homes, coconut groves and irrigation channels. Drag to rotate and use the wheel or pinch to zoom.
        </p>
        <div className="pointer-events-auto mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#315b3d]">Visual crop stage</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a visual crop growth stage">
            {(['seedling', 'growing', 'harvest'] as CropStage[]).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={stage === option}
                onClick={() => setStage(option)}
                className={`rounded-full border px-3 py-2 text-xs font-bold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${stage === option ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-emerald-900/10 bg-white/85 text-[#28543a] hover:bg-white'}`}
              >
                {stageLabels[option]}
              </button>
            ))}
          </div>
          <p className="mt-2 max-w-sm text-[11px] leading-4 text-[#4c6653]">Illustrative scene only. This selector does not change or report your actual crop records.</p>
        </div>
      </div>
    </section>
  );
}
