import { i as __toESM } from "../_runtime.mjs";
import { v as require_jsx_runtime, y as require_react } from "../_libs/@react-three/drei+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Dex6l1R2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FutureTide = (0, import_react.lazy)(() => import("./FutureTide-Bwg0VSyR.mjs").then((m) => ({ default: m.FutureTide })));
function Home() {
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setReady(true), []);
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaticSplash, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
		fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StaticSplash, {}),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FutureTide, {})
	});
}
function StaticSplash() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "ft-splash flex min-h-screen items-end justify-center p-4 md:items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "ft-panel w-full max-w-xl p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs tracking-wide text-teal uppercase",
					children: "Southern Ocean · three futures"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-1 font-display text-4xl leading-none text-fg",
					children: "FutureTide"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "An illustrated FishCast expedition. Sail CCAMLR waters, dive with Antarctic krill, and turn the forcing clock."
				})
			]
		})
	});
}
//#endregion
export { Home as component };
