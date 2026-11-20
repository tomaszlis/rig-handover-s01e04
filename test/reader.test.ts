import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/reader.js';

describe('readNight', () => {
  it('reads 2026-10-28 into one row per job, counting the bad line without throwing', () => {
    const rows = readNight('runs', '2026-10-28');
    expect(rows).not.toBeNull();
    expect(rows!.map((r) => r.job).sort()).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);

    const fixtures = rows!.find((r) => r.job === 'fixtures/refresh')!;
    expect(fixtures.retries).toBe(3);
    expect(fixtures.lastStatus).toBe('ok');

    const digestRender = rows!.find((r) => r.job === 'digest/render')!;
    expect(digestRender.owner).toBeNull();
  });

  it('returns null for a night with no file', () => {
    expect(readNight('runs', '2099-01-01')).toBeNull();
  });

  it('returns an empty array for an empty night file', () => {
    const rows = readNight('test/fixtures-empty', '2026-10-30');
    expect(rows).toEqual([]);
  });
});
