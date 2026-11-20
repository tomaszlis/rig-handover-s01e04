import type { DigestRow } from '../digest/types.js';

export function DigestPage({ night, rows }: { night: string; rows: DigestRow[] | null }) {
  if (rows === null) {
    return <p class="warn">no run log for {night}</p>;
  }

  if (rows.length === 0) {
    return <p class="mute">nothing ran</p>;
  }

  const sorted = [...rows].sort((a, b) => a.job.localeCompare(b.job));

  return (
    <>
      <h1>digest · {night}</h1>
      <table>
        <thead>
          <tr>
            <th>job</th>
            <th>owner</th>
            <th>runs</th>
            <th>retries</th>
            <th>last status</th>
            <th>last error</th>
            <th>first</th>
            <th>last</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const flagged = row.lastStatus === 'fail' || row.retries >= 3;
            return (
              <tr class={flagged ? 'warn' : ''}>
                <td>{row.job}</td>
                <td>{row.owner ?? '—'}</td>
                <td>{row.runs}</td>
                <td>{row.retries}</td>
                <td>{row.lastStatus}</td>
                <td>{row.lastError ?? '—'}</td>
                <td>{row.firstAt}</td>
                <td>{row.lastAt}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
