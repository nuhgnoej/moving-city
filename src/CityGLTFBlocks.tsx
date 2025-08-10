// /src/CityGLTFBlocks.tsx  (다중 URL 지원 버전)
import { useMemo } from "react";
import { useThree, useLoader } from "@react-three/fiber";
import { GLTFLoader, KTX2Loader, DRACOLoader } from "three-stdlib";
import { Clone } from "@react-three/drei";
import type { GLTF } from "three-stdlib";

export default function CityGLTFBlocks({
  url,
  urls,
  grid = 6,
  gap = 6,
}: {
  url?: string; // 단일 파일
  urls?: string[]; // 다중 파일
  grid?: number;
  gap?: number;
}) {
  const { gl } = useThree();

  const ktx2 = useMemo(() => {
    const l = new KTX2Loader();
    l.setTranscoderPath("/basis/");
    l.detectSupport(gl);
    return l;
  }, [gl]);

  const draco = useMemo(() => {
    const l = new DRACOLoader();
    l.setDecoderPath("/draco/"); // 드라코 쓸 경우
    return l;
  }, []);

  // GLTF 로드 (단일 or 다중)
  const gltfs = useLoader(GLTFLoader, urls ?? (url ? [url] : []), (loader) => {
    const l = loader as GLTFLoader;
    l.setKTX2Loader(ktx2);
    l.setDRACOLoader?.(draco);
  }) as GLTF[];

  const placements = useMemo(() => {
    const arr: {
      position: [number, number, number];
      scale: number;
      rotY: number;
      pick: number;
    }[] = [];
    for (let x = -grid; x <= grid; x++) {
      for (let z = -grid; z <= grid; z++) {
        if (Math.abs(x) < 2 && Math.abs(z) < 2) continue;
        arr.push({
          position: [x * gap, 0, z * gap],
          scale: 0.9 + Math.random() * 0.6,
          rotY: Math.random() * Math.PI * 2,
          pick: gltfs.length ? Math.floor(Math.random() * gltfs.length) : 0,
        });
      }
    }
    return arr;
  }, [grid, gap, gltfs.length]);

  return (
    <group>
      {placements.map((p, i) => {
        const scene = gltfs[p.pick]?.scene;
        if (!scene) return null;
        return (
          <Clone
            key={i}
            object={scene}
            position={p.position}
            rotation={[0, p.rotY, 0]}
            scale={p.scale}
            castShadow
            receiveShadow
          />
        );
      })}
    </group>
  );
}
