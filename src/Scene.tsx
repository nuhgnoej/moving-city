// /src/Scene.tsx
import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CatmullRomCurve3, Object3D } from "three";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

// 간단한 "도시" 박스들 생성
function CityBlocks() {
  const blocks = useMemo(() => {
    const arr: {
      pos: [number, number, number];
      size: [number, number, number];
    }[] = [];
    const grid = 6; // 6x6
    const gap = 6;
    for (let x = -grid; x <= grid; x++) {
      for (let z = -grid; z <= grid; z++) {
        // 중앙 도로 공간 비우기
        if (Math.abs(x) < 2 && Math.abs(z) < 2) continue;
        const h = 1.5 + Math.random() * 8; // 빌딩 높이
        arr.push({
          pos: [x * gap, h / 2, z * gap],
          size: [2 + Math.random() * 2, h, 2 + Math.random() * 2],
        });
      }
    }
    return arr;
  }, []);

  return (
    <group>
      {/* 바닥 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200, 1, 1]} />
        <meshStandardMaterial color="#1a2032" />
      </mesh>

      {/* 빌딩 */}
      {blocks.map((b, i) => (
        <mesh key={i} position={b.pos} castShadow receiveShadow>
          <boxGeometry args={b.size} />
          <meshStandardMaterial
            color="#303a55"
            metalness={0.1}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// 도로 스플라인 만들기(폐곡선)
function useRoadCurve() {
  return useMemo(() => {
    const pts = [
      new THREE.Vector3(-18, 0.2, -18),
      new THREE.Vector3(0, 0.2, -22),
      new THREE.Vector3(18, 0.2, -18),
      new THREE.Vector3(22, 0.2, 0),
      new THREE.Vector3(18, 0.2, 18),
      new THREE.Vector3(0, 0.2, 22),
      new THREE.Vector3(-18, 0.2, 18),
      new THREE.Vector3(-22, 0.2, 0),
    ];
    const curve = new CatmullRomCurve3(pts, true, "catmullrom", 0.5);
    return curve;
  }, []);
}

function Road({ curve }: { curve: CatmullRomCurve3 }) {
  // 시각화를 위해 튜브(도로) 생성
  const geom = useMemo(
    () => new THREE.TubeGeometry(curve, 400, 0.3, 12, true),
    [curve]
  );
  return (
    <mesh geometry={geom}>
      <meshStandardMaterial
        color="#1f8fff"
        emissive="#0a2c66"
        emissiveIntensity={0.6}
      />
    </mesh>
  );
}

// InstancedMesh 차량
function Cars({
  curve,
  count = 120,
}: {
  curve: CatmullRomCurve3;
  count?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const offsets = useMemo(() => {
    // 각 차량의 시작 위치(0~1)와 속도(기본 0.02 ±)
    return new Array(count).fill(0).map(() => ({
      t: Math.random(), // 진행도
      v: 0.015 + Math.random() * 0.01, // 속도
      s: 0.6 + Math.random() * 0.8, // 스케일(차 크기)
    }));
  }, [count]);

  // 초기 색상/변형 세팅
  useMemo(() => {
    if (!ref.current) return;
    for (let i = 0; i < count; i++) {
      const c = new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.8, 0.6);
      ref.current.setColorAt(i, c);
    }
    ref.current.instanceColor!.needsUpdate = true;
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    for (let i = 0; i < count; i++) {
      const o = offsets[i];
      o.t = (o.t + o.v * delta) % 1;

      const p = curve.getPointAt(o.t);
      const t = curve.getTangentAt((o.t + 0.001) % 1); // 진행 방향

      // 위치/방향/스케일 설정
      dummy.position.copy(p);
      const look = p.clone().add(t);
      dummy.lookAt(look);
      dummy.scale.set(o.s, o.s, o.s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow>
      <boxGeometry args={[0.8, 0.4, 1.6]} />
      {/* vertexColors로 setColorAt 반영 */}
      <meshStandardMaterial
        vertexColors
        metalness={0.2}
        roughness={0.4}
        emissiveIntensity={0.5}
      />
    </instancedMesh>
  );
}

export default function Scene() {
  const curve = useRoadCurve();

  return (
    <group>
      <CityBlocks />
      <Road curve={curve} />
      <Cars curve={curve} count={120} />

      {/* 후처리: 블룸/비네트 */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.2}
        />
        <Vignette eskil={false} offset={0.3} darkness={0.6} />
      </EffectComposer>
    </group>
  );
}
