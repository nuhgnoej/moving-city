// /src/HDRBackground.tsx
import { useEffect } from "react";
import { useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { RGBELoader } from "three-stdlib";

export default function HDRBackground({ url }: { url: string }) {
  const { scene } = useThree();
  const texture = useLoader(RGBELoader, url);

  useEffect(() => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture; // ✅ 배경만 초선명
    return () => {
      scene.background = null;
      texture.dispose();
    };
  }, [scene, texture]);

  return null;
}
