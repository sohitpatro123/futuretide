import { create } from "zustand";
import type { Brief, LatLon, PathwayId } from "@/lib/futuretide/model";

export type Mode = "voyage" | "dive" | "compare";
export type HelmView = "helm" | "globe";
export type Sheet = "none" | "chart" | "stats" | "brief" | "pathways" | "about";

type TideState = {
  started: boolean;
  mode: Mode;
  view: HelmView;
  pathway: PathwayId;
  year: number;
  playing: boolean;
  comparePathway: PathwayId;
  compareYear: number;
  nearStationId: string | null;
  diveStationId: string | null;
  waypoints: LatLon[];
  sheet: Sheet;
  hint: string | null;
  brief: Brief | null;
  briefKey: string | null;
  briefStatus: "idle" | "loading" | "ready" | "error";
  briefError: string | null;
  start: () => void;
  setPathway: (pathway: PathwayId) => void;
  setYear: (year: number) => void;
  setPlaying: (playing: boolean) => void;
  setMode: (mode: Mode) => void;
  setView: (view: HelmView) => void;
  setCompare: (pathway: PathwayId, year?: number) => void;
  setNear: (id: string | null) => void;
  setDiveStation: (id: string | null) => void;
  addWaypoint: (p: LatLon) => void;
  clearWaypoints: () => void;
  shiftWaypoint: () => void;
  setSheet: (sheet: Sheet) => void;
  setHint: (hint: string | null) => void;
  setBriefStatus: (briefStatus: TideState["briefStatus"], briefError?: string | null) => void;
  setBrief: (brief: Brief | null, key: string | null) => void;
};

export const useTide = create<TideState>((set) => ({
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
  start: () => set({ started: true, view: "helm", sheet: "none" }),
  setPathway: (pathway) => set({ pathway }),
  setYear: (year) => set({ year: Math.min(2100, Math.max(2025, year)) }),
  setPlaying: (playing) => set({ playing }),
  setMode: (mode) => set({ mode, sheet: "none" }),
  setView: (view) => set({ view }),
  setCompare: (comparePathway, compareYear) =>
    set((s) => ({
      comparePathway,
      compareYear: compareYear ?? s.compareYear,
    })),
  setNear: (nearStationId) => set({ nearStationId }),
  setDiveStation: (diveStationId) => set({ diveStationId }),
  addWaypoint: (p) => set((s) => ({ waypoints: [...s.waypoints.slice(-7), p] })),
  clearWaypoints: () => set({ waypoints: [] }),
  shiftWaypoint: () => set((s) => ({ waypoints: s.waypoints.slice(1) })),
  setSheet: (sheet) => set({ sheet }),
  setHint: (hint) => set({ hint }),
  setBriefStatus: (briefStatus, briefError = null) => set({ briefStatus, briefError }),
  setBrief: (brief, briefKey) => set({ brief, briefKey, briefStatus: brief ? "ready" : "idle" }),
}));
