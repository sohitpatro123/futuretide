import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { angularDeg, latLonToVec, nearestStation, STATIONS, vecToLatLon } from "@/lib/futuretide/model";
import { isDown, setQaKeys } from "@/lib/futuretide/input";
import { sim, simLive } from "@/lib/futuretide/sim";
import { useTide } from "@/lib/futuretide/store";

const RADIUS = 5;

const east = new THREE.Vector3();
const north = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const up = new THREE.Vector3();
const next = new THREE.Vector3();
const cam = new THREE.Vector3();
const look = new THREE.Vector3();
const basis = new THREE.Matrix4();
const spherical = new THREE.Spherical(13.2, 2.08, 0.4);
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

function fillTangent(latDeg: number, lonDeg: number) {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  const sl = Math.sin(lat);
  const cl = Math.cos(lat);
  const so = Math.sin(lon);
  const co = Math.cos(lon);
  north.set(-sl * co, cl, -sl * so).normalize();
  east.set(-so, 0, co).normalize();
}

function yawToward(lat1: number, lon1: number, lat2: number, lon2: number) {
  fillTangent(lat1, lon1);
  const a = latLonToVec(lat1, lon1, 1);
  const b = latLonToVec(lat2, lon2, 1);
  tmpA.set(b.x - a.x, b.y - a.y, b.z - a.z);
  const udot = tmpA.x * a.x + tmpA.y * a.y + tmpA.z * a.z;
  tmpA.x -= a.x * udot;
  tmpA.y -= a.y * udot;
  tmpA.z -= a.z * udot;
  if (tmpA.lengthSq() < 1e-8) return sim.yaw;
  tmpA.normalize();
  const fe = tmpA.dot(east);
  const fn = tmpA.dot(north);
  return Math.atan2(-fe, fn);
}

