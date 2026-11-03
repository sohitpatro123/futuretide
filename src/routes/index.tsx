import { Suspense, lazy, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

const FutureTide = lazy(() =>
  import("@/components/futuretide/FutureTide").then((m) => ({ default: m.FutureTide })),
);

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return <StaticSplash />;
  return (
    <Suspense fallback={<StaticSplash />}>
      <FutureTide />
    </Suspense>
  );
}

function StaticSplash() {
  return (
    <main className="ft-splash flex min-h-screen items-end justify-center p-4 md:items-center">
      <section className="ft-panel w-full max-w-xl p-6">
        <p className="text-xs tracking-wide text-teal uppercase">Southern Ocean · three futures</p>
        <h1 className="mt-1 font-display text-4xl leading-none text-fg">FutureTide</h1>
        <p className="mt-3 text-sm text-muted">
          An illustrated FishCast expedition. Sail CCAMLR waters, dive with Antarctic krill, and turn the forcing clock.
        </p>
      </section>
    </main>
  );
}
