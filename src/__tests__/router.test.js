import { describe, it, expect } from 'vitest';
import { parseRoute, buildPath } from '../router.js';

describe('parseRoute', () => {
  it('/ returns dashboard', () => {
    expect(parseRoute('/')).toEqual({ route: 'dashboard' });
  });

  it('/dashboard returns dashboard', () => {
    expect(parseRoute('/dashboard')).toEqual({ route: 'dashboard' });
  });

  it('/explore returns explore', () => {
    expect(parseRoute('/explore')).toEqual({ route: 'explore' });
  });

  it('/trend/:id returns trendDetail with trendId', () => {
    expect(parseRoute('/trend/abc123')).toEqual({ route: 'trendDetail', trendId: 'abc123' });
  });

  it('/trend without id falls back to explore', () => {
    expect(parseRoute('/trend')).toEqual({ route: 'explore' });
  });

  it('/process/:stage returns process with stage', () => {
    expect(parseRoute('/process/scout')).toEqual({ route: 'process', processStage: 'scout' });
    expect(parseRoute('/process/rate')).toEqual({ route: 'process', processStage: 'rate' });
  });

  it('/process/validate redirects to rate', () => {
    expect(parseRoute('/process/validate')).toEqual({ route: 'process', processStage: 'rate' });
  });

  it('/process without stage defaults to scout', () => {
    expect(parseRoute('/process')).toEqual({ route: 'process', processStage: 'scout' });
  });

  it('/signals returns signals', () => {
    expect(parseRoute('/signals')).toEqual({ route: 'signals' });
  });

  it('/campaign/:id returns campaignWorkspace with campaignId', () => {
    expect(parseRoute('/campaign/camp1')).toEqual({ route: 'campaignWorkspace', campaignId: 'camp1' });
  });

  it('/campaign without id falls back to process scout', () => {
    expect(parseRoute('/campaign')).toEqual({ route: 'process', processStage: 'scout' });
  });

  it('/initiatives returns initiatives', () => {
    expect(parseRoute('/initiatives')).toEqual({ route: 'initiatives' });
  });

  it('/initiative/:id returns initiativeDetail with initiativeId', () => {
    expect(parseRoute('/initiative/init7')).toEqual({ route: 'initiativeDetail', initiativeId: 'init7' });
  });

  it('/initiative without id falls back to initiatives list', () => {
    expect(parseRoute('/initiative')).toEqual({ route: 'initiatives' });
  });

  it('/analytics returns analytics', () => {
    expect(parseRoute('/analytics')).toEqual({ route: 'analytics' });
  });

  it('/library returns library', () => {
    expect(parseRoute('/library')).toEqual({ route: 'library' });
  });

  it('unknown route falls back to dashboard', () => {
    expect(parseRoute('/nonexistent')).toEqual({ route: 'dashboard' });
    expect(parseRoute('/foo/bar/baz')).toEqual({ route: 'dashboard' });
  });
});

describe('buildPath', () => {
  it('dashboard -> /', () => {
    expect(buildPath({ route: 'dashboard' })).toBe('/');
  });

  it('explore -> /explore', () => {
    expect(buildPath({ route: 'explore' })).toBe('/explore');
  });

  it('trendDetail -> /trend/:id', () => {
    expect(buildPath({ route: 'trendDetail', trendId: '44' })).toBe('/trend/44');
  });

  it('process with stage -> /process/:stage', () => {
    expect(buildPath({ route: 'process', processStage: 'rate' })).toBe('/process/rate');
  });

  it('process without stage defaults to scout', () => {
    expect(buildPath({ route: 'process' })).toBe('/process/scout');
  });

  it('campaignWorkspace -> /campaign/:id', () => {
    expect(buildPath({ route: 'campaignWorkspace', campaignId: 'c1' })).toBe('/campaign/c1');
  });

  it('initiatives -> /initiatives', () => {
    expect(buildPath({ route: 'initiatives' })).toBe('/initiatives');
  });

  it('initiativeDetail -> /initiative/:id', () => {
    expect(buildPath({ route: 'initiativeDetail', initiativeId: 'i5' })).toBe('/initiative/i5');
  });

  it('analytics -> /analytics', () => {
    expect(buildPath({ route: 'analytics' })).toBe('/analytics');
  });

  it('library -> /library', () => {
    expect(buildPath({ route: 'library' })).toBe('/library');
  });

  it('signals -> /signals', () => {
    expect(buildPath({ route: 'signals' })).toBe('/signals');
  });

  it('unknown route defaults to /', () => {
    expect(buildPath({ route: 'nonexistent' })).toBe('/');
  });

  it('parseRoute and buildPath are inverses for round-trip routes', () => {
    const paths = ['/explore', '/signals', '/initiatives', '/analytics', '/library'];
    for (const path of paths) {
      const parsed = parseRoute(path);
      expect(buildPath(parsed)).toBe(path);
    }
  });
});
