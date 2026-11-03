# FutureTide

Interactive Southern Ocean expedition for the Georgia Tech BDBI Grokathon. Sail CCAMLR waters, dive with Antarctic krill, and compare three fossil-fuel pathways in 2035, 2050, and 2100.

Numbers and briefings are **illustrative scenarios** inspired by [FishCast](https://github.com/gt-big-data/fish-cast). They are not validated model forecasts.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

- Choose **Reduce**, **Maintain**, or **Increase**, then start the voyage.
- Steer the ship with **W A S D** (or the on-screen helm). Click the chart to drop waypoints.
- Dive at a station to see krill, salps, ice, and habitat change with the forcing clock.
- **Ask Grok** writes a decision brief when `XAI_API_KEY` is set on the server. Without it, the app still runs and shows the on-screen metrics.

```bash
npm run build
npm run typecheck
```
