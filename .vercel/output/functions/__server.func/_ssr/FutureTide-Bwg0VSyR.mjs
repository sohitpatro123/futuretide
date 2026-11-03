import { i as __toESM } from "../_runtime.mjs";
import { c as InstancedBufferAttribute, d as Object3D, f as Quaternion, g as Vector3, h as Spherical, i as useThree, l as MathUtils, m as ShaderMaterial, n as Canvas, o as Color, p as SRGBColorSpace, r as useFrame, s as FogExp2, t as useTexture, u as Matrix4, v as require_jsx_runtime, y as require_react } from "../_libs/@react-three/drei+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as fmt, c as metricsAt, d as stationById, f as unprojectChart, i as angularDeg, l as nearestStation, n as PATHWAYS, o as krillSeries, p as vecToLatLon, r as STATIONS, s as latLonToVec, t as FISHCAST_NOTE, u as projectChart } from "./model-KcGpYaiX.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { a as Play, c as Fish, i as Ship, l as Compass, n as Waves, o as Pause, s as Info, t as X, u as Anchor } from "../_libs/lucide-react.mjs";
import { a as CartesianGrid, i as Line, n as YAxis, o as ResponsiveContainer, r as XAxis, s as Tooltip, t as LineChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/FutureTide-Bwg0VSyR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var held = /* @__PURE__ */ new Set();
var qa = null;
function isDown(code) {
	if (qa) return qa.has(code);
	return held.has(code);
}
function setQaKeys(codes) {
	qa = new Set(codes);
}
function bindInput() {
	const down = (e) => {
		qa = null;
		held.add(e.code);
		if ([
			"Space",
			"ArrowUp",
			"ArrowDown",
			"ArrowLeft",
			"ArrowRight"
		].includes(e.code)) e.preventDefault();
	};
	const up = (e) => {
		held.delete(e.code);
	};
	const reset = () => held.clear();
	window.addEventListener("keydown", down);
	window.addEventListener("keyup", up);
	window.addEventListener("blur", reset);
	document.addEventListener("visibilitychange", reset);
	return () => {
		window.removeEventListener("keydown", down);
		window.removeEventListener("keyup", up);
		window.removeEventListener("blur", reset);
		document.removeEventListener("visibilitychange", reset);
		held.clear();
	};
}
function holdProps(code) {
	return {
		onPointerDown: (e) => {
			e.preventDefault();
			e.currentTarget.setPointerCapture(e.pointerId);
			held.add(code);
		},
		onPointerUp: (e) => {
			held.delete(code);
			if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
		},
		onPointerCancel: () => {
			held.delete(code);
		}
	};
}
/** Shared pose for the helm and the diver. Read from the frame loop; not React state. */
var sim = {
	lat: -64.4,
	lon: -78,
	yaw: -Math.PI / 2,
	speed: 0,
	diverX: 0,
	diverY: -4.2,
	diverZ: 5,
	diverYaw: Math.PI,
	diverSpeed: 0
};
var simLive = false;
function setSimLive(next) {
	simLive = next;
}
var useTide = create((set) => ({
	started: false,
	mode: "voyage",
	view: "globe",
	pathway: "maintain",
	year: 2050,
	playing: false,
	comparePathway: "increase",
	compareYear: 2100,
	nearStationId: null,
	diveStationId: null,
	waypoints: [],
	sheet: "none",
	hint: null,
	brief: null,
	briefKey: null,
	briefStatus: "idle",
	briefError: null,
	start: () => set({
		started: true,
		view: "helm",
		sheet: "none"
	}),
	setPathway: (pathway) => set({ pathway }),
	setYear: (year) => set({ year: Math.min(2100, Math.max(2025, year)) }),
	setPlaying: (playing) => set({ playing }),
	setMode: (mode) => set({
		mode,
		sheet: "none"
	}),
	setView: (view) => set({ view }),
	setCompare: (comparePathway, compareYear) => set((s) => ({
		comparePathway,
		compareYear: compareYear ?? s.compareYear
	})),
	setNear: (nearStationId) => set({ nearStationId }),
	setDiveStation: (diveStationId) => set({ diveStationId }),
	addWaypoint: (p) => set((s) => ({ waypoints: [...s.waypoints.slice(-7), p] })),
	clearWaypoints: () => set({ waypoints: [] }),
	shiftWaypoint: () => set((s) => ({ waypoints: s.waypoints.slice(1) })),
	setSheet: (sheet) => set({ sheet }),
	setHint: (hint) => set({ hint }),
	setBriefStatus: (briefStatus, briefError = null) => set({
		briefStatus,
		briefError
	}),
	setBrief: (brief, briefKey) => set({
		brief,
		briefKey,
		briefStatus: brief ? "ready" : "idle"
	})
}));
var MAX_KRILL = 1100;
var MAX_FISH = 42;
var MAX_SALP = 56;
var MAX_BENTHOS = 90;
var MAX_ICE = 48;
var MAX_BUBBLES = 36;
var dummy = new Object3D();
var colorA = new Color();
var colorB = new Color();
var desiredCam = new Vector3();
var clear = new Color();
function hash(i) {
	const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
}
function DiveWorld({ source, interactive, stationId }) {
	const krill = (0, import_react.useRef)(null);
	const fish = (0, import_react.useRef)(null);
	const salps = (0, import_react.useRef)(null);
	const benthos = (0, import_react.useRef)(null);
	const ice = (0, import_react.useRef)(null);
	const bubbles = (0, import_react.useRef)(null);
	const diver = (0, import_react.useRef)(null);
	const finL = (0, import_react.useRef)(null);
	const finR = (0, import_react.useRef)(null);
	const factories = (0, import_react.useRef)(null);
	const splash = (0, import_react.useRef)(null);
	const floorMat = (0, import_react.useMemo)(() => makeFloorMaterial(), []);
	const skyMat = (0, import_react.useMemo)(() => makeSkyMaterial(), []);
	const waterMat = (0, import_react.useMemo)(() => makeWaterMaterial(), []);
	const { camera, scene } = useThree();
	const fog = (0, import_react.useMemo)(() => new FogExp2("#07343c", .045), []);
	const local = (0, import_react.useRef)({
		x: 0,
		y: -4.2,
		z: interactive ? 5 : 0,
		yaw: interactive ? 0 : .4,
		speed: 0,
		entry: interactive ? 1 : 0,
		spin: hash(stationId.length + 3) * 6
	});
	const seeds = (0, import_react.useMemo)(() => {
		return { bent: Array.from({ length: MAX_BENTHOS }, (_, i) => {
			const ang = hash(i + 2) * Math.PI * 2;
			const rad = 1.2 + hash(i + 9) * 13;
			return {
				x: Math.cos(ang) * rad,
				z: Math.sin(ang) * rad,
				s: .25 + hash(i + 4) * .9,
				h: .4 + hash(i + 6) * 1.5,
				kind: hash(i + 8),
				hue: hash(i + 11)
			};
		}) };
	}, []);
	(0, import_react.useEffect)(() => {
		scene.fog = fog;
		if (!interactive) return;
		window.__controlsTest = {
			getYaw: () => sim.diverYaw,
			getSpeed: () => sim.diverSpeed,
			setKeys: (codes) => setQaKeys(codes)
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
	}, [
		interactive,
		scene,
		fog,
		stationId
	]);
	(0, import_react.useEffect)(() => {
		const mesh = benthos.current;
		if (!mesh) return;
		seeds.bent.forEach((b, i) => {
			dummy.position.set(b.x, -8.6 + b.h * .15, b.z);
			dummy.rotation.set(0, b.hue * 6, 0);
			dummy.scale.set(b.s, b.h, b.s);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		});
		mesh.instanceMatrix.needsUpdate = true;
		mesh.count = MAX_BENTHOS;
	}, [seeds]);
	useFrame(({ clock }, raw) => {
		const dt = Math.min(raw, .05);
		const t = clock.elapsedTime;
		const state = useTide.getState();
		const pathway = source === "compare" ? state.comparePathway : state.pathway;
		const year = source === "compare" ? state.compareYear : state.year;
		const station = stationById(stationId);
		const m = metricsAt(pathway, year, station);
		const stress = m.stress;
		floorMat.uniforms.uTime.value = t;
		floorMat.uniforms.uStress.value = stress;
		skyMat.uniforms.uStress.value = stress;
		skyMat.uniforms.uSun.value = .55 - stress * .85;
		waterMat.uniforms.uTime.value = t;
		waterMat.uniforms.uStress.value = stress;
		colorA.set("#0b3e46");
		colorB.set("#241c16");
		clear.copy(colorA).lerp(colorB, stress);
		fog.color.copy(clear);
		fog.density = .028 + stress * .05;
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
			const reverse = body.speed >= -.05 ? 1 : -1;
			if (steer !== 0) body.yaw += steer * 1.7 * reverse * dt;
			const fx = -Math.sin(body.yaw);
			const fz = -Math.cos(body.yaw);
			body.x += fx * body.speed * dt;
			body.z += fz * body.speed * dt;
			body.y = MathUtils.clamp(body.y + vert * 2.4 * dt, -8.2, -.85);
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
			body.spin += dt * (.18 + (1 - stress) * .12);
			body.x = Math.cos(body.spin) * (4 + stress);
			body.z = Math.sin(body.spin) * (4 + stress);
			body.y = -3.4 - Math.sin(body.spin * .7) * 1.1;
			body.yaw = body.spin + Math.PI / 2;
			body.speed = 1.2;
		}
		if (diver.current) {
			const sink = interactive ? body.entry * 3.6 : 0;
			diver.current.position.set(body.x, body.y + sink, body.z);
			diver.current.rotation.y = body.yaw + Math.PI;
			const kick = Math.sin(t * (4 + Math.min(3, Math.abs(body.speed))));
			if (finL.current) finL.current.rotation.z = .4 + kick * .5;
			if (finR.current) finR.current.rotation.z = -.4 - kick * .5;
		}
		if (splash.current) {
			const e = body.entry;
			splash.current.visible = e > .02 && e < .92;
			splash.current.scale.setScalar(.4 + (1 - e) * 3.2);
			const mat = splash.current.material;
			mat.opacity = e * .45;
		}
		const fx = -Math.sin(body.yaw);
		const fz = -Math.cos(body.yaw);
		const back = interactive ? 5.1 : 7.2;
		const camY = body.y + 1.35 + (interactive ? body.entry * 6 : .4);
		desiredCam.set(body.x - fx * back, camY, body.z - fz * back);
		camera.position.lerp(desiredCam, 1 - Math.pow(6e-4, dt));
		camera.lookAt(body.x + fx * 3.2, body.y + 1.15 - body.entry * .4, body.z + fz * 3.2);
		paintSwarm(krill.current, t, stress, m.krill, "krill");
		paintSwarm(fish.current, t, stress, m.biodiversity, "fish");
		paintSwarm(salps.current, t, stress, m.salpRatio, "salp");
		paintIce(ice.current, t, stress);
		paintBubbles(bubbles.current, t, body.x, body.y, body.z);
		paintBenthos(benthos.current, stress);
		if (factories.current) {
			const show = Math.max(0, (stress - .22) / .78);
			factories.current.visible = show > .04;
			factories.current.scale.setScalar(.45 + show * 1.05);
			factories.current.children.forEach((child, i) => {
				child.traverse((node) => {
					const mesh = node;
					if (!mesh.isMesh) return;
					const mat = mesh.material;
					if (!mat || !("opacity" in mat)) return;
					mat.transparent = true;
					mat.opacity = .15 + show * .85;
					if (mat.emissive) mat.emissiveIntensity = show * (.4 + Math.sin(t * 3 + i) * .35);
				});
			});
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("hemisphereLight", { args: [
			"#b7e4ea",
			"#123038",
			.85
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("directionalLight", {
			position: [
				4,
				12,
				2
			],
			intensity: 1.6,
			color: "#f3fbff"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("mesh", {
			rotation: [
				-Math.PI / 2,
				0,
				0
			],
			position: [
				0,
				-8.7,
				0
			],
			material: floorMat,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("planeGeometry", { args: [
				48,
				48,
				1,
				1
			] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("mesh", {
			material: skyMat,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
				42,
				32,
				24
			] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("mesh", {
			rotation: [
				-Math.PI / 2,
				0,
				0
			],
			position: [
				0,
				.05,
				0
			],
			material: waterMat,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("planeGeometry", { args: [80, 80] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("instancedMesh", {
			ref: krill,
			args: [
				void 0,
				void 0,
				MAX_KRILL
			],
			frustumCulled: false,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
				1,
				7,
				5
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: "#e37b4a",
				roughness: .35
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("instancedMesh", {
			ref: fish,
			args: [
				void 0,
				void 0,
				MAX_FISH
			],
			frustumCulled: false,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
				1,
				8,
				6
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: "#d5e6ea",
				roughness: .28,
				metalness: .15
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("instancedMesh", {
			ref: salps,
			args: [
				void 0,
				void 0,
				MAX_SALP
			],
			frustumCulled: false,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
				1,
				10,
				8
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: "#d7e7cf",
				transparent: true,
				opacity: .45,
				roughness: .15
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("instancedMesh", {
			ref: ice,
			args: [
				void 0,
				void 0,
				MAX_ICE
			],
			frustumCulled: false,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
				1,
				.18,
				1
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: "#e7f6f8",
				transparent: true,
				opacity: .82,
				roughness: .25
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("instancedMesh", {
			ref: benthos,
			args: [
				void 0,
				void 0,
				MAX_BENTHOS
			],
			frustumCulled: false,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("coneGeometry", { args: [
				.45,
				1,
				6
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", { roughness: .55 })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("instancedMesh", {
			ref: bubbles,
			args: [
				void 0,
				void 0,
				MAX_BUBBLES
			],
			frustumCulled: false,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
				.05,
				6,
				6
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshBasicMaterial", {
				color: "#d5f4f6",
				transparent: true,
				opacity: .55
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FactoryRing, { refGroup: factories }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			ref: splash,
			rotation: [
				-Math.PI / 2,
				0,
				0
			],
			position: [
				0,
				.08,
				5.5
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ringGeometry", { args: [
				.35,
				.55,
				24
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshBasicMaterial", {
				color: "#e7f6f8",
				transparent: true,
				opacity: .4,
				side: 2
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("group", {
			ref: diver,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Diver, {
				finL,
				finR
			})
		})
	] });
}
function paintBenthos(mesh, stress) {
	if (!mesh) return;
	if (!mesh.instanceColor) mesh.instanceColor = new InstancedBufferAttribute(/* @__PURE__ */ new Float32Array(270), 3);
	const healthy = [
		"#e37b4a",
		"#d45d78",
		"#e6c15a",
		"#7fd0c8",
		"#f2efe6",
		"#6aa8c4"
	];
	for (let i = 0; i < MAX_BENTHOS; i++) {
		colorA.set(healthy[i % healthy.length]);
		colorB.set("#b7b1a4");
		colorA.lerp(colorB, stress * .88);
		mesh.instanceColor.setXYZ(i, colorA.r, colorA.g, colorA.b);
	}
	mesh.instanceColor.needsUpdate = true;
}
function paintSwarm(mesh, t, stress, driver, kind) {
	if (!mesh) return;
	let count = 0;
	if (kind === "krill") count = Math.round(MathUtils.lerp(90, MAX_KRILL, MathUtils.clamp(driver / 100, 0, 1)));
	if (kind === "fish") count = Math.round(MathUtils.lerp(3, MAX_FISH, MathUtils.clamp(driver / 100, 0, 1)));
	if (kind === "salp") count = Math.round(MathUtils.lerp(4, MAX_SALP, MathUtils.clamp(driver / 2.4, 0, 1)));
	count = Math.max(kind === "salp" ? 4 : 2, Math.min(count, kind === "krill" ? MAX_KRILL : kind === "fish" ? MAX_FISH : MAX_SALP));
	for (let i = 0; i < count; i++) {
		const h1 = hash(i + kind.length * 19);
		const h2 = hash(i + 40 + kind.length);
		const speed = kind === "fish" ? .35 + h1 * .25 : kind === "salp" ? .08 + h1 * .08 : .45 + h1 * .5;
		const radius = kind === "fish" ? 3 + h2 * 8 : kind === "salp" ? 2 + h2 * 10 : 1.5 + h2 * 7.5;
		const ang = t * speed * (h1 > .5 ? 1 : -1) + h2 * Math.PI * 2;
		const y = kind === "fish" ? -2.2 - h1 * 4.5 + Math.sin(t * .6 + h2) * .4 : kind === "salp" ? -1.6 - h1 * 5 : -1.4 - h1 * 5.5 + Math.sin(t * 1.4 + i) * .25;
		dummy.position.set(Math.cos(ang) * radius, y, Math.sin(ang) * radius * .82);
		dummy.rotation.set(0, -ang + Math.PI / 2, 0);
		if (kind === "krill") dummy.scale.set(.045, .03, .11);
		else if (kind === "fish") dummy.scale.set(.12, .07, .42);
		else dummy.scale.set(.18 + stress * .08, .16, .28);
		dummy.updateMatrix();
		mesh.setMatrixAt(i, dummy.matrix);
	}
	mesh.count = count;
	mesh.instanceMatrix.needsUpdate = true;
}
function paintIce(mesh, t, stress) {
	if (!mesh) return;
	const count = Math.round(MathUtils.lerp(MAX_ICE, 4, stress));
	for (let i = 0; i < count; i++) {
		const h1 = hash(i + 3);
		const h2 = hash(i + 80);
		const drift = Math.sin(t * .15 + h1 * 8) * .4;
		dummy.position.set((h1 - .5) * 26 + drift, .15 + h2 * .2, (h2 - .5) * 26);
		dummy.rotation.set(0, h1 * 4, 0);
		const s = .8 + h2 * 2.4 * (1 - stress * .45);
		dummy.scale.set(s, .7 + (1 - stress), s * (.7 + h1));
		dummy.updateMatrix();
		mesh.setMatrixAt(i, dummy.matrix);
	}
	mesh.count = count;
	mesh.instanceMatrix.needsUpdate = true;
}
function paintBubbles(mesh, t, x, y, z) {
	if (!mesh) return;
	for (let i = 0; i < MAX_BUBBLES; i++) {
		const h = hash(i + 5);
		const life = (t * (.25 + h * .4) + h) % 1;
		dummy.position.set(x + (hash(i + 12) - .5) * .8, y - .2 + life * 3.2, z + (hash(i + 21) - .5) * .8);
		dummy.scale.setScalar(.4 + life);
		dummy.updateMatrix();
		mesh.setMatrixAt(i, dummy.matrix);
	}
	mesh.count = MAX_BUBBLES;
	mesh.instanceMatrix.needsUpdate = true;
}
function FactoryRing({ refGroup }) {
	const spots = (0, import_react.useMemo)(() => Array.from({ length: 9 }, (_, i) => {
		const a = i / 9 * Math.PI * 2;
		return {
			x: Math.cos(a) * 16,
			z: Math.sin(a) * 16,
			h: 1.2 + i % 3 * .7,
			a
		};
	}), []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("group", {
		ref: refGroup,
		children: spots.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
			position: [
				s.x,
				.2,
				s.z
			],
			rotation: [
				0,
				-s.a,
				0
			],
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
					position: [
						0,
						s.h / 2,
						0
					],
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
						.7,
						s.h,
						.55
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
						color: "#1a1714",
						transparent: true,
						opacity: .85,
						roughness: .8
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
					position: [
						.1,
						s.h * .45,
						.28
					],
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
						.12,
						.16,
						.04
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
						color: "#e37b4a",
						emissive: "#e37b4a",
						emissiveIntensity: .8
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
					position: [
						0,
						s.h + .45,
						0
					],
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("cylinderGeometry", { args: [
						.08,
						.1,
						.7,
						6
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", { color: "#100e0c" })]
				})
			]
		}, i))
	});
}
function Diver({ finL, finR }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			position: [
				0,
				0,
				.05
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("capsuleGeometry", { args: [
				.18,
				.55,
				6,
				10
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: "#12343c",
				roughness: .45
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			position: [
				0,
				.42,
				.12
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
				.16,
				12,
				12
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: "#102e34",
				roughness: .4
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			position: [
				0,
				.42,
				.24
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
				.09,
				10,
				10
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: "#b9f3ef",
				emissive: "#7ee0dc",
				emissiveIntensity: .35,
				roughness: .1
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			position: [
				0,
				.05,
				-.18
			],
			rotation: [
				.4,
				0,
				0
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("cylinderGeometry", { args: [
				.07,
				.07,
				.42,
				8
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: "#e37b4a",
				roughness: .4,
				metalness: .3
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			ref: finL,
			position: [
				-.28,
				.05,
				-.05
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
				.28,
				.04,
				.16
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", { color: "#1c4e56" })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			ref: finR,
			position: [
				.28,
				.05,
				-.05
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
				.28,
				.04,
				.16
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", { color: "#1c4e56" })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			position: [
				-.08,
				-.42,
				.12
			],
			rotation: [
				.5,
				.2,
				0
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
				.1,
				.04,
				.28
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", { color: "#0e2a30" })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			position: [
				.08,
				-.42,
				.12
			],
			rotation: [
				.5,
				-.2,
				0
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
				.1,
				.04,
				.28
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", { color: "#0e2a30" })]
		})
	] });
}
function makeFloorMaterial() {
	return new ShaderMaterial({
		uniforms: {
			uTime: { value: 0 },
			uStress: { value: 0 }
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
    `
	});
}
function makeSkyMaterial() {
	return new ShaderMaterial({
		side: 1,
		depthWrite: false,
		uniforms: {
			uStress: { value: 0 },
			uSun: { value: .4 }
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
    `
	});
}
function makeWaterMaterial() {
	return new ShaderMaterial({
		transparent: true,
		depthWrite: false,
		side: 2,
		uniforms: {
			uTime: { value: 0 },
			uStress: { value: 0 }
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
    `
	});
}
function DiveCanvas({ source, interactive, stationId }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Canvas, {
		camera: {
			position: [
				0,
				1.2,
				12
			],
			fov: 68,
			near: .1,
			far: 90
		},
		dpr: interactive ? [1, 1.5] : [1, 1.15],
		gl: {
			antialias: true,
			powerPreference: "high-performance"
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiveWorld, {
			source,
			interactive,
			stationId
		})
	});
}
var RADIUS = 5;
var east = new Vector3();
var north = new Vector3();
var forward = new Vector3();
var right = new Vector3();
var up = new Vector3();
var next = new Vector3();
var cam = new Vector3();
var look = new Vector3();
var basis = new Matrix4();
var spherical = new Spherical(13.2, 2.08, .4);
var tmpA = new Vector3();
var tmpB = new Vector3();
function fillTangent(latDeg, lonDeg) {
	const lat = latDeg * Math.PI / 180;
	const lon = lonDeg * Math.PI / 180;
	const sl = Math.sin(lat);
	const cl = Math.cos(lat);
	const so = Math.sin(lon);
	const co = Math.cos(lon);
	north.set(-sl * co, cl, -sl * so).normalize();
	east.set(-so, 0, co).normalize();
}
function yawToward(lat1, lon1, lat2, lon2) {
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
	(0, import_react.useEffect)(() => {
		color.colorSpace = SRGBColorSpace;
		color.anisotropy = 8;
	}, [color]);
	const atmosphere = (0, import_react.useMemo)(() => new ShaderMaterial({
		side: 1,
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
        `
	}), []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
		onClick: (e) => {
			if (dragMoved) return;
			e.stopPropagation();
			const ll = vecToLatLon(e.point.x, e.point.y, e.point.z);
			if (ll.lat < -73 || ll.lat > -50) return;
			useTide.getState().addWaypoint(ll);
			useTide.getState().setHint("Course mark dropped. Hold W, or let the helm follow the marks.");
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
			RADIUS,
			96,
			64
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
			map: color,
			roughness: .92,
			metalness: .04
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("mesh", {
		scale: 1.045,
		material: atmosphere,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
			RADIUS,
			48,
			32
		] })
	})] });
}
var dragMoved = false;
function OceanRig() {
	const ship = (0, import_react.useRef)(null);
	const { camera, gl } = useThree();
	const drag = (0, import_react.useRef)({
		on: false,
		x: 0,
		y: 0,
		moved: false
	});
	const nearTick = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		window.__controlsTest = {
			getYaw: () => sim.yaw,
			getSpeed: () => sim.speed,
			setKeys: (codes) => setQaKeys(codes)
		};
		const el = gl.domElement;
		const down = (e) => {
			const view = useTide.getState().view;
			if (simLive && view === "helm") return;
			drag.current = {
				on: true,
				x: e.clientX,
				y: e.clientY,
				moved: false
			};
			dragMoved = false;
		};
		const move = (e) => {
			if (!drag.current.on) return;
			const dx = e.clientX - drag.current.x;
			const dy = e.clientY - drag.current.y;
			if (dx * dx + dy * dy > 16) {
				drag.current.moved = true;
				dragMoved = true;
			}
			drag.current.x = e.clientX;
			drag.current.y = e.clientY;
			spherical.theta -= dx * .005;
			spherical.phi = MathUtils.clamp(spherical.phi - dy * .005, .55, 2.55);
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
		const dt = Math.min(raw, .05);
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
			if (Math.abs(sim.speed) < .02 && throttle === 0 && !coasting) sim.speed = 0;
			const reverse = sim.speed >= -.05 ? 1 : -1;
			if (steer !== 0) sim.yaw += steer * 1.85 * reverse * dt;
			else if (waypoints.length) {
				const desired = yawToward(sim.lat, sim.lon, waypoints[0].lat, waypoints[0].lon);
				const d = Math.atan2(Math.sin(desired - sim.yaw), Math.cos(desired - sim.yaw));
				sim.yaw += MathUtils.clamp(d, -1.5 * dt, 1.5 * dt);
				if (angularDeg({
					lat: sim.lat,
					lon: sim.lon
				}, waypoints[0]) < .55) useTide.getState().shiftWaypoint();
			}
			fillTangent(sim.lat, sim.lon);
			forward.copy(east).multiplyScalar(-Math.sin(sim.yaw)).addScaledVector(north, Math.cos(sim.yaw));
			const p = latLonToVec(sim.lat, sim.lon, RADIUS);
			next.set(p.x, p.y, p.z).addScaledVector(forward, sim.speed * .13 * dt);
			next.normalize();
			let lat = Math.asin(MathUtils.clamp(next.y, -1, 1)) * 180 / Math.PI;
			let lon = Math.atan2(next.z, next.x) * 180 / Math.PI;
			if (lat < -71.2) lat = -71.2;
			if (lat > -51.2) lat = -51.2;
			sim.lat = lat;
			sim.lon = lon;
			nearTick.current += dt;
			if (nearTick.current > .2) {
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
			ship.current.position.set(placed.x, placed.y, placed.z).addScaledVector(up, .02);
		}
		if (!(simLive && useTide.getState().view === "helm")) {
			if (!simLive && !drag.current.on && !reduceMotion) spherical.theta += dt * .08;
			cam.setFromSpherical(spherical);
			camera.position.lerp(cam, 1 - Math.pow(.04, dt));
			camera.up.set(0, 1, 0);
			camera.lookAt(0, -.55, 0);
			return;
		}
		tmpB.set(placed.x, placed.y, placed.z);
		cam.copy(tmpB).addScaledVector(forward, -1.65).addScaledVector(up, .78);
		if (cam.length() < 5.4) cam.normalize().multiplyScalar(5.62);
		const k = 1 - Math.pow(.001, dt);
		camera.position.lerp(cam, k);
		camera.up.copy(up);
		look.copy(tmpB).addScaledVector(forward, 1.5).addScaledVector(up, .28);
		camera.lookAt(look);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("group", {
		ref: ship,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShipMesh, {})
	});
}
function ShipMesh() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
		scale: .34,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
				position: [
					0,
					.12,
					.05
				],
				castShadow: true,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
					.42,
					.16,
					1.15
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
					color: "#d5e4e6",
					roughness: .42,
					metalness: .25
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
				position: [
					0,
					.12,
					.78
				],
				rotation: [
					Math.PI / 2,
					0,
					0
				],
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("coneGeometry", { args: [
					.21,
					.48,
					4
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
					color: "#e7f3f5",
					roughness: .35,
					metalness: .2
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
				position: [
					0,
					.28,
					-.18
				],
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
					.28,
					.18,
					.38
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
					color: "#14343a",
					roughness: .5
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
				position: [
					0,
					.34,
					-.18
				],
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
					.2,
					.08,
					.22
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
					color: "#8ee0e0",
					emissive: "#1a6e70",
					emissiveIntensity: .45,
					roughness: .2
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
				position: [
					0,
					.55,
					-.28
				],
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("cylinderGeometry", { args: [
					.02,
					.02,
					.55,
					6
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", { color: "#d7e6e8" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
				position: [
					0,
					.84,
					-.28
				],
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
					.06,
					10,
					10
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
					color: "#e37b4a",
					emissive: "#e37b4a",
					emissiveIntensity: 1.4
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
				position: [
					0,
					.02,
					-.15
				],
				rotation: [
					0,
					0,
					0
				],
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
					.5,
					.03,
					.28
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", { color: "#0e3a40" })]
			})
		]
	});
}
function Beacons() {
	const near = useTide((s) => s.nearStationId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: STATIONS.map((s) => {
		const p = latLonToVec(s.lat, s.lon, 5.02);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Beacon, {
			position: [
				p.x,
				p.y,
				p.z
			],
			active: near === s.id
		}, s.id);
	}) });
}
function Beacon({ position, active }) {
	const ref = (0, import_react.useRef)(null);
	const glow = (0, import_react.useRef)(null);
	(0, import_react.useLayoutEffect)(() => {
		const upV = new Vector3(...position).normalize();
		const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), upV);
		ref.current?.quaternion.copy(q);
	}, [position]);
	useFrame(({ clock }) => {
		if (!glow.current) return;
		const s = 1 + Math.sin(clock.elapsedTime * 2.2) * .18;
		glow.current.scale.setScalar(active ? s * 1.35 : s);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
		ref,
		position,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			position: [
				0,
				.16,
				0
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("cylinderGeometry", { args: [
				.012,
				.012,
				.32,
				6
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: active ? "#e37b4a" : "#9ee7e6",
				emissive: active ? "#e37b4a" : "#14686a",
				emissiveIntensity: .9
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			ref: glow,
			position: [
				0,
				.36,
				0
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
				.045,
				12,
				12
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: active ? "#e37b4a" : "#d5f6f4",
				emissive: active ? "#e37b4a" : "#3dbebf",
				emissiveIntensity: 1.5
			})]
		})]
	});
}
function WaypointMarks() {
	const wps = useTide((s) => s.waypoints);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: wps.map((w, i) => {
		const p = latLonToVec(w.lat, w.lon, 5.08);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			position: [
				p.x,
				p.y,
				p.z
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
				.045,
				10,
				10
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: "#e37b4a",
				emissive: "#e37b4a",
				emissiveIntensity: .8
			})]
		}, `${w.lat.toFixed(2)}-${w.lon.toFixed(2)}-${i}`);
	}) });
}
function Stars() {
	const positions = (0, import_react.useMemo)(() => {
		const arr = /* @__PURE__ */ new Float32Array(2700);
		for (let i = 0; i < 900; i++) {
			const v = new Vector3().randomDirection().multiplyScalar(40 + Math.random() * 20);
			arr[i * 3] = v.x;
			arr[i * 3 + 1] = v.y;
			arr[i * 3 + 2] = v.z;
		}
		return arr;
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("points", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("bufferGeometry", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("bufferAttribute", {
		attach: "attributes-position",
		args: [positions, 3]
	}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pointsMaterial", {
		color: "#d5eef2",
		size: .06,
		sizeAttenuation: true
	})] });
}
function Scene() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("color", {
			attach: "background",
			args: ["#071018"]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ambientLight", { intensity: .55 }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("directionalLight", {
			position: [
				8,
				6,
				4
			],
			intensity: 2.1,
			color: "#fff4e4"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("directionalLight", {
			position: [
				-6,
				-2,
				-4
			],
			intensity: .35,
			color: "#7ec8d4"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stars, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
			fallback: null,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Earth, {})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OceanRig, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Beacons, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WaypointMarks, {})
	] });
}
function GlobeCanvas() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Canvas, {
		camera: {
			position: [
				4,
				-2,
				12
			],
			fov: 42,
			near: .1,
			far: 80
		},
		dpr: [1, 1.6],
		gl: {
			antialias: true,
			powerPreference: "high-performance"
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scene, {})
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function isPathway(v) {
	return v === "reduce" || v === "maintain" || v === "increase";
}
var requestBrief = createServerFn({ method: "POST" }).validator((input) => {
	if (!input || !isPathway(input.pathway)) throw new Error("Choose a fossil pathway first.");
	const year = Number(input.year);
	if (!Number.isFinite(year) || year < 2025 || year > 2100) throw new Error("Year must sit between 2025 and 2100.");
	const stationId = stationById(input.stationId).id;
	const comparePathway = isPathway(input.comparePathway) ? input.comparePathway : void 0;
	const compareYear = comparePathway ? Math.min(2100, Math.max(2025, Number(input.compareYear) || year)) : void 0;
	return {
		pathway: input.pathway,
		year: Math.round(year),
		stationId,
		comparePathway,
		compareYear: compareYear === void 0 ? void 0 : Math.round(compareYear)
	};
}).handler(createSsrRpc("6683acb3a38e528e0a3518b2d77804b7f6b06e0d230b3f05e9c1c5076fa1de40"));
function useSimPulse(ms = 160) {
	const [, setN] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => setN((n) => n + 1), ms);
		return () => window.clearInterval(id);
	}, [ms]);
}
function Hud() {
	const started = useTide((s) => s.started);
	const sheet = useTide((s) => s.sheet);
	useYearPlay();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-0 z-10 flex flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {}),
			started ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DesktopPanels, {}) : null,
			started && sheet === "none" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ForcingDock, {}) : null,
			started ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HintLine, {}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHost, {}),
			!started ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StartCard, {}) : null
		]
	});
}
function useYearPlay() {
	const playing = useTide((s) => s.playing);
	(0, import_react.useEffect)(() => {
		if (!playing) return;
		if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
			useTide.getState().setPlaying(false);
			return;
		}
		let raf = 0;
		let last = performance.now();
		const loop = (now) => {
			const dt = Math.min(.05, (now - last) / 1e3);
			last = now;
			const year = useTide.getState().year + dt * 7.5;
			if (year >= 2100) {
				useTide.getState().setYear(2100);
				useTide.getState().setPlaying(false);
				return;
			}
			useTide.getState().setYear(year);
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [playing]);
}
function TopBar() {
	const started = useTide((s) => s.started);
	const mode = useTide((s) => s.mode);
	const view = useTide((s) => s.view);
	const sheet = useTide((s) => s.sheet);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "pointer-events-auto flex items-center gap-2 px-3 pt-3 md:px-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xl leading-none tracking-tight text-fg md:text-2xl",
					children: "FutureTide"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-xs text-muted",
					children: "FishCast expedition · Georgia Tech BDBI"
				})]
			}),
			started ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "ml-auto flex items-center gap-1 rounded-full border border-line bg-surface/90 p-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeButton, {
						mode: "voyage",
						current: mode,
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ship, { className: "size-4" }),
						label: "Sail"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeButton, {
						mode: "dive",
						current: mode,
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waves, { className: "size-4" }),
						label: "Dive"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ModeButton, {
						mode: "compare",
						current: mode,
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compass, { className: "size-4" }),
						label: "Compare"
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "ml-auto" }),
			started && mode === "voyage" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "hidden min-h-11 items-center rounded-full border border-line bg-surface px-3 text-sm text-fg md:flex",
				onClick: () => useTide.getState().setView(view === "helm" ? "globe" : "helm"),
				children: view === "helm" ? "Globe" : "Helm"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "hidden min-h-11 items-center rounded-full border border-line bg-surface px-3 text-sm text-fg lg:flex",
				onClick: () => useTide.getState().setSheet(sheet === "chart" ? "none" : "chart"),
				children: "Chart"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "grid size-11 place-items-center rounded-full border border-line bg-surface text-fg",
				"aria-label": "About this sketch",
				onClick: () => useTide.getState().setSheet(sheet === "about" ? "none" : "about"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "size-4" })
			})
		]
	});
}
function ModeButton({ mode, current, icon, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => {
			if (mode === "dive") {
				const s = useTide.getState();
				const id = s.nearStationId ?? s.diveStationId;
				if (!id) {
					useTide.getState().setHint("Sail onto a glowing ground, or pick one on the chart, then dive.");
					useTide.getState().setSheet("chart");
					useTide.getState().setMode("voyage");
					return;
				}
				useTide.getState().setDiveStation(id);
			}
			useTide.getState().setMode(mode);
		},
		className: `flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-medium ${mode === current ? "bg-teal text-teal-ink" : "text-fg"}`,
		children: [icon, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label })]
	});
}
function DesktopPanels() {
	const mode = useTide((s) => s.mode);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "pointer-events-auto absolute top-20 left-4 hidden max-h-[calc(100dvh-9rem)] w-72 flex-col gap-3 overflow-y-auto ft-scroll lg:flex",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PathwayCard, {}), mode !== "dive" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StationCard, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiveLegend, {})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
		className: "pointer-events-auto absolute top-20 right-4 hidden max-h-[calc(100dvh-9rem)] w-80 overflow-y-auto ft-scroll xl:block",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Readings, {})
	})] });
}
function PathwayCard() {
	const pathway = useTide((s) => s.pathway);
	const comparePathway = useTide((s) => s.comparePathway);
	const compareYear = useTide((s) => s.compareYear);
	const mode = useTide((s) => s.mode);
	const year = useThrottledYear();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "ft-panel p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-wide text-muted uppercase",
				children: "Fossil pathway"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 grid gap-2",
				children: PATHWAYS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => useTide.getState().setPathway(p.id),
					className: `rounded-xl border px-3 py-2 text-left ${pathway === p.id ? "border-teal bg-teal/15" : "border-line bg-surface-2/40"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-baseline justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium text-fg",
							children: p.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted",
							children: p.ssp
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-0.5 block text-xs text-muted",
						children: p.blurb
					})]
				}, p.id))
			}),
			mode === "compare" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-3 block text-xs text-muted",
				children: [
					"Right-hand future",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "mt-1 min-h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm text-fg",
						value: comparePathway,
						onChange: (e) => useTide.getState().setCompare(e.target.value),
						children: PATHWAYS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: p.id,
							children: p.label
						}, p.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: "mt-2 w-full accent-teal",
						type: "range",
						min: 2025,
						max: 2100,
						value: compareYear,
						onChange: (e) => useTide.getState().setCompare(comparePathway, Number(e.target.value)),
						"aria-label": "Comparison year"
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-xs text-muted",
				children: [
					"Clock set to ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-fg",
						children: year
					}),
					". Illustrated, not a FishCast forecast."
				]
			})
		]
	});
}
function StationCard() {
	useSimPulse();
	const near = useTide((s) => s.nearStationId);
	const focus = nearestStation(sim.lat, sim.lon);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "ft-panel p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-wide text-muted uppercase",
				children: "Krill grounds"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-fg",
				children: near ? `${stationById(near).name} is under the hull.` : `${Math.round(focus.nm)} nm from ${focus.station.short}.`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 grid gap-1.5",
				children: STATIONS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => {
						useTide.getState().clearWaypoints();
						useTide.getState().addWaypoint({
							lat: s.lat,
							lon: s.lon
						});
						useTide.getState().setView("helm");
						useTide.getState().setMode("voyage");
						useTide.getState().setHint(`Course laid for ${s.name}. The helm will follow it.`);
					},
					className: `flex min-h-11 w-full items-center justify-between rounded-xl px-2 text-left text-sm ${near === s.id ? "bg-krill/20 text-fg" : "text-fg hover:bg-surface-2/70"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block font-medium",
						children: s.short
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-xs text-muted",
						children: s.area
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Anchor, { className: "size-4 shrink-0 text-teal" })]
				}) }, s.id))
			})
		]
	});
}
function DiveLegend() {
	const id = useTide((s) => s.diveStationId ?? s.nearStationId);
	const station = stationById(id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "ft-panel p-3 text-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-wide text-muted uppercase",
				children: "Under the ice"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 font-medium text-fg",
				children: station.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-muted",
				children: station.note
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-muted",
				children: station.mpa
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-xs text-muted",
				children: "W swim · A port · D starboard · Space rise · C descend"
			})
		]
	});
}
function Readings() {
	const pathway = useTide((s) => s.pathway);
	const year = useThrottledYear();
	const stationId = useTide((s) => s.diveStationId ?? s.nearStationId ?? "bransfield");
	const station = stationById(stationId);
	const m = metricsAt(pathway, year, station);
	const series = (0, import_react.useMemo)(() => krillSeries(station), [station]);
	const path = PATHWAYS.find((p) => p.id === pathway);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "ft-panel p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs tracking-wide text-muted uppercase",
					children: "Station reading"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg leading-tight text-fg",
					children: station.short
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-right text-xs text-muted",
					children: [path.label, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-fg",
						children: year
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-3 grid grid-cols-2 gap-2 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Ocean heat",
						v: `+${fmt(m.sst)} °C`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Ice days lost",
						v: `${Math.round(m.ice)}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Krill index",
						v: `${Math.round(m.krill)}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Salps / krill",
						v: fmt(m.salpRatio)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Biodiversity",
						v: `${Math.round(m.biodiversity)}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						k: "Fishery exposure",
						v: `${Math.round(m.fisheryRisk)}`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 h-28",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
					width: "100%",
					height: "100%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LineChart, {
						data: series,
						margin: {
							top: 8,
							right: 8,
							left: -18,
							bottom: 0
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
								stroke: "var(--color-line)",
								strokeDasharray: "3 3"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
								dataKey: "year",
								tick: {
									fill: "var(--color-muted)",
									fontSize: 10
								},
								interval: 3
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
								tick: {
									fill: "var(--color-muted)",
									fontSize: 10
								},
								domain: [0, 110]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { contentStyle: {
								background: "var(--color-surface)",
								border: "1px solid var(--color-line)",
								borderRadius: 12,
								color: "var(--color-fg)"
							} }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								type: "monotone",
								dataKey: "Reduce",
								stroke: "var(--color-teal)",
								dot: false,
								strokeWidth: 2
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								type: "monotone",
								dataKey: "Maintain",
								stroke: "var(--color-muted)",
								dot: false,
								strokeWidth: 2
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
								type: "monotone",
								dataKey: "Increase",
								stroke: "var(--color-krill)",
								dot: false,
								strokeWidth: 2
							})
						]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted",
				children: "Krill habitat index, 100 = early-2020s sketch at this ground."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-3 min-h-11 w-full rounded-full bg-krill px-4 text-sm font-medium text-krill-ink",
				onClick: () => void askGrok(),
				children: "Ask Grok for a decision brief"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-muted",
				children: "Illustrated scenario. Not a validated forecast."
			})
		]
	});
}
function Stat({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-bg/50 px-2 py-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-xs text-muted",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "font-medium text-fg",
			children: v
		})]
	});
}
function useThrottledYear() {
	const [year, setYear] = (0, import_react.useState)(() => Math.round(useTide.getState().year));
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => {
			const next = Math.round(useTide.getState().year);
			setYear((prev) => prev === next ? prev : next);
		}, 180);
		return () => window.clearInterval(id);
	}, []);
	return year;
}
async function askGrok() {
	const s = useTide.getState();
	const station = stationById(s.diveStationId ?? s.nearStationId ?? "bransfield");
	const year = Math.round(s.year);
	const compare = s.mode === "compare";
	const key = `${s.pathway}|${year}|${station.id}|${compare ? `${s.comparePathway}|${Math.round(s.compareYear)}` : ""}`;
	s.setSheet("brief");
	try {
		const cached = localStorage.getItem(`ft-brief:${key}`);
		if (cached) {
			s.setBrief(JSON.parse(cached), key);
			return;
		}
	} catch {}
	s.setBriefStatus("loading");
	try {
		const res = await requestBrief({ data: {
			pathway: s.pathway,
			year,
			stationId: station.id,
			comparePathway: compare ? s.comparePathway : void 0,
			compareYear: compare ? Math.round(s.compareYear) : void 0
		} });
		if (!res.ok) {
			useTide.getState().setBriefStatus("error", res.error);
			return;
		}
		try {
			localStorage.setItem(`ft-brief:${key}`, JSON.stringify(res.brief));
		} catch {}
		useTide.getState().setBrief(res.brief, key);
	} catch (err) {
		useTide.getState().setBriefStatus("error", err instanceof Error ? err.message : "The brief failed.");
	}
}
function ForcingDock() {
	const mode = useTide((s) => s.mode);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 md:justify-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchHelm, { show: mode !== "compare" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ForcingDial, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileTools, {})
		]
	});
}
function ForcingDial() {
	const [year, setYear] = (0, import_react.useState)(useTide.getState().year);
	const playing = useTide((s) => s.playing);
	const pathway = useTide((s) => s.pathway);
	const stationId = useTide((s) => s.diveStationId ?? s.nearStationId);
	const station = stationById(stationId);
	(0, import_react.useEffect)(() => {
		let raf = 0;
		const loop = () => {
			const y = useTide.getState().year;
			setYear((prev) => Math.abs(prev - y) < .05 ? prev : y);
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, []);
	const m = metricsAt(pathway, year, station);
	const t = (year - 2025) / 75;
	const sky = mix([
		120,
		186,
		198
	], [
		18,
		16,
		20
	], m.stress);
	const glow = mix([
		255,
		214,
		170
	], [
		90,
		42,
		24
	], m.stress);
	const ang = Math.PI * .72 + (Math.PI * 2.28 - Math.PI * .72) * t;
	const nx = 80 + Math.cos(ang) * 58;
	const ny = 86 + Math.sin(ang) * 58;
	const setFromPointer = (clientX, rect) => {
		const next = 2025 + (clientX - rect.left) / rect.width * 75;
		useTide.getState().setYear(next);
		useTide.getState().setPlaying(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-40 md:w-52",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 160 160",
			className: "w-full",
			role: "slider",
			"aria-valuemin": 2025,
			"aria-valuemax": 2100,
			"aria-valuenow": Math.round(year),
			"aria-label": "Forcing clock",
			onPointerDown: (e) => {
				const rect = e.currentTarget.getBoundingClientRect();
				e.currentTarget.setPointerCapture(e.pointerId);
				setFromPointer(e.clientX, rect);
			},
			onPointerMove: (e) => {
				if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
				setFromPointer(e.clientX, e.currentTarget.getBoundingClientRect());
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "80",
					cy: "86",
					r: "70",
					fill: sky
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: 80 + (1 - m.stress) * 10,
					cy: 48 + m.stress * 28,
					r: 10 - m.stress * 4,
					fill: glow
				}),
				Array.from({ length: 5 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: 28 + i * 22,
					y: 108 - m.stress * (10 + i % 3 * 8),
					width: "10",
					height: 12 + m.stress * (16 + i % 3 * 10),
					rx: "1",
					fill: `rgb(${20 + i * 4} ${16 + i * 2} 14)`,
					opacity: .35 + m.stress * .65
				}, i)),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M 28 118 A 58 58 0 1 1 132 118",
					fill: "none",
					stroke: "var(--color-line)",
					strokeWidth: "6",
					strokeLinecap: "round"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
					x1: "80",
					y1: "86",
					x2: nx,
					y2: ny,
					stroke: "var(--color-fg)",
					strokeWidth: "2"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: nx,
					cy: ny,
					r: "4",
					fill: "var(--color-krill)"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
					x: "80",
					y: "82",
					textAnchor: "middle",
					fill: "var(--color-fg)",
					fontFamily: "Fraunces, serif",
					fontSize: "22",
					children: Math.round(year)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
					x: "80",
					y: "98",
					textAnchor: "middle",
					fill: "var(--color-muted)",
					fontSize: "8",
					children: "forcing clock"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "grid size-11 place-items-center rounded-full bg-teal text-teal-ink",
				"aria-label": playing ? "Pause the clock" : "Play the clock",
				onClick: () => {
					const s = useTide.getState();
					if (!s.playing && s.year >= 2100) s.setYear(2025);
					s.setPlaying(!s.playing);
				},
				children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs text-muted",
				children: "Sky darkens as forcing rises"
			})]
		})]
	});
}
function mix(a, b, t) {
	const u = Math.min(1, Math.max(0, t));
	const c = a.map((v, i) => Math.round(v + (b[i] - v) * u));
	return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}
function TouchHelm({ show }) {
	if (!show) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "hidden w-28 md:block md:w-0" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-auto grid grid-cols-3 gap-1 md:hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelmKey, {
				code: "KeyW",
				label: "Ahead"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelmKey, {
				code: "KeyA",
				label: "Port"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelmKey, {
				code: "KeyS",
				label: "Back"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelmKey, {
				code: "KeyD",
				label: "Stbd"
			})
		]
	});
}
function HelmKey({ code, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "h-12 min-w-12 rounded-xl border border-line bg-surface/90 text-xs text-fg",
		...holdProps(code),
		children: label
	});
}
function MobileTools() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-auto flex flex-col gap-1 lg:hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolButton, {
				sheet: "pathways",
				label: "Paths"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolButton, {
				sheet: "chart",
				label: "Chart"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolButton, {
				sheet: "stats",
				label: "Data"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToolButton, {
				sheet: "brief",
				label: "Brief"
			})
		]
	});
}
function ToolButton({ sheet, label }) {
	const open = useTide((s) => s.sheet === sheet);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: `min-h-11 rounded-full px-3 text-xs font-medium ${open ? "bg-teal text-teal-ink" : "border border-line bg-surface text-fg"}`,
		onClick: () => useTide.getState().setSheet(open ? "none" : sheet),
		children: label
	});
}
function HintLine() {
	const hint = useTide((s) => s.hint);
	const near = useTide((s) => s.nearStationId);
	const mode = useTide((s) => s.mode);
	if (mode !== "voyage") return null;
	const text = near && mode === "voyage" ? `${stationById(near).name} — diver is on the rail.` : hint;
	if (!text) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none absolute top-20 right-3 left-3 flex justify-center lg:top-auto lg:bottom-64",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "pointer-events-auto max-w-md rounded-full border border-line bg-surface/90 px-4 py-2 text-center text-sm text-fg",
			children: [text, near && mode === "voyage" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "ml-2 font-medium text-krill",
				onClick: () => {
					useTide.getState().setDiveStation(near);
					useTide.getState().setMode("dive");
				},
				children: "Send the diver"
			}) : null]
		})
	});
}
function SheetHost() {
	const sheet = useTide((s) => s.sheet);
	if (sheet === "none") return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-auto absolute inset-x-0 bottom-0 z-20 max-h-[78dvh] overflow-y-auto rounded-t-3xl border border-line bg-surface p-4 ft-scroll lg:inset-x-auto lg:right-4 lg:bottom-4 lg:w-96 lg:rounded-3xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-lg text-fg",
					children: sheet === "chart" ? "Course chart" : sheet === "stats" ? "Readings" : sheet === "brief" ? "Decision brief" : sheet === "about" ? "What this is" : "Pathways"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "grid size-11 place-items-center",
					"aria-label": "Close",
					onClick: () => useTide.getState().setSheet("none"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				})]
			}),
			sheet === "pathways" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PathwayCard, {}) : null,
			sheet === "chart" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartPanel, {}) : null,
			sheet === "stats" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Readings, {}) : null,
			sheet === "brief" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BriefPanel, {}) : null,
			sheet === "about" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AboutCopy, {}) : null
		]
	});
}
function ChartPanel() {
	useSimPulse(120);
	const wps = useTide((s) => s.waypoints);
	const ship = projectChart(sim.lat, sim.lon);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 200 200",
			className: "mx-auto w-full max-w-sm touch-none",
			onPointerDown: (e) => {
				const rect = e.currentTarget.getBoundingClientRect();
				const x = (e.clientX - rect.left) / rect.width * 200;
				const y = (e.clientY - rect.top) / rect.height * 200;
				const ll = unprojectChart(x, y);
				if (!ll) return;
				useTide.getState().addWaypoint(ll);
				useTide.getState().setView("helm");
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "100",
					cy: "100",
					r: "92",
					fill: "var(--color-bg)",
					stroke: "var(--color-line)"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "100",
					cy: "100",
					r: "22",
					fill: "var(--color-fg)",
					opacity: "0.85"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "100",
					cy: "100",
					r: "48",
					fill: "none",
					stroke: "var(--color-line)"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
					cx: "100",
					cy: "100",
					r: "74",
					fill: "none",
					stroke: "var(--color-line)"
				}),
				STATIONS.map((s) => {
					const p = projectChart(s.lat, s.lon);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: p.x,
						cy: p.y,
						r: "3.2",
						fill: "var(--color-teal)"
					}, s.id);
				}),
				wps.map((w, i) => {
					const p = projectChart(w.lat, w.lon);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: p.x,
						cy: p.y,
						r: "2.4",
						fill: "var(--color-krill)"
					}, i);
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
					points: `${ship.x},${ship.y - 5} ${ship.x - 3.5},${ship.y + 4} ${ship.x + 3.5},${ship.y + 4}`,
					fill: "var(--color-krill)"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted",
			children: "Tap the ring of ocean to drop course marks. The pale disc is Antarctica. Teal dots are krill grounds."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "mt-2 min-h-11 rounded-full border border-line px-4 text-sm text-fg",
			onClick: () => useTide.getState().clearWaypoints(),
			children: "Clear course"
		})
	] });
}
function BriefPanel() {
	const status = useTide((s) => s.briefStatus);
	const brief = useTide((s) => s.brief);
	const error = useTide((s) => s.briefError);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "text-sm",
		children: [
			status === "idle" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted",
				children: "Ask Grok to turn this station’s illustrated numbers into a short brief for a non-technical reader."
			}) : null,
			status === "loading" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-fg",
				children: "Grok is reading the station packet…"
			}) : null,
			status === "error" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-krill",
				children: error
			}) : null,
			status === "ready" && brief ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display text-xl text-fg",
					children: brief.headline
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-fg",
					children: brief.narrative
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 grid gap-2",
					children: brief.consequences.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "rounded-xl bg-bg/60 px-3 py-2 text-fg",
						children: c
					}, c))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-muted",
					children: brief.uncertainty
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
					className: "mt-3 font-medium text-fg",
					children: "Questions worth asking"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-1 grid list-decimal gap-1 pl-4 text-fg",
					children: brief.decisions.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: d }, d))
				})
			] }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-3 min-h-11 rounded-full bg-krill px-4 font-medium text-krill-ink",
				onClick: () => void askGrok(),
				children: status === "loading" ? "Writing…" : "Ask Grok"
			})
		]
	});
}
function AboutCopy() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3 text-sm text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"FutureTide sails the Southern Ocean the way FishCast studies it: Antarctic krill, ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "Euphausia superba" }),
				", and the marine protected areas managed by CCAMLR."
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: FISHCAST_NOTE }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "The three pathways borrow the shape of IPCC shared socioeconomic pathways. Sea-ice days, krill index, and heat are workshop illustrations so a non-technical reader can see a direction of travel. They are not CMIP6 grid cells and not FishCast predictions. Antarctic benthic gardens here stand in for ice-linked habitat. Tropical coral reefs are a different ocean; the same fossil pathways are what bleach them." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted",
				children: "Historical context only: CCAMLR’s Area 48 krill trigger was long discussed at 620,000 tonnes a year. The Ross Sea region MPA covers about 1.55 million km². Management rules change. This tool does not predict catches."
			})
		]
	});
}
function StartCard() {
	const pathway = useTide((s) => s.pathway);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none absolute inset-0 flex items-end justify-center p-3 md:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "pointer-events-auto ft-panel flex max-h-[82dvh] w-full max-w-xl flex-col p-4 md:p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "overflow-y-auto ft-scroll",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tracking-wide text-teal uppercase",
							children: "Southern Ocean · three futures"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-1 font-display text-3xl leading-none text-fg md:text-5xl",
							children: "Take the helm before the ice does."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-muted",
							children: "Plot a course across CCAMLR waters. When the ship reaches a krill ground, send a diver under the ice and turn the forcing clock."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 grid gap-2",
							children: PATHWAYS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => useTide.getState().setPathway(p.id),
								className: `rounded-2xl border px-3 py-2 text-left ${pathway === p.id ? "border-teal bg-teal/15" : "border-line"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-fg",
									children: p.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-0.5 block text-sm text-muted",
									children: p.blurb
								})]
							}, p.id))
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mt-3 min-h-12 w-full shrink-0 rounded-full bg-teal px-4 py-3 text-base font-semibold text-teal-ink",
					onClick: () => {
						setSimLive(true);
						useTide.getState().start();
						useTide.getState().setHint("Bransfield Strait is east of the bow. Hold W, or tap a ground to lay a course. A turns to port.");
					},
					children: "Start the voyage"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 flex items-start gap-2 text-xs text-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fish, { className: "mt-0.5 size-4 shrink-0 text-krill" }), "Illustrated scenarios for a workshop. Not a validated forecast."]
				})
			]
		})
	});
}
function CompareLabels() {
	const pathway = useTide((s) => s.pathway);
	const compare = useTide((s) => s.comparePathway);
	const year = useThrottledYear();
	const compareYear = useTide((s) => s.compareYear);
	const left = PATHWAYS.find((p) => p.id === pathway);
	const right = PATHWAYS.find((p) => p.id === compare);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-x-0 top-16 z-30 grid grid-cols-2 gap-2 px-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "justify-self-start rounded-full bg-surface/90 px-3 py-1 text-xs text-fg",
			children: [
				left.label,
				" · ",
				year
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "justify-self-end rounded-full bg-surface/90 px-3 py-1 text-xs text-fg",
			children: [
				right.label,
				" · ",
				Math.round(compareYear)
			]
		})]
	});
}
function FutureTide() {
	const mode = useTide((s) => s.mode);
	const started = useTide((s) => s.started);
	const stationId = useTide((s) => s.diveStationId ?? s.nearStationId ?? "bransfield");
	(0, import_react.useEffect)(() => bindInput(), []);
	(0, import_react.useEffect)(() => {}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "fixed inset-0 overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0",
				children: started && mode === "compare" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid h-full grid-rows-2 md:grid-cols-2 md:grid-rows-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiveCanvas, {
						source: "main",
						interactive: false,
						stationId
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiveCanvas, {
						source: "compare",
						interactive: false,
						stationId
					})]
				}) : started && mode === "dive" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DiveCanvas, {
					source: "main",
					interactive: true,
					stationId
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlobeCanvas, {})
			}),
			started && mode === "compare" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompareLabels, {}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hud, {})
		]
	});
}
//#endregion
export { FutureTide };
