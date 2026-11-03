import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Anchor, Compass, Fish, Info, Pause, Play, Ship, Waves, X } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { requestBrief } from "@/lib/futuretide/briefing";
import { holdProps } from "@/lib/futuretide/input";
import {
  FISHCAST_NOTE,
  PATHWAYS,
  STATIONS,
  fmt,
  krillSeries,
  metricsAt,
  nearestStation,
  projectChart,
  stationById,
  unprojectChart,
  type Brief,
  type PathwayId,
} from "@/lib/futuretide/model";
import { setSimLive, sim } from "@/lib/futuretide/sim";
import { useTide, type Mode, type Sheet } from "@/lib/futuretide/store";

function useSimPulse(ms = 160) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setN((n) => n + 1), ms);
    return () => window.clearInterval(id);
  }, [ms]);
}

export function Hud() {
  const started = useTide((s) => s.started);
  const sheet = useTide((s) => s.sheet);
  useYearPlay();
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      <TopBar />
      {started ? <DesktopPanels /> : null}
      {started && sheet === "none" ? <ForcingDock /> : null}
      {started ? <HintLine /> : null}
      <SheetHost />
      {!started ? <StartCard /> : null}
    </div>
  );
}

function useYearPlay() {
  const playing = useTide((s) => s.playing);
  useEffect(() => {
    if (!playing) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      useTide.getState().setPlaying(false);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
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
  return (
    <header className="pointer-events-auto flex items-center gap-2 px-3 pt-3 md:px-4">
      <div className="min-w-0">
        <p className="font-display text-xl leading-none tracking-tight text-fg md:text-2xl">FutureTide</p>
        <p className="truncate text-xs text-muted">FishCast expedition · Georgia Tech BDBI</p>
      </div>
      {started ? (
        <nav className="ml-auto flex items-center gap-1 rounded-full border border-line bg-surface/90 p-1">
          <ModeButton mode="voyage" current={mode} icon={<Ship className="size-4" />} label="Sail" />
          <ModeButton mode="dive" current={mode} icon={<Waves className="size-4" />} label="Dive" />
          <ModeButton mode="compare" current={mode} icon={<Compass className="size-4" />} label="Compare" />
        </nav>
      ) : (
        <span className="ml-auto" />
      )}
      {started && mode === "voyage" ? (
        <button
          type="button"
          className="hidden min-h-11 items-center rounded-full border border-line bg-surface px-3 text-sm text-fg md:flex"
          onClick={() => useTide.getState().setView(view === "helm" ? "globe" : "helm")}
        >
          {view === "helm" ? "Globe" : "Helm"}
        </button>
      ) : null}
      <button
        type="button"
        className="hidden min-h-11 items-center rounded-full border border-line bg-surface px-3 text-sm text-fg lg:flex"
        onClick={() => useTide.getState().setSheet(sheet === "chart" ? "none" : "chart")}
      >
        Chart
      </button>
      <button
        type="button"
        className="grid size-11 place-items-center rounded-full border border-line bg-surface text-fg"
        aria-label="About this sketch"
        onClick={() => useTide.getState().setSheet(sheet === "about" ? "none" : "about")}
      >
        <Info className="size-4" />
      </button>
    </header>
  );
}

function ModeButton({
  mode,
  current,
  icon,
  label,
}: {
  mode: Mode;
  current: Mode;
  icon: ReactNode;
  label: string;
}) {
  const on = mode === current;
  return (
    <button
      type="button"
      onClick={() => {
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
      }}
      className={`flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-medium ${on ? "bg-teal text-teal-ink" : "text-fg"}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function DesktopPanels() {
  const mode = useTide((s) => s.mode);
  return (
    <>
      <aside className="pointer-events-auto absolute top-20 left-4 hidden max-h-[calc(100dvh-9rem)] w-72 flex-col gap-3 overflow-y-auto ft-scroll lg:flex">
        <PathwayCard />
        {mode !== "dive" ? <StationCard /> : <DiveLegend />}
      </aside>
      <aside className="pointer-events-auto absolute top-20 right-4 hidden max-h-[calc(100dvh-9rem)] w-80 overflow-y-auto ft-scroll xl:block">
        <Readings />
      </aside>
    </>
  );
}

function PathwayCard() {
  const pathway = useTide((s) => s.pathway);
  const comparePathway = useTide((s) => s.comparePathway);
  const compareYear = useTide((s) => s.compareYear);
  const mode = useTide((s) => s.mode);
  const year = useThrottledYear();
  return (
    <section className="ft-panel p-3">
      <p className="text-xs tracking-wide text-muted uppercase">Fossil pathway</p>
      <div className="mt-2 grid gap-2">
        {PATHWAYS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => useTide.getState().setPathway(p.id)}
            className={`rounded-xl border px-3 py-2 text-left ${pathway === p.id ? "border-teal bg-teal/15" : "border-line bg-surface-2/40"}`}
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-medium text-fg">{p.label}</span>
              <span className="text-xs text-muted">{p.ssp}</span>
            </span>
            <span className="mt-0.5 block text-xs text-muted">{p.blurb}</span>
          </button>
        ))}
      </div>
      {mode === "compare" ? (
        <label className="mt-3 block text-xs text-muted">
          Right-hand future
          <select
            className="mt-1 min-h-11 w-full rounded-xl border border-line bg-bg px-3 text-sm text-fg"
            value={comparePathway}
            onChange={(e) => useTide.getState().setCompare(e.target.value as PathwayId)}
          >
            {PATHWAYS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            className="mt-2 w-full accent-teal"
            type="range"
            min={2025}
            max={2100}
            value={compareYear}
            onChange={(e) => useTide.getState().setCompare(comparePathway, Number(e.target.value))}
            aria-label="Comparison year"
          />
        </label>
      ) : (
        <p className="mt-3 text-xs text-muted">
          Clock set to <span className="text-fg">{year}</span>. Illustrated, not a FishCast forecast.
        </p>
      )}
    </section>
  );
}

function StationCard() {
  useSimPulse();
  const near = useTide((s) => s.nearStationId);
  const focus = nearestStation(sim.lat, sim.lon);
  return (
    <section className="ft-panel p-3">
      <p className="text-xs tracking-wide text-muted uppercase">Krill grounds</p>
      <p className="mt-1 text-sm text-fg">
        {near ? `${stationById(near).name} is under the hull.` : `${Math.round(focus.nm)} nm from ${focus.station.short}.`}
      </p>
      <ul className="mt-2 grid gap-1.5">
        {STATIONS.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => {
                useTide.getState().clearWaypoints();
                useTide.getState().addWaypoint({ lat: s.lat, lon: s.lon });
                useTide.getState().setView("helm");
                useTide.getState().setMode("voyage");
                useTide.getState().setHint(`Course laid for ${s.name}. The helm will follow it.`);
              }}
              className={`flex min-h-11 w-full items-center justify-between rounded-xl px-2 text-left text-sm ${near === s.id ? "bg-krill/20 text-fg" : "text-fg hover:bg-surface-2/70"}`}
            >
              <span>
                <span className="block font-medium">{s.short}</span>
                <span className="block text-xs text-muted">{s.area}</span>
              </span>
              <Anchor className="size-4 shrink-0 text-teal" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DiveLegend() {
  const id = useTide((s) => s.diveStationId ?? s.nearStationId);
  const station = stationById(id);
  return (
    <section className="ft-panel p-3 text-sm">
      <p className="text-xs tracking-wide text-muted uppercase">Under the ice</p>
      <p className="mt-1 font-medium text-fg">{station.name}</p>
      <p className="mt-1 text-muted">{station.note}</p>
      <p className="mt-2 text-xs text-muted">{station.mpa}</p>
      <p className="mt-3 text-xs text-muted">W swim · A port · D starboard · Space rise · C descend</p>
    </section>
  );
}

function Readings() {
  const pathway = useTide((s) => s.pathway);
  const year = useThrottledYear();
  const stationId = useTide((s) => s.diveStationId ?? s.nearStationId ?? "bransfield");
  const station = stationById(stationId);
  const m = metricsAt(pathway, year, station);
  const series = useMemo(() => krillSeries(station), [station]);
  const path = PATHWAYS.find((p) => p.id === pathway)!;
  return (
    <section className="ft-panel p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs tracking-wide text-muted uppercase">Station reading</p>
          <h2 className="font-display text-lg leading-tight text-fg">{station.short}</h2>
        </div>
        <p className="text-right text-xs text-muted">
          {path.label}
          <span className="block text-fg">{year}</span>
        </p>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <Stat k="Ocean heat" v={`+${fmt(m.sst)} °C`} />
        <Stat k="Ice days lost" v={`${Math.round(m.ice)}`} />
        <Stat k="Krill index" v={`${Math.round(m.krill)}`} />
        <Stat k="Salps / krill" v={fmt(m.salpRatio)} />
        <Stat k="Biodiversity" v={`${Math.round(m.biodiversity)}`} />
        <Stat k="Fishery exposure" v={`${Math.round(m.fisheryRisk)}`} />
      </dl>
      <div className="mt-3 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fill: "var(--color-muted)", fontSize: 10 }} interval={3} />
            <YAxis tick={{ fill: "var(--color-muted)", fontSize: 10 }} domain={[0, 110]} />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-line)",
                borderRadius: 12,
                color: "var(--color-fg)",
              }}
            />
            <Line type="monotone" dataKey="Reduce" stroke="var(--color-teal)" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="Maintain" stroke="var(--color-muted)" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="Increase" stroke="var(--color-krill)" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-xs text-muted">Krill habitat index, 100 = early-2020s sketch at this ground.</p>
      <button
        type="button"
        className="mt-3 min-h-11 w-full rounded-full bg-krill px-4 text-sm font-medium text-krill-ink"
        onClick={() => void askGrok()}
      >
        Ask Grok for a decision brief
      </button>
      <p className="mt-2 text-xs text-muted">Illustrated scenario. Not a validated forecast.</p>
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-bg/50 px-2 py-1.5">
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="font-medium text-fg">{v}</dd>
    </div>
  );
}

function useThrottledYear() {
  const [year, setYear] = useState(() => Math.round(useTide.getState().year));
  useEffect(() => {
    const id = window.setInterval(() => {
      const next = Math.round(useTide.getState().year);
      setYear((prev) => (prev === next ? prev : next));
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
      s.setBrief(JSON.parse(cached) as Brief, key);
      return;
    }
  } catch {
    /* ignore quota / private mode */
  }
  s.setBriefStatus("loading");
  try {
    const res = await requestBrief({
      data: {
        pathway: s.pathway,
        year,
        stationId: station.id,
        comparePathway: compare ? s.comparePathway : undefined,
        compareYear: compare ? Math.round(s.compareYear) : undefined,
      },
    });
    if (!res.ok) {
      useTide.getState().setBriefStatus("error", res.error);
      return;
    }
    try {
      localStorage.setItem(`ft-brief:${key}`, JSON.stringify(res.brief));
    } catch {
      /* ignore */
    }
    useTide.getState().setBrief(res.brief, key);
  } catch (err) {
    useTide.getState().setBriefStatus("error", err instanceof Error ? err.message : "The brief failed.");
  }
}

function ForcingDock() {
  const mode = useTide((s) => s.mode);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-2 p-3 md:justify-center">
      <TouchHelm show={mode !== "compare"} diving={mode === "dive"} />
      <div className="pointer-events-auto">
        <ForcingDial />
      </div>
      <MobileTools />
    </div>
  );
}

function ForcingDial() {
  const [year, setYear] = useState(useTide.getState().year);
  const playing = useTide((s) => s.playing);
  const pathway = useTide((s) => s.pathway);
  const stationId = useTide((s) => s.diveStationId ?? s.nearStationId);
  const station = stationById(stationId);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const y = useTide.getState().year;
      setYear((prev) => (Math.abs(prev - y) < 0.05 ? prev : y));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const m = metricsAt(pathway, year, station);
  const t = (year - 2025) / 75;
  const sky = mix([120, 186, 198], [18, 16, 20], m.stress);
  const glow = mix([255, 214, 170], [90, 42, 24], m.stress);
  const ang = Math.PI * 0.72 + (Math.PI * 2.28 - Math.PI * 0.72) * t;
  const nx = 80 + Math.cos(ang) * 58;
  const ny = 86 + Math.sin(ang) * 58;

  const setFromPointer = (clientX: number, rect: DOMRect) => {
    const next = 2025 + ((clientX - rect.left) / rect.width) * 75;
    useTide.getState().setYear(next);
    useTide.getState().setPlaying(false);
  };

  return (
    <div className="w-40 md:w-52">
      <svg
        viewBox="0 0 160 160"
        className="w-full"
        role="slider"
        aria-valuemin={2025}
        aria-valuemax={2100}
        aria-valuenow={Math.round(year)}
        aria-label="Forcing clock"
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          e.currentTarget.setPointerCapture(e.pointerId);
          setFromPointer(e.clientX, rect);
        }}
        onPointerMove={(e) => {
          if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
          setFromPointer(e.clientX, e.currentTarget.getBoundingClientRect());
        }}
      >
        <circle cx="80" cy="86" r="70" fill={sky} />
        <circle cx={80 + (1 - m.stress) * 10} cy={48 + m.stress * 28} r={10 - m.stress * 4} fill={glow} />
        {Array.from({ length: 5 }, (_, i) => (
          <rect
            key={i}
            x={28 + i * 22}
            y={108 - m.stress * (10 + (i % 3) * 8)}
            width="10"
            height={12 + m.stress * (16 + (i % 3) * 10)}
            rx="1"
            fill={`rgb(${20 + i * 4} ${16 + i * 2} ${14})`}
            opacity={0.35 + m.stress * 0.65}
          />
        ))}
        <path d="M 28 118 A 58 58 0 1 1 132 118" fill="none" stroke="var(--color-line)" strokeWidth="6" strokeLinecap="round" />
        <line x1="80" y1="86" x2={nx} y2={ny} stroke="var(--color-fg)" strokeWidth="2" />
        <circle cx={nx} cy={ny} r="4" fill="var(--color-krill)" />
        <text x="80" y="82" textAnchor="middle" fill="var(--color-fg)" fontFamily="Fraunces, serif" fontSize="22">
          {Math.round(year)}
        </text>
        <text x="80" y="98" textAnchor="middle" fill="var(--color-muted)" fontSize="8">
          forcing clock
        </text>
      </svg>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full bg-teal text-teal-ink"
          aria-label={playing ? "Pause the clock" : "Play the clock"}
          onClick={() => {
            const s = useTide.getState();
            if (!s.playing && s.year >= 2100) s.setYear(2025);
            s.setPlaying(!s.playing);
          }}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <span className="text-xs text-muted">Sky darkens as forcing rises</span>
      </div>
    </div>
  );
}

function mix(a: number[], b: number[], t: number) {
  const u = Math.min(1, Math.max(0, t));
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * u));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

function TouchHelm({ show, diving }: { show: boolean; diving: boolean }) {
  if (!show) return <div className="hidden w-28 md:block md:w-0" />;
  return (
    <div className="pointer-events-auto grid grid-cols-3 gap-1 md:hidden">
      <span />
      <HelmKey code="KeyW" label={diving ? "Swim" : "Ahead"} />
      {diving ? <HelmKey code="KeyQ" label="Rise" /> : <span />}
      <HelmKey code="KeyA" label="Port" />
      <HelmKey code="KeyS" label="Back" />
      <HelmKey code="KeyD" label="Stbd" />
      {diving ? <span /> : null}
      {diving ? <HelmKey code="KeyE" label="Sink" /> : null}
    </div>
  );
}

function HelmKey({ code, label }: { code: string; label: string }) {
  return (
    <button type="button" className="h-12 min-w-12 rounded-xl border border-line bg-surface/90 text-xs text-fg" {...holdProps(code)}>
      {label}
    </button>
  );
}

function MobileTools() {
  return (
    <div className="pointer-events-auto flex flex-col gap-1 lg:hidden">
      <ToolButton sheet="pathways" label="Paths" />
      <ToolButton sheet="chart" label="Chart" />
      <ToolButton sheet="stats" label="Data" />
      <ToolButton sheet="brief" label="Brief" />
    </div>
  );
}

function ToolButton({ sheet, label }: { sheet: Sheet; label: string }) {
  const open = useTide((s) => s.sheet === sheet);
  return (
    <button
      type="button"
      className={`min-h-11 rounded-full px-3 text-xs font-medium ${open ? "bg-teal text-teal-ink" : "border border-line bg-surface text-fg"}`}
      onClick={() => useTide.getState().setSheet(open ? "none" : sheet)}
    >
      {label}
    </button>
  );
}

function HintLine() {
  const hint = useTide((s) => s.hint);
  const near = useTide((s) => s.nearStationId);
  const mode = useTide((s) => s.mode);
  if (mode !== "voyage") return null;
  const text = near && mode === "voyage" ? `${stationById(near).name} — diver is on the rail.` : hint;
  if (!text) return null;
  return (
    <div className="pointer-events-none absolute top-20 right-3 left-3 flex justify-center lg:top-auto lg:bottom-64">
      <p className="pointer-events-auto max-w-md rounded-full border border-line bg-surface/90 px-4 py-2 text-center text-sm text-fg">
        {text}
        {near && mode === "voyage" ? (
          <button
            type="button"
            className="ml-2 font-medium text-krill"
            onClick={() => {
              useTide.getState().setDiveStation(near);
              useTide.getState().setMode("dive");
            }}
          >
            Send the diver
          </button>
        ) : null}
      </p>
    </div>
  );
}

function SheetHost() {
  const sheet = useTide((s) => s.sheet);
  if (sheet === "none") return null;
  const title =
    sheet === "chart"
      ? "Course chart"
      : sheet === "stats"
        ? "Readings"
        : sheet === "brief"
          ? "Decision brief"
          : sheet === "about"
            ? "What this is"
            : "Pathways";
  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 max-h-[78dvh] overflow-y-auto rounded-t-3xl border border-line bg-surface p-4 ft-scroll lg:inset-x-auto lg:right-4 lg:bottom-4 lg:w-96 lg:rounded-3xl">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-display text-lg text-fg">{title}</p>
        <button type="button" className="grid size-11 place-items-center" aria-label="Close" onClick={() => useTide.getState().setSheet("none")}>
          <X className="size-5" />
        </button>
      </div>
      {sheet === "pathways" ? <PathwayCard /> : null}
      {sheet === "chart" ? <ChartPanel /> : null}
      {sheet === "stats" ? <Readings /> : null}
      {sheet === "brief" ? <BriefPanel /> : null}
      {sheet === "about" ? <AboutCopy /> : null}
    </div>
  );
}

function ChartPanel() {
  useSimPulse(120);
  const wps = useTide((s) => s.waypoints);
  const ship = projectChart(sim.lat, sim.lon);
  return (
    <div>
      <svg
        viewBox="0 0 200 200"
        className="mx-auto w-full max-w-sm touch-none"
        onPointerDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 200;
          const y = ((e.clientY - rect.top) / rect.height) * 200;
          const ll = unprojectChart(x, y);
          if (!ll) return;
          useTide.getState().addWaypoint(ll);
          useTide.getState().setView("helm");
        }}
      >
        <circle cx="100" cy="100" r="92" fill="var(--color-bg)" stroke="var(--color-line)" />
        <circle cx="100" cy="100" r="22" fill="var(--color-fg)" opacity="0.85" />
        <circle cx="100" cy="100" r="48" fill="none" stroke="var(--color-line)" />
        <circle cx="100" cy="100" r="74" fill="none" stroke="var(--color-line)" />
        {STATIONS.map((s) => {
          const p = projectChart(s.lat, s.lon);
          return <circle key={s.id} cx={p.x} cy={p.y} r="3.2" fill="var(--color-teal)" />;
        })}
        {wps.map((w, i) => {
          const p = projectChart(w.lat, w.lon);
          return <circle key={i} cx={p.x} cy={p.y} r="2.4" fill="var(--color-krill)" />;
        })}
        <polygon
          points={`${ship.x},${ship.y - 5} ${ship.x - 3.5},${ship.y + 4} ${ship.x + 3.5},${ship.y + 4}`}
          fill="var(--color-krill)"
        />
      </svg>
      <p className="mt-2 text-sm text-muted">
        Tap the ring of ocean to drop course marks. The pale disc is Antarctica. Teal dots are krill grounds.
      </p>
      <button
        type="button"
        className="mt-2 min-h-11 rounded-full border border-line px-4 text-sm text-fg"
        onClick={() => useTide.getState().clearWaypoints()}
      >
        Clear course
      </button>
    </div>
  );
}

function BriefPanel() {
  const status = useTide((s) => s.briefStatus);
  const brief = useTide((s) => s.brief);
  const error = useTide((s) => s.briefError);
  return (
    <div className="text-sm">
      {status === "idle" ? (
        <p className="text-muted">Ask Grok to turn this station’s illustrated numbers into a short brief for a non-technical reader.</p>
      ) : null}
      {status === "loading" ? <p className="text-fg">Grok is reading the station packet…</p> : null}
      {status === "error" ? <p className="text-krill">{error}</p> : null}
      {status === "ready" && brief ? (
        <article>
          <h3 className="font-display text-xl text-fg">{brief.headline}</h3>
          <p className="mt-2 text-fg">{brief.narrative}</p>
          <ul className="mt-3 grid gap-2">
            {brief.consequences.map((c) => (
              <li key={c} className="rounded-xl bg-bg/60 px-3 py-2 text-fg">
                {c}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-muted">{brief.uncertainty}</p>
          <h4 className="mt-3 font-medium text-fg">Questions worth asking</h4>
          <ol className="mt-1 grid list-decimal gap-1 pl-4 text-fg">
            {brief.decisions.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ol>
        </article>
      ) : null}
      <button type="button" className="mt-3 min-h-11 rounded-full bg-krill px-4 font-medium text-krill-ink" onClick={() => void askGrok()}>
        {status === "loading" ? "Writing…" : "Ask Grok"}
      </button>
    </div>
  );
}

function AboutCopy() {
  return (
    <div className="grid gap-3 text-sm text-fg">
      <p>
        FutureTide sails the Southern Ocean the way FishCast studies it: Antarctic krill, <em>Euphausia superba</em>, and the marine protected areas managed by CCAMLR.
      </p>
      <p>{FISHCAST_NOTE}</p>
      <p>
        The three pathways borrow the shape of IPCC shared socioeconomic pathways. Sea-ice days, krill index, and heat are workshop illustrations so a non-technical reader can see a direction of travel. They are not CMIP6 grid cells and not FishCast predictions. Antarctic benthic gardens here stand in for ice-linked habitat. Tropical coral reefs are a different ocean; the same fossil pathways are what bleach them.
      </p>
      <p className="text-muted">
        Historical context only: CCAMLR’s Area 48 krill trigger was long discussed at 620,000 tonnes a year. The Ross Sea region MPA covers about 1.55 million km². Management rules change. This tool does not predict catches.
      </p>
    </div>
  );
}

function StartCard() {
  const pathway = useTide((s) => s.pathway);
  return (
    <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-3 md:items-center">
      <section className="pointer-events-auto ft-panel flex max-h-[82dvh] w-full max-w-xl flex-col p-4 md:p-6">
        <div className="overflow-y-auto ft-scroll">
          <p className="text-xs tracking-wide text-teal uppercase">Southern Ocean · three futures</p>
          <h1 className="mt-1 font-display text-3xl leading-none text-fg md:text-5xl">Take the helm before the ice does.</h1>
          <p className="mt-3 text-sm text-muted">
            Plot a course across CCAMLR waters. When the ship reaches a krill ground, send a diver under the ice and turn the forcing clock.
          </p>
          <div className="mt-3 grid gap-2">
            {PATHWAYS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => useTide.getState().setPathway(p.id)}
                className={`rounded-2xl border px-3 py-2 text-left ${pathway === p.id ? "border-teal bg-teal/15" : "border-line"}`}
              >
                <span className="font-medium text-fg">{p.label}</span>
                <span className="mt-0.5 block text-sm text-muted">{p.blurb}</span>
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="mt-3 min-h-12 w-full shrink-0 rounded-full bg-teal px-4 py-3 text-base font-semibold text-teal-ink"
          onClick={() => {
            setSimLive(true);
            useTide.getState().start();
            useTide.getState().setHint("Hold W to sail. A turns to port. Shift is flank speed.");
          }}
        >
          Start the voyage
        </button>
        <p className="mt-2 flex items-start gap-2 text-xs text-muted">
          <Fish className="mt-0.5 size-4 shrink-0 text-krill" />
          Illustrated scenarios for a workshop. Not a validated forecast.
        </p>
      </section>
    </div>
  );
}

export function CompareLabels() {
  const pathway = useTide((s) => s.pathway);
  const compare = useTide((s) => s.comparePathway);
  const year = useThrottledYear();
  const compareYear = useTide((s) => s.compareYear);
  const left = PATHWAYS.find((p) => p.id === pathway)!;
  const right = PATHWAYS.find((p) => p.id === compare)!;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-30 grid grid-cols-2 gap-2 px-3">
      <p className="justify-self-start rounded-full bg-surface/90 px-3 py-1 text-xs text-fg">
        {left.label} · {year}
      </p>
      <p className="justify-self-end rounded-full bg-surface/90 px-3 py-1 text-xs text-fg">
        {right.label} · {Math.round(compareYear)}
      </p>
    </div>
  );
}
