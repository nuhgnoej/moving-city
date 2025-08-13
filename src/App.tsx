// /src/App.tsx
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import CameraRig from "./CameraRig";
import Scene from "./Scene";
import HDRBackground from "./HDRBackground"; // ✅ 추가

export default function App() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <div style={{ height: "100vh", width: "100vw", background: "#000" }}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [15, 15, 20], fov: 180, near: 0.1, far: 500 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMappingExposure = 1.05; // 0.9~1.3에서 조절
        }}
      >
        {/* 1) 조명/반사용 Environment (PMREM) — 배경은 끔 */}
        <Environment
          files="/hdr/rogland_clear_night_4k.hdr"
          /* background */ blur={0}
        />

        {/* 2) 초선명 배경 — 원본 HDR을 그대로 백그라운드로 */}
        <HDRBackground url="/hdr/rogland_clear_night_4k.hdr" />

        <Scene />
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.1}
          minDistance={10}
          maxDistance={120}
        />
        <CameraRig
          controls={controlsRef}
          radius={62.7} // ✅ FOV에 맞춘 새 반경
          height={20}
          duration={56}
          smoothness={8}
        />
      </Canvas>
    </div>
  );
}
