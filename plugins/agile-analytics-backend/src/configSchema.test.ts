import { readFileSync } from 'fs';
import { resolve } from 'path';

// The API key reads all data of the organisation; neither it nor the orgHash
// may ever be marked for the frontend, as plugin versions up to 0.2 did.
const schema = (pkg: string) =>
  readFileSync(resolve(__dirname, '../..', pkg, 'config.d.ts'), 'utf8');

/** The doc comment right above a property of the schema. */
function docOf(source: string, property: string): string {
  const match = source.match(
    new RegExp(`/\\*\\*((?:(?!\\*/)[\\s\\S])*)\\*/\\s*${property}\\??:`),
  );
  return match?.[1] ?? '';
}

describe('config schema', () => {
  it('keeps the API key secret and the orgHash on the backend', () => {
    const backend = schema('agile-analytics-backend');
    expect(docOf(backend, 'apiKey')).toContain('@visibility secret');
    expect(docOf(backend, 'orgHash')).not.toContain('@visibility');
  });

  it('only gives the frontend the app URL', () => {
    const frontend = schema('agile-analytics');
    expect(frontend).not.toMatch(/apiKey|orgHash/);
    expect(docOf(frontend, 'appUrl')).toContain('@visibility frontend');
  });
});