function Earth() {
  const color = useTexture("/textures/earth.jpg");
  useEffect(() => {
    color.colorSpace = THREE.SRGBColorSpace;
    color.anisotropy = 8;
  }, [color]);
  const atmosphere = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        uniforms: {},
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vWorld;
          void main() {
            vec4 w = modelMatrix * vec4(position, 1.0);
            vWorld = w.xyz;
            vNormal = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * viewMatrix * w;
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          varying vec3 vWorld;
          void main() {
            vec3 viewDir = normalize(cameraPosition - vWorld);
            float fres = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 2.4);
            gl_FragColor = vec4(0.55, 0.82, 0.86, fres * 0.7);
          }
        `,
      }),
    [],
  );

  return (
    <group>
      <mesh
        onClick={(e) => {
          if (dragMoved) return;
          e.stopPropagation();
          const ll = vecToLatLon(e.point.x, e.point.y, e.point.z);
          if (ll.lat < -73 || ll.lat > -50) return;
          useTide.getState().addWaypoint(ll);
          useTide.getState().setHint("Course mark dropped. Hold W, or let the helm follow the marks.");
        }}
      >
        <sphereGeometry args={[RADIUS, 96, 64]} />
        <meshStandardMaterial map={color} roughness={0.92} metalness={0.04} />
      </mesh>
      <mesh scale={1.045} material={atmosphere}>
        <sphereGeometry args={[RADIUS, 48, 32]} />
      </mesh>
    </group>
  );
}

let dragMoved = false;

function OceanRig() {
  const ship = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  const drag = useRef({ on: false, x: 0, y: 0, moved: false });
  const nearTick = useRef(0);

  useEffect(() => {
    window.__controlsTest = {
      getYaw: () => sim.yaw,
      getSpeed: () => sim.speed,
      setKeys: (codes) => setQaKeys(codes),
    };
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      const view = useTide.getState().view;
      if (simLive && view === "helm") return;
      drag.current = { on: true, x: e.clientX, y: e.clientY, moved: false };
      dragMoved = false;
    };
    const move = (e: PointerEvent) => {
      if (!drag.current.on) return;
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      if (dx * dx + dy * dy > 16) {
        drag.current.moved = true;
        dragMoved = true;
      }
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
      spherical.theta -= dx * 0.005;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi - dy * 0.005, 0.55, 2.55);
    };
    const up = () => {
      drag.current.on = false;
      window.setTimeout(() => {
        dragMoved = false;
      }, 40);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl]);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (simLive) {
      let throttle = 0;
      if (isDown("KeyW") || isDown("ArrowUp")) throttle += 1;
      if (isDown("KeyS") || isDown("ArrowDown")) throttle -= 1;
      const boost = isDown("ShiftLeft") || isDown("ShiftRight") ? 1.85 : 1;
      let steer = 0;
      if (isDown("KeyA") || isDown("ArrowLeft")) steer += 1;
      if (isDown("KeyD") || isDown("ArrowRight")) steer -= 1;

      const waypoints = useTide.getState().waypoints;
      const coasting = steer === 0 && throttle === 0 && waypoints.length > 0;
      const cruise = 1.15 * boost;
      const target = coasting ? 1.15 : throttle * cruise;
      const response = throttle === 0 && !coasting ? 1.6 : 2.6;
      sim.speed += (target - sim.speed) * Math.min(1, dt * response);
      if (Math.abs(sim.speed) < 0.02 && throttle === 0 && !coasting) sim.speed = 0;

      const reverse = sim.speed >= -0.05 ? 1 : -1;
      if (steer !== 0) {
        sim.yaw += steer * 1.85 * reverse * dt;
      } else if (waypoints.length) {
        const desired = yawToward(sim.lat, sim.lon, waypoints[0].lat, waypoints[0].lon);
        const d = Math.atan2(Math.sin(desired - sim.yaw), Math.cos(desired - sim.yaw));
        sim.yaw += THREE.MathUtils.clamp(d, -1.5 * dt, 1.5 * dt);
        if (angularDeg({ lat: sim.lat, lon: sim.lon }, waypoints[0]) < 0.55) {
          useTide.getState().shiftWaypoint();
        }
      }

      fillTangent(sim.lat, sim.lon);
      forward.copy(east).multiplyScalar(-Math.sin(sim.yaw)).addScaledVector(north, Math.cos(sim.yaw));
      const p = latLonToVec(sim.lat, sim.lon, RADIUS);
      next.set(p.x, p.y, p.z).addScaledVector(forward, sim.speed * 0.13 * dt);
      next.normalize();
      let lat = (Math.asin(THREE.MathUtils.clamp(next.y, -1, 1)) * 180) / Math.PI;
      let lon = (Math.atan2(next.z, next.x) * 180) / Math.PI;
      if (lat < -71.2) lat = -71.2;
      if (lat > -51.2) lat = -51.2;
      sim.lat = lat;
      sim.lon = lon;

      nearTick.current += dt;
      if (nearTick.current > 0.2) {
        nearTick.current = 0;
        const near = nearestStation(sim.lat, sim.lon);
        const id = near.deg < 1.7 ? near.station.id : null;
        if (id !== useTide.getState().nearStationId) useTide.getState().setNear(id);
      }
    }

    const placed = latLonToVec(sim.lat, sim.lon, RADIUS);
    up.set(placed.x, placed.y, placed.z).normalize();
    fillTangent(sim.lat, sim.lon);
    forward.copy(east).multiplyScalar(-Math.sin(sim.yaw)).addScaledVector(north, Math.cos(sim.yaw)).normalize();
    right.crossVectors(up, forward).normalize();
    forward.crossVectors(right, up).normalize();
    if (ship.current) {
      basis.makeBasis(right, up, forward);
      ship.current.quaternion.setFromRotationMatrix(basis);
      ship.current.position.set(placed.x, placed.y, placed.z).addScaledVector(up, 0.02);
    }

    const helm = simLive && useTide.getState().view === "helm";
    if (!helm) {
      if (!simLive && !drag.current.on && !reduceMotion) spherical.theta += dt * 0.08;
      cam.setFromSpherical(spherical);
      camera.position.lerp(cam, 1 - Math.pow(0.04, dt));
      camera.up.set(0, 1, 0);
      camera.lookAt(0, -0.55, 0);
      return;
    }

    tmpB.set(placed.x, placed.y, placed.z);
    cam.copy(tmpB).addScaledVector(forward, -1.65).addScaledVector(up, 0.78);
    if (cam.length() < RADIUS + 0.4) cam.normalize().multiplyScalar(RADIUS + 0.62);
    const k = 1 - Math.pow(0.001, dt);
    camera.position.lerp(cam, k);
    camera.up.copy(up);
    look.copy(tmpB).addScaledVector(forward, 1.5).addScaledVector(up, 0.28);
    camera.lookAt(look);
  });

  return (
    <group ref={ship}>
      <ShipMesh />
    </group>
  );
}

function ShipMesh() {
  return (
    <group scale={0.34}>
      <mesh position={[0, 0.12, 0.05]} castShadow>
        <boxGeometry args={[0.42, 0.16, 1.15]} />
        <meshStandardMaterial color="#d5e4e6" roughness={0.42} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.12, 0.78]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.21, 0.48, 4]} />
        <meshStandardMaterial color="#e7f3f5" roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.28, -0.18]}>
        <boxGeometry args={[0.28, 0.18, 0.38]} />
        <meshStandardMaterial color="#14343a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.34, -0.18]}>
        <boxGeometry args={[0.2, 0.08, 0.22]} />
        <meshStandardMaterial color="#8ee0e0" emissive="#1a6e70" emissiveIntensity={0.45} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.55, -0.28]}>
        <cylinderGeometry args={[0.02, 0.02, 0.55, 6]} />
        <meshStandardMaterial color="#d7e6e8" />
      </mesh>
      <mesh position={[0, 0.84, -0.28]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial color="#e37b4a" emissive="#e37b4a" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[0, 0.02, -0.15]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.03, 0.28]} />
        <meshStandardMaterial color="#0e3a40" />
      </mesh>
    </group>
  );
}

function Beacons() {
  const near = useTide((s) => s.nearStationId);
  return (
    <>
      {STATIONS.map((s) => {
        const p = latLonToVec(s.lat, s.lon, RADIUS + 0.02);
        return <Beacon key={s.id} position={[p.x, p.y, p.z]} active={near === s.id} />;
      })}
    </>
  );
}

function Beacon({ position, active }: { position: [number, number, number]; active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);

  useLayoutEffect(() => {
    const upV = new THREE.Vector3(...position).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), upV);
    ref.current?.quaternion.copy(q);
  }, [position]);

  useFrame(({ clock }) => {
    if (!glow.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 2.2) * 0.18;
    glow.current.scale.setScalar(active ? s * 1.35 : s);
  });

  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.32, 6]} />
        <meshStandardMaterial
          color={active ? "#e37b4a" : "#9ee7e6"}
          emissive={active ? "#e37b4a" : "#14686a"}
          emissiveIntensity={0.9}
        />
      </mesh>
      <mesh ref={glow} position={[0, 0.36, 0]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial
          color={active ? "#e37b4a" : "#d5f6f4"}
          emissive={active ? "#e37b4a" : "#3dbebf"}
          emissiveIntensity={1.5}
        />
      </mesh>
    </group>
  );
}

function WaypointMarks() {
  const wps = useTide((s) => s.waypoints);
  return (
    <>
      {wps.map((w, i) => {
        const p = latLonToVec(w.lat, w.lon, RADIUS + 0.08);
        return (
          <mesh key={`${w.lat.toFixed(2)}-${w.lon.toFixed(2)}-${i}`} position={[p.x, p.y, p.z]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#e37b4a" emissive="#e37b4a" emissiveIntensity={0.8} />
          </mesh>
        );
      })}
    </>
  );
}

function Stars() {
  const positions = useMemo(() => {
    const arr = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(40 + Math.random() * 20);
      arr[i * 3] = v.x;
      arr[i * 3 + 1] = v.y;
      arr[i * 3 + 2] = v.z;
    }
    return arr;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#d5eef2" size={0.06} sizeAttenuation />
    </points>
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={["#071018"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 6, 4]} intensity={2.1} color="#fff4e4" />
      <directionalLight position={[-6, -2, -4]} intensity={0.35} color="#7ec8d4" />
      <Stars />
      <Suspense fallback={null}>
        <Earth />
      </Suspense>
      <OceanRig />
      <Beacons />
      <WaypointMarks />
    </>
  );
}

export function GlobeCanvas() {
  return (
    <Canvas
      camera={{ position: [4, -2, 12], fov: 42, near: 0.1, far: 80 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <Scene />
    </Canvas>
  );
}
