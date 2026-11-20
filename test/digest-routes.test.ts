import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

let runsDir: string;
const config = () => ({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir });

beforeEach(() => {
  runsDir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  writeFileSync(
    join(runsDir, '2026-10-28.jsonl'),
    [
      '{"at":"2026-10-28T23:00:02+01:00","job":"lane/sync","status":"ok","owner":"rook"}',
      'not json',
      '{"at":"2026-10-28T23:05:00+01:00","job":"lane/sync","status":"ok","owner":"rook"}',
      '',
    ].join('\n'),
  );
  writeFileSync(join(runsDir, '2026-10-29.jsonl'), '');
});

afterEach(() => {
  rmSync(runsDir, { recursive: true, force: true });
});

describe('GET /digest/:night', () => {
  it('renders 200 for a night with a bad line, counted not thrown', async () => {
    const res = await createApp(config()).request('/digest/2026-10-28');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('lane/sync');
  });

  it('renders "nothing ran" for an empty night', async () => {
    const res = await createApp(config()).request('/digest/2026-10-29');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('404s for a night with no file', async () => {
    const res = await createApp(config()).request('/digest/2099-01-01');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/digest/:night', () => {
  it('returns the same jobs as the page, as JSON', async () => {
    const res = await createApp(config()).request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    const rows = await res.json();
    expect(rows).toEqual([expect.objectContaining({ job: 'lane/sync', runs: 2 })]);
  });

  it('returns [] for an empty night', async () => {
    const res = await createApp(config()).request('/api/digest/2026-10-29');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('404s for a night with no file', async () => {
    const res = await createApp(config()).request('/api/digest/2099-01-01');
    expect(res.status).toBe(404);
  });
});
