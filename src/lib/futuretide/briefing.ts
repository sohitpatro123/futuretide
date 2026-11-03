import { createServerFn } from "@tanstack/react-start";
import {
  FISHCAST_NOTE,
  PATHWAYS,
  metricsAt,
  stationById,
  type Brief,
  type PathwayId,
} from "@/lib/futuretide/model";

export type BriefInput = {
  pathway: PathwayId;
  year: number;
  stationId: string;
  comparePathway?: PathwayId;
  compareYear?: number;
};

const cache = new Map<string, Brief>();

function isPathway(v: unknown): v is PathwayId {
  return v === "reduce" || v === "maintain" || v === "increase";
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export const requestBrief = createServerFn({ method: "POST" })
  .validator((input: BriefInput) => {
    if (!input || !isPathway(input.pathway)) {
      throw new Error("Choose a fossil pathway first.");
    }
    const year = Number(input.year);
    if (!Number.isFinite(year) || year < 2025 || year > 2100) {
      throw new Error("Year must sit between 2025 and 2100.");
    }
    const stationId = stationById(input.stationId).id;
    const comparePathway = isPathway(input.comparePathway) ? input.comparePathway : undefined;
    const compareYear = comparePathway
      ? Math.min(2100, Math.max(2025, Number(input.compareYear) || year))
      : undefined;
    return {
      pathway: input.pathway,
      year: Math.round(year),
      stationId,
      comparePathway,
      compareYear: compareYear === undefined ? undefined : Math.round(compareYear),
    };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "Grok is not available in this environment." };
    }

    const station = stationById(data.stationId);
    const metrics = metricsAt(data.pathway, data.year, station);
    const path = PATHWAYS.find((p) => p.id === data.pathway)!;
    const key = JSON.stringify(data);
    const hit = cache.get(key);
    if (hit) return { ok: true as const, brief: hit };

    let compareBlock = "";
    if (data.comparePathway && data.compareYear) {
      const other = metricsAt(data.comparePathway, data.compareYear, station);
      const otherPath = PATHWAYS.find((p) => p.id === data.comparePathway)!;
      compareBlock = `Also contrast with the ${otherPath.label} pathway (${otherPath.ssp}) in ${data.compareYear}: SST anomaly ${round1(other.sst)}°C, sea-ice days lost ${Math.round(other.ice)}, krill index ${Math.round(other.krill)}, biodiversity ${Math.round(other.biodiversity)}, stress ${round1(other.stress * 100)}%.`;
    }

    const prompt = `You are the expedition briefer inside FutureTide, a Georgia Tech BDBI workshop tool about Antarctic krill.

Write for a policymaker or campaigner who is not a modeler. Short sentences. No hype. No emoji.

HARD RULES
- The numbers below are ILLUSTRATIVE scenario sketches for a workshop. They are NOT output from the FishCast Gaussian-process model and NOT a validated forecast. Say that plainly once.
- Do not invent catch tonnages, percentages, or degrees that are not in the packet.
- This station is in the Southern Ocean. Do not describe tropical coral reefs at this location. You may add one sentence on how the same fossil pathway relates to tropical coral bleaching elsewhere.
- ${FISHCAST_NOTE}

PACKET
Station: ${station.name} (${station.area}). ${station.note} Protection: ${station.mpa}
Pathway: ${path.label} — ${path.blurb} (${path.ssp})
Year: ${data.year}
Illustrated readings at this station:
- Sea-surface temperature anomaly vs late 20th century: ${round1(metrics.sst)} °C
- Sea-ice season shortened by about ${Math.round(metrics.ice)} days
- Krill habitat index: ${Math.round(metrics.krill)} where 100 is the 2020s sketch
- Chlorophyll index: ${Math.round(metrics.chl)}
- Biodiversity integrity: ${Math.round(metrics.biodiversity)} / 100
- Salps relative to krill: ${round1(metrics.salpRatio)} (higher means more salps)
- Fishery exposure index: ${Math.round(metrics.fisheryRisk)} / 100
- How much the protected-area story still shelters core habitat: ${Math.round(metrics.mpaBuffer)} / 100
${compareBlock}

Return ONLY JSON with this shape:
{
  "headline": "one line",
  "narrative": "two or three sentences a non-expert can repeat",
  "consequences": ["three concrete consequences for krill, predators, or the fishery"],
  "uncertainty": "one or two sentences on what FishCast and this sketch cannot yet say",
  "decisions": ["three practical questions a CCAMLR delegate or coastal advocate could ask"]
}`;

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.4,
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content:
              "You reply with one JSON object only. No markdown fences. You never pretend an illustrative scenario is a scientific forecast.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      return { ok: false as const, error: `Grok could not write the brief (status ${res.status}).` };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content ?? "";
    const brief = parseBrief(text);
    if (!brief) {
      return { ok: false as const, error: "Grok answered in an unexpected shape. Try the brief again." };
    }
    cache.set(key, brief);
    return { ok: true as const, brief };
  });

function parseBrief(text: string): Brief | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const raw = JSON.parse(text.slice(start, end + 1)) as Partial<Brief>;
    if (!raw.headline || !raw.narrative || !raw.uncertainty) return null;
    const consequences = Array.isArray(raw.consequences) ? raw.consequences.map(String).slice(0, 4) : [];
    const decisions = Array.isArray(raw.decisions) ? raw.decisions.map(String).slice(0, 4) : [];
    if (consequences.length < 1 || decisions.length < 1) return null;
    return {
      headline: String(raw.headline).slice(0, 180),
      narrative: String(raw.narrative).slice(0, 900),
      consequences,
      uncertainty: String(raw.uncertainty).slice(0, 500),
      decisions,
    };
  } catch {
    return null;
  }
}
