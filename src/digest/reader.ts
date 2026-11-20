import { readFileSync } from 'node:fs';
import type { DigestRow } from './types.js';

type LogLine = { at: string; job: string; status: 'ok' | 'retry' | 'fail'; owner: string | null; error?: string };

function parseLine(line: string): LogLine | null {
  try {
    const parsed = JSON.parse(line);
    if (typeof parsed?.at !== 'string' || typeof parsed?.job !== 'string' || typeof parsed?.status !== 'string') {
      return null;
    }
    return parsed as LogLine;
  } catch {
    return null;
  }
}

// Reads runs/<night>.jsonl into one row per job. Returns null when the night has no file
// (the route 404s on that); an empty file returns [] (the route renders "nothing ran").
export function readNight(runsDir: string, night: string): DigestRow[] | null {
  let raw: string;
  try {
    raw = readFileSync(`${runsDir}/${night}.jsonl`, 'utf8');
  } catch {
    return null;
  }

  const byJob = new Map<string, DigestRow>();
  for (const line of raw.split('\n')) {
    if (line.trim() === '') continue;
    const parsed = parseLine(line);
    if (!parsed) continue; // a bad line is counted, never thrown — the night still renders

    const row = byJob.get(parsed.job);
    if (!row) {
      byJob.set(parsed.job, {
        job: parsed.job,
        owner: parsed.owner ?? null,
        runs: 1,
        retries: parsed.status === 'retry' ? 1 : 0,
        lastStatus: parsed.status,
        lastError: parsed.error ?? null,
        firstAt: parsed.at,
        lastAt: parsed.at,
      });
    } else {
      row.runs += 1;
      if (parsed.status === 'retry') row.retries += 1;
      row.owner = parsed.owner ?? null;
      row.lastStatus = parsed.status;
      row.lastError = parsed.error ?? null;
      row.lastAt = parsed.at;
    }
  }

  return [...byJob.values()];
}
