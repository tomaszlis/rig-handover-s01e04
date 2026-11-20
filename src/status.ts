import { readdirSync } from 'node:fs';
import type { RigConfig } from './config.js';
import { readNight } from './digest/reader.js';
import { lastBeat, type Beat } from './heartbeat.js';

export type NightSummary = { night: string; ok: number; retry: number; fail: number };

export type Status = {
  adapter: string;
  installed: string;
  lastBeat: Beat | null;
  nights: string[];
  digests: NightSummary[];
};

// Nights on disk = runs/<YYYY-MM-DD>.jsonl, newest first.
export function nightsOnDisk(runsDir: string): string[] {
  try {
    return readdirSync(runsDir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f))
      .map((f) => f.slice(0, 10))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

// Counts jobs by their last status for the night's digest link (ADR for the digest page's
// own per-run grouping lives in src/digest/reader.ts; this tallies its rows).
function summarizeNight(runsDir: string, night: string): NightSummary {
  const rows = readNight(runsDir, night) ?? [];
  const summary: NightSummary = { night, ok: 0, retry: 0, fail: 0 };
  for (const row of rows) summary[row.lastStatus] += 1;
  return summary;
}

export function readStatus(config: RigConfig): Status {
  const nights = nightsOnDisk(config.runsDir);
  return {
    adapter: config.adapter,
    installed: config.installed,
    lastBeat: lastBeat(),
    nights,
    digests: nights.map((night) => summarizeNight(config.runsDir, night)),
  };
}
