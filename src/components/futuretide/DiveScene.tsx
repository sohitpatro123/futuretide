import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { metricsAt, stationById, type PathwayId } from "@/lib/futuretide/model";
import { isDown, setQaKeys } from "@/lib/futuretide/input";
import { sim } from "@/lib/futuretide/sim";
import { useTide, type Mode } from "@/lib/futuretide/store";

const MAX_KRILL = 1100;
const MAX_FISH = 42;
const MAX_SALP = 56;
const MAX_BENTHOS = 90;
const MAX_ICE = 48;
const MAX_BUBBLES = 36;

const dummy = new THREE.Object3D();
const colorA = new THREE.Color();
const colorB = new THREE.Color();
const desiredCam = new THREE.Vector3();
const clear = new THREE.Color();

type Source = "main" | "compare";

function hash(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function DiveWorld({
  source,
  interactive,
  stationId,
}: {
  source: Source;
  interactive: boolean;
  stationId: string;
}) {
  const krill = useRef<THREE.InstancedMesh>(null);
  const fish = useRef<THREE.InstancedMesh>(null);
  const salps = useRef<THREE.InstancedMesh>(null);
  const benthos = useRef<THREE.InstancedMesh>(null);
  const ice = useRef<THREE.InstancedMesh>(null);
  const bubbles = useRef<THREE.InstancedMesh>(null);
  const diver = useRef<THREE.Group>(null);
  const finL = useRef<THREE.Mesh>(null);
  const finR = useRef<THREE.Mesh>(null);
  const factories = useRef<THREE.Group>(null);
  const splash = useRef<THREE.Mesh>(null);
  const floorMat = useMemo(() => makeFloorMaterial(), []);
  const skyMat = useMemo(() => makeSkyMaterial(), []);
  const waterMat = useMemo(() => makeWaterMaterial(), []);
  const { camera, scene } = useThree();
  const fog = useMemo(() => new THREE.FogExp2("#07343c", 0.045), []);
  const local = useRef({
    x: 0,
    y: -4.2,
    z: interactive ? 5 : 0,
    yaw: interactive ? 0 : 0.4,
    speed: 0,
    entry: interactive ? 1 : 0,
    spin: hash(stationId.length + 3) * 6,
  });

  const seeds = useMemo(() => {
    const bent = Array.from({ length: MAX_BENTHOS }, (_, i) => {
      const ang = hash(i + 2) * Math.PI * 2;
      const rad = 1.2 + hash(i + 9) * 13;
      return {
        x: Math.cos(ang) * rad,
        z: Math.sin(ang) * rad,
        s: 0.25 + hash(i + 4) * 0.9,
        h: 0.4 + hash(i + 6) * 1.5,
        kind: hash(i + 8),
        hue: hash(i + 11),
      };
    });
    return { bent };
  }, []);

  useEffect(() => {
    scene.fog = fog;
    if (!interactive) return;
    window.__controlsTest = {
      getYaw: () => sim.diverYaw,
      getSpeed: () => sim.diverSpeed,
      setKeys: (codes) => setQaKeys(codes),
    };
    sim.diverX = 0;
    sim.diverY = -3.4;
    sim.diverZ = 5.5;
    sim.diverYaw = Math.PI;
    sim.diverSpeed = 0;
    local.current.x = sim.diverX;
    local.current.y = sim.diverY;
    local.current.z = sim.diverZ;
    local.current.yaw = sim.diverYaw;
    local.current.entry = 1;
  }, [interactive, scene, fog, stationId]);

  useEffect(() => {
    const mesh = benthos.current;
    if (!mesh) return;
    seeds.bent.forEach((b, i) => {
      dummy.position.set(b.x, -8.6 + b.h * 0.15, b.z);
      dummy.rotation.set(0, b.hue * 6, 0);
      dummy.scale.set(b.s, b.h, b.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = MAX_BENTHOS;
  }, [seeds]);

  useFrame(({ clock }, raw) => {
    const dt = Math.min(raw, 0.05);
    const t = clock.elapsedTime;
    const state = useTide.getState();
    const pathway: PathwayId = source === "compare" ? state.comparePathway : state.pathway;
    const year = source === "compare" ? state.compareYear : state.year;
    const station = stationById(stationId);
    const m = metricsAt(pathway, year, station);
    const stress = m.stress;

    floorMat.uniforms.uTime.value = t;
    floorMat.uniforms.uStress.value = stress;
    skyMat.uniforms.uStress.value = stress;
    skyMat.uniforms.uSun.value = 0.55 - stress * 0.85;
    waterMat.uniforms.uTime.value = t;
    waterMat.uniforms.uStress.value = stress;

    colorA.set("#0b3e46");
    colorB.set("#241c16");
    clear.copy(colorA).lerp(colorB, stress);
    fog.color.copy(clear);
    fog.density = 0.028 + stress * 0.05;
    scene.background = clear;

    const body = local.current;
    if (interactive) {
      let throttle = 0;
      if (isDown("KeyW") || isDown("ArrowUp")) throttle += 1;
      if (isDown("KeyS") || isDown("ArrowDown")) throttle -= 1;
      let steer = 0;
      if (isDown("KeyA") || isDown("ArrowLeft")) steer += 1;
      if (isDown("KeyD") || isDown("ArrowRight")) steer -= 1;
      let vert = 0;
      if (isDown("Space") || isDown("KeyQ")) vert += 1;
      if (isDown("KeyC") || isDown("ControlLeft") || isDown("KeyE")) vert -= 1;
      const target = throttle * 3.1;
      body.speed += (target - body.speed) * Math.min(1, dt * 2.2);
      const reverse = body.speed >= -0.05 ? 1 : -1;
      if (steer !== 0) body.yaw += steer * 1.7 * reverse * dt;
      const fx = -Math.sin(body.yaw);
      const fz = -Math.cos(body.yaw);
      body.x += fx * body.speed * dt;
      body.z += fz * body.speed * dt;
      body.y = THREE.MathUtils.clamp(body.y + vert * 2.4 * dt, -8.2, -0.85);
      const radial = Math.hypot(body.x, body.z);
      if (radial > 14) {
        body.x *= 14 / radial;
        body.z *= 14 / radial;
      }
      sim.diverX = body.x;
      sim.diverY = body.y;
      sim.diverZ = body.z;
      sim.diverYaw = body.yaw;
      sim.diverSpeed = body.speed;
      body.entry = Math.max(0, body.entry - dt / 2.6);
    } else {
      body.spin += dt * (0.18 + (1 - stress) * 0.12);
      body.x = Math.cos(body.spin) * (4 + stress);
      body.z = Math.sin(body.spin) * (4 + stress);
      body.y = -3.4 - Math.sin(body.spin * 0.7) * 1.1;
      body.yaw = body.spin + Math.PI / 2;
      body.speed = 1.2;
    }

    if (diver.current) {
      const sink = interactive ? body.entry * 3.6 : 0;
      diver.current.position.set(body.x, body.y + sink, body.z);
      diver.current.rotation.y = body.yaw + Math.PI;
      const kick = Math.sin(t * (4 + Math.min(3, Math.abs(body.speed))));
      if (finL.current) finL.current.rotation.z = 0.4 + kick * 0.5;
      if (finR.current) finR.current.rotation.z = -0.4 - kick * 0.5;
    }
    if (splash.current) {
      const e = body.entry;
      splash.current.visible = e > 0.02 && e < 0.92;
      splash.current.scale.setScalar(0.4 + (1 - e) * 3.2);
      const mat = splash.current.material as THREE.MeshBasicMaterial;
      mat.opacity = e * 0.45;
    }

    const fx = -Math.sin(body.yaw);
    const fz = -Math.cos(body.yaw);
    const back = interactive ? 5.1 : 7.2;
    const camY = body.y + 1.35 + (interactive ? body.entry * 6 : 0.4);
    desiredCam.set(body.x - fx * back, camY, body.z - fz * back);
    camera.position.lerp(desiredCam, 1 - Math.pow(0.0006, dt));
    camera.lookAt(body.x + fx * 3.2, body.y + 1.15 - body.entry * 0.4, body.z + fz * 3.2);

    paintSwarm(krill.current, t, stress, m.krill, "krill");
    paintSwarm(fish.current, t, stress, m.biodiversity, "fish");
    paintSwarm(salps.current, t, stress, m.salpRatio, "salp");
    paintIce(ice.current, t, stress);
    paintBubbles(bubbles.current, t, body.x, body.y, body.z);
    paintBenthos(benthos.current, stress);
    if (factories.current) {
      const show = Math.max(0, (stress - 0.22) / 0.78);
      factories.current.visible = show > 0.04;
      factories.current.scale.setScalar(0.45 + show * 1.05);
      factories.current.children.forEach((child, i) => {
        child.traverse((node) => {
          const mesh = node as THREE.Mesh;
          if (!mesh.isMesh) return;
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (!mat || !("opacity" in mat)) return;
          mat.transparent = true;
          mat.opacity = 0.15 + show * 0.85;
          if (mat.emissive) mat.emissiveIntensity = show * (0.4 + Math.sin(t * 3 + i) * 0.35);
        });
      });
    }
  });

  return (
    <>
      <hemisphereLight args={["#b7e4ea", "#123038", 0.85]} />
      <directionalLight position={[4, 12, 2]} intensity={1.6} color="#f3fbff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -8.7, 0]} material={floorMat}>
        <planeGeometry args={[48, 48, 1, 1]} />
      </mesh>
      <mesh material={skyMat}>
        <sphereGeometry args={[42, 32, 24]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} material={waterMat}>
        <planeGeometry args={[80, 80]} />
      </mesh>
      <instancedMesh ref={krill} args={[undefined, undefined, MAX_KRILL]} frustumCulled={false}>
        <sphereGeometry args={[1, 7, 5]} />
        <meshStandardMaterial color="#e37b4a" roughness={0.35} />
      </instancedMesh>
      <instancedMesh ref={fish} args={[undefined, undefined, MAX_FISH]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#d5e6ea" roughness={0.28} metalness={0.15} />
      </instancedMesh>
      <instancedMesh ref={salps} args={[undefined, undefined, MAX_SALP]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#d7e7cf" transparent opacity={0.45} roughness={0.15} />
      </instancedMesh>
      <instancedMesh ref={ice} args={[undefined, undefined, MAX_ICE]} frustumCulled={false}>
        <boxGeometry args={[1, 0.18, 1]} />
        <meshStandardMaterial color="#e7f6f8" transparent opacity={0.82} roughness={0.25} />
      </instancedMesh>
      <instancedMesh ref={benthos} args={[undefined, undefined, MAX_BENTHOS]} frustumCulled={false}>
        <coneGeometry args={[0.45, 1, 6]} />
        <meshStandardMaterial roughness={0.55} />
      </instancedMesh>
      <instancedMesh ref={bubbles} args={[undefined, undefined, MAX_BUBBLES]} frustumCulled={false}>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshBasicMaterial color="#d5f4f6" transparent opacity={0.55} />
      </instancedMesh>
      <FactoryRing refGroup={factories} />
      <mesh ref={splash} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 5.5]}>
        <ringGeometry args={[0.35, 0.55, 24]} />
        <meshBasicMaterial color="#e7f6f8" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <group ref={diver}>
        <Diver finL={finL} finR={finR} />
      </group>
    </>
  );
}

function paintBenthos(mesh: THREE.InstancedMesh | null, stress: number) {
  if (!mesh) return;
  if (!mesh.instanceColor) {
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_BENTHOS * 3), 3);
  }
  const healthy = ["#e37b4a", "#d45d78", "#e6c15a", "#7fd0c8", "#f2efe6", "#6aa8c4"];
  for (let i = 0; i < MAX_BENTHOS; i++) {
    colorA.set(healthy[i % healthy.length]);
    colorB.set("#b7b1a4");
    colorA.lerp(colorB, stress * 0.88);
    mesh.instanceColor.setXYZ(i, colorA.r, colorA.g, colorA.b);
  }
  mesh.instanceColor.needsUpdate = true;
}

function paintSwarm(
  mesh: THREE.InstancedMesh | null,
  t: number,
  stress: number,
  driver: number,
  kind: "krill" | "fish" | "salp",
) {
  if (!mesh) return;
  let count = 0;
  if (kind === "krill") count = Math.round(THREE.MathUtils.lerp(90, MAX_KRILL, THREE.MathUtils.clamp(driver / 100, 0, 1)));
  if (kind === "fish") count = Math.round(THREE.MathUtils.lerp(3, MAX_FISH, THREE.MathUtils.clamp(driver / 100, 0, 1)));
  if (kind === "salp") count = Math.round(THREE.MathUtils.lerp(4, MAX_SALP, THREE.MathUtils.clamp(driver / 2.4, 0, 1)));
  count = Math.max(kind === "salp" ? 4 : 2, Math.min(count, kind === "krill" ? MAX_KRILL : kind === "fish" ? MAX_FISH : MAX_SALP));
  for (let i = 0; i < count; i++) {
    const h1 = hash(i + kind.length * 19);
    const h2 = hash(i + 40 + kind.length);
    const speed = kind === "fish" ? 0.35 + h1 * 0.25 : kind === "salp" ? 0.08 + h1 * 0.08 : 0.45 + h1 * 0.5;
    const radius = kind === "fish" ? 3 + h2 * 8 : kind === "salp" ? 2 + h2 * 10 : 1.5 + h2 * 7.5;
    const ang = t * speed * (h1 > 0.5 ? 1 : -1) + h2 * Math.PI * 2;
    const y =
      kind === "fish"
        ? -2.2 - h1 * 4.5 + Math.sin(t * 0.6 + h2) * 0.4
        : kind === "salp"
          ? -1.6 - h1 * 5
          : -1.4 - h1 * 5.5 + Math.sin(t * 1.4 + i) * 0.25;
    dummy.position.set(Math.cos(ang) * radius, y, Math.sin(ang) * radius * 0.82);
    dummy.rotation.set(0, -ang + Math.PI / 2, 0);
    if (kind === "krill") dummy.scale.set(0.045, 0.03, 0.11);
    else if (kind === "fish") dummy.scale.set(0.12, 0.07, 0.42);
    else dummy.scale.set(0.18 + stress * 0.08, 0.16, 0.28);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.count = count;
  mesh.instanceMatrix.needsUpdate = true;
}

function paintIce(mesh: THREE.InstancedMesh | null, t: number, stress: number) {
  if (!mesh) return;
  const count = Math.round(THREE.MathUtils.lerp(MAX_ICE, 4, stress));
  for (let i = 0; i < count; i++) {
    const h1 = hash(i + 3);
    const h2 = hash(i + 80);
    const drift = Math.sin(t * 0.15 + h1 * 8) * 0.4;
    dummy.position.set((h1 - 0.5) * 26 + drift, 0.15 + h2 * 0.2, (h2 - 0.5) * 26);
    dummy.rotation.set(0, h1 * 4, 0);
    const s = 0.8 + h2 * 2.4 * (1 - stress * 0.45);
    dummy.scale.set(s, 0.7 + (1 - stress), s * (0.7 + h1));
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.count = count;
  mesh.instanceMatrix.needsUpdate = true;
}

function paintBubbles(mesh: THREE.InstancedMesh | null, t: number, x: number, y: number, z: number) {
  if (!mesh) return;
  for (let i = 0; i < MAX_BUBBLES; i++) {
    const h = hash(i + 5);
    const life = (t * (0.25 + h * 0.4) + h) % 1;
    dummy.position.set(x + (hash(i + 12) - 0.5) * 0.8, y - 0.2 + life * 3.2, z + (hash(i + 21) - 0.5) * 0.8);
    dummy.scale.setScalar(0.4 + life);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.count = MAX_BUBBLES;
  mesh.instanceMatrix.needsUpdate = true;
}

function FactoryRing({ refGroup }: { refGroup: RefObject<THREE.Group | null> }) {
  const spots = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return { x: Math.cos(a) * 16, z: Math.sin(a) * 16, h: 1.2 + (i % 3) * 0.7, a };
      }),
    [],
  );
  return (
    <group ref={refGroup}>
      {spots.map((s, i) => (
        <group key={i} position={[s.x, 0.2, s.z]} rotation={[0, -s.a, 0]}>
          <mesh position={[0, s.h / 2, 0]}>
            <boxGeometry args={[0.7, s.h, 0.55]} />
            <meshStandardMaterial color="#1a1714" transparent opacity={0.85} roughness={0.8} />
          </mesh>
          <mesh position={[0.1, s.h * 0.45, 0.28]}>
            <boxGeometry args={[0.12, 0.16, 0.04]} />
            <meshStandardMaterial color="#e37b4a" emissive="#e37b4a" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0, s.h + 0.45, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 0.7, 6]} />
            <meshStandardMaterial color="#100e0c" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Diver({
  finL,
  finR,
}: {
  finL: RefObject<THREE.Mesh | null>;
  finR: RefObject<THREE.Mesh | null>;
}) {
  return (
    <group>
      <mesh position={[0, 0, 0.05]}>
        <capsuleGeometry args={[0.18, 0.55, 6, 10]} />
        <meshStandardMaterial color="#12343c" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.42, 0.12]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshStandardMaterial color="#102e34" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.42, 0.24]}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial color="#b9f3ef" emissive="#7ee0dc" emissiveIntensity={0.35} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.05, -0.18]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.42, 8]} />
        <meshStandardMaterial color="#e37b4a" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh ref={finL} position={[-0.28, 0.05, -0.05]}>
        <boxGeometry args={[0.28, 0.04, 0.16]} />
        <meshStandardMaterial color="#1c4e56" />
      </mesh>
      <mesh ref={finR} position={[0.28, 0.05, -0.05]}>
        <boxGeometry args={[0.28, 0.04, 0.16]} />
        <meshStandardMaterial color="#1c4e56" />
      </mesh>
      <mesh position={[-0.08, -0.42, 0.12]} rotation={[0.5, 0.2, 0]}>
        <boxGeometry args={[0.1, 0.04, 0.28]} />
        <meshStandardMaterial color="#0e2a30" />
      </mesh>
      <mesh position={[0.08, -0.42, 0.12]} rotation={[0.5, -0.2, 0]}>
        <boxGeometry args={[0.1, 0.04, 0.28]} />
        <meshStandardMaterial color="#0e2a30" />
      </mesh>
    </group>
  );
}

function makeFloorMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uStress: { value: 0 },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uStress;
      varying vec3 vPos;
      void main() {
        float c = sin(vPos.x * 0.55 + uTime * 0.8) * sin(vPos.y * 0.48 - uTime * 0.6);
        c = c * 0.5 + 0.5;
        vec3 healthy = vec3(0.04, 0.22, 0.24);
        vec3 dead = vec3(0.16, 0.14, 0.11);
        vec3 col = mix(healthy, dead, uStress);
        col += vec3(0.05, 0.16, 0.16) * c * (1.0 - uStress);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

function makeSkyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uStress: { value: 0 },
      uSun: { value: 0.4 },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uStress;
      uniform float uSun;
      varying vec3 vPos;
      void main() {
        vec3 n = normalize(vPos);
        float up = clamp(n.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 dayHorizon = vec3(0.95, 0.62, 0.42);
        vec3 dayZenith = vec3(0.36, 0.66, 0.78);
        vec3 grimHorizon = vec3(0.22, 0.1, 0.06);
        vec3 grimZenith = vec3(0.03, 0.04, 0.06);
        vec3 day = mix(dayHorizon, dayZenith, up);
        vec3 grim = mix(grimHorizon, grimZenith, up);
        vec3 col = mix(day, grim, smoothstep(0.05, 0.92, uStress));
        vec3 sunDir = normalize(vec3(0.35, uSun, 0.4));
        float sun = pow(max(dot(n, sunDir), 0.0), 90.0);
        col += vec3(1.0, 0.86, 0.55) * sun * (1.0 - uStress);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

function makeWaterMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uStress: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uStress;
      varying vec2 vUv;
      void main() {
        float rip = sin(vUv.x * 80.0 + uTime * 1.4) * sin(vUv.y * 70.0 - uTime);
        vec3 col = mix(vec3(0.55, 0.82, 0.84), vec3(0.25, 0.2, 0.14), uStress);
        float alpha = 0.18 + rip * 0.04 + uStress * 0.12;
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
}

export function DiveCanvas({
  source,
  interactive,
  stationId,
}: {
  source: Source;
  interactive: boolean;
  stationId: string;
  mode?: Mode;
}) {
  return (
    <Canvas
      camera={{ position: [0, 1.2, 12], fov: 68, near: 0.1, far: 90 }}
      dpr={interactive ? [1, 1.5] : [1, 1.15]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <DiveWorld source={source} interactive={interactive} stationId={stationId} />
    </Canvas>
  );
}
