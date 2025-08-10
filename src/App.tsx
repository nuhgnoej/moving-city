// /src/App.tsx (컨트롤 옵션 보강 + 새 파라미터 적용)
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import Scene from "./Scene";
import { useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import CameraRig from "./CameraRig";
import { Perf } from "r3f-perf";

export default function App() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <div style={{ height: "100vh", width: "100vw", background: "#0d0f1a" }}>
      <Canvas
        camera={{ position: [15, 15, 20], fov: 45, near: 0.1, far: 500 }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={["#0d0f1a"]} />
        <fog attach="fog" args={["#0d0f1a", 10, 120]} />

        <ambientLight intensity={0.6} />
        <directionalLight position={[20, 30, 10]} intensity={1.2} castShadow />

        <Scene />
        <Environment preset="city" />

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.1}
          enableZoom // ✅ 휠 줌 허용(기본 true지만 명시)
          minDistance={10} // ✅ 줌 최소/최대 범위
          maxDistance={120}
        />

        {/* 더 멀고 느린 시네마틱 */}
        <CameraRig
          controls={controlsRef}
          radius={48}
          height={18}
          duration={52}
          resumeDelayMs={700}
          smoothness={7}
        />

        <Perf position="top-left" />
      </Canvas>
    </div>
  );
}
