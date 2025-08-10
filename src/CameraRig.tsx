// /src/CameraRig.tsx
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

type Props = {
  controls: React.RefObject<OrbitControlsImpl | null>;
  radius?: number;
  height?: number;
  duration?: number; // 1바퀴 시간(초)
  resumeDelayMs?: number; // 조작 끝난 뒤 자동 재개 대기 시간
  smoothness?: number; // 추종 민감도(↑ 더 빨리 따라감)
  minHeight?: number;
  maxHeight?: number;
};

export default function CameraRig({
  controls,
  radius: initialRadius = 45,
  height: initialHeight = 18,
  duration = 48,
  resumeDelayMs = 600,
  smoothness = 7,
  minHeight = 4,
  maxHeight = 60,
}: Props) {
  const { camera } = useThree();

  // 사용자 조작 반영(커브 재생성 트리거)
  const [radius, setRadius] = useState(initialRadius);
  const [height, setHeight] = useState(initialHeight);

  // 목표 시점
  const desiredPos = useRef(new THREE.Vector3().copy(camera.position));
  const desiredTarget = useRef(new THREE.Vector3(0, 2, 0));

  // 진행도 t (0~1)
  const tRef = useRef(0);

  // 사용자 조작 상태
  const userInteracting = useRef(false);
  const resumeAt = useRef(0); // 이 시각 이후에 자동 무빙 허용

  useEffect(() => {
    const c = controls.current;
    if (!c) return;

    const onStart = () => {
      userInteracting.current = true;
    };

    const onEnd = () => {
      userInteracting.current = false;
      // 사용자가 만든 시점/거리 값을 새 반경·높이로 흡수
      const newRadius = Math.hypot(camera.position.x, camera.position.z);
      const newHeight = THREE.MathUtils.clamp(
        camera.position.y,
        minHeight,
        maxHeight
      );
      setRadius(newRadius);
      setHeight(newHeight);
      // end 시각 + 지연 이후부터 자동 무빙 재개
      resumeAt.current = performance.now() + resumeDelayMs;
    };

    c.addEventListener("start", onStart);
    c.addEventListener("end", onEnd);
    // ❌ change 이벤트는 구독하지 않습니다 (계단끊김 원인)
    return () => {
      c.removeEventListener("start", onStart);
      c.removeEventListener("end", onEnd);
    };
  }, [controls, camera.position, minHeight, maxHeight, resumeDelayMs]);

  // 카메라 경로(반경/높이 반영, 폐곡선)
  const camCurve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const upDown = Math.sin(a * 2) * 2;
      pts.push(
        new THREE.Vector3(
          Math.cos(a) * radius,
          height + upDown,
          Math.sin(a) * radius
        )
      );
    }
    return new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.5);
  }, [radius, height]);

  // 타겟 경로(도심 중심을 천천히 선회)
  const targetCurve = useMemo(() => {
    const r = 4;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 2, Math.sin(a) * r));
    }
    return new THREE.CatmullRomCurve3(pts, true);
  }, []);

  // 매 프레임: 진행도 갱신 + 목표 갱신 + 부드러운 추종
  useFrame((_, delta) => {
    const now = performance.now();
    const allowDrive = !userInteracting.current && now >= resumeAt.current;

    // 1) 진행도 갱신(사용자 조작 중이면 정지)
    if (allowDrive) {
      const speed = 1 / duration; // 초당 진행 비율
      tRef.current = (tRef.current + delta * speed) % 1;
    }

    // 2) 목표 위치/타겟 갱신
    const t = tRef.current;
    desiredPos.current.copy(camCurve.getPointAt(t));
    desiredTarget.current.copy(targetCurve.getPointAt((t + 0.02) % 1));

    // 3) 지수 감쇠(damp)로 부드럽게 수렴
    if (!allowDrive) return;
    const alpha = 1 - Math.exp(-smoothness * delta);
    camera.position.lerp(desiredPos.current, alpha);
    controls.current?.target.lerp(desiredTarget.current, alpha);
    controls.current?.update();
  });

  return null;
}
