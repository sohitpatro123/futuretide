import { useEffect } from "react";
import { DiveCanvas } from "@/components/futuretide/DiveScene";
import { GlobeCanvas } from "@/components/futuretide/GlobeScene";
import { CompareLabels, Hud } from "@/components/futuretide/Hud";
import { bindInput } from "@/lib/futuretide/input";
import { useTide } from "@/lib/futuretide/store";

export function FutureTide() {
  const mode = useTide((s) => s.mode);
  const started = useTide((s) => s.started);
  const stationId = useTide((s) => s.diveStationId ?? s.nearStationId ?? "bransfield");

  useEffect(() => bindInput(), []);
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as unknown as { __tide?: typeof useTide }).__tide = useTide;
    }
  }, []);

  return (
    <main className="fixed inset-0 overflow-hidden bg-bg text-fg">
      <div className="absolute inset-0">
        {started && mode === "compare" ? (
          <div className="grid h-full grid-rows-2 md:grid-cols-2 md:grid-rows-1">
            <DiveCanvas source="main" interactive={false} stationId={stationId} />
            <DiveCanvas source="compare" interactive={false} stationId={stationId} />
          </div>
        ) : started && mode === "dive" ? (
          <DiveCanvas source="main" interactive stationId={stationId} />
        ) : (
          <GlobeCanvas />
        )}
      </div>
      {started && mode === "compare" ? <CompareLabels /> : null}
      <Hud />
    </main>
  );
}
