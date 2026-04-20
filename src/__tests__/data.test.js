import { describe, it, expect } from 'vitest';
import { CIN_DATA } from '../data.js';

describe('CIN_DATA structure', () => {
  it('has all required top-level properties', () => {
    expect(CIN_DATA).toHaveProperty('dimensions');
    expect(CIN_DATA).toHaveProperty('horizons');
    expect(CIN_DATA).toHaveProperty('stages');
    expect(CIN_DATA).toHaveProperty('trends');
    expect(CIN_DATA).toHaveProperty('signals');
    expect(CIN_DATA).toHaveProperty('aiInbox');
    expect(CIN_DATA).toHaveProperty('funnelStages');
    expect(CIN_DATA).toHaveProperty('owners');
  });

  it('does NOT have a projects property (removed in cleanup)', () => {
    expect(CIN_DATA).not.toHaveProperty('projects');
  });
});

describe('dimensions', () => {
  it('contains the 6 STEEP+V dimensions', () => {
    expect(CIN_DATA.dimensions).toEqual([
      'Technology', 'Society', 'Economy', 'Ecology', 'Politics', 'Values',
    ]);
  });
});

describe('horizons', () => {
  it('has 3 time horizons', () => {
    expect(CIN_DATA.horizons).toHaveLength(3);
    expect(CIN_DATA.horizons[0]).toMatch(/H1/);
    expect(CIN_DATA.horizons[2]).toMatch(/H3/);
  });
});

describe('stages', () => {
  it('covers the full lifecycle from Signal to Fading', () => {
    expect(CIN_DATA.stages).toEqual(['Signal', 'Emerging', 'Trend', 'Mainstream', 'Fading']);
  });
});

describe('trends', () => {
  it('has at least 10 trends', () => {
    expect(CIN_DATA.trends.length).toBeGreaterThanOrEqual(10);
  });

  it('each trend has all required fields', () => {
    const requiredFields = ['id', 'title', 'dim', 'horizon', 'stage', 'impact', 'novelty', 'maturity'];
    for (const trend of CIN_DATA.trends) {
      for (const field of requiredFields) {
        expect(trend, `trend "${trend.title}" missing "${field}"`).toHaveProperty(field);
      }
    }
  });

  it('impact, novelty, maturity are numbers between 0 and 100', () => {
    for (const t of CIN_DATA.trends) {
      expect(t.impact).toBeGreaterThanOrEqual(0);
      expect(t.impact).toBeLessThanOrEqual(100);
      expect(t.novelty).toBeGreaterThanOrEqual(0);
      expect(t.novelty).toBeLessThanOrEqual(100);
      expect(t.maturity).toBeGreaterThanOrEqual(0);
      expect(t.maturity).toBeLessThanOrEqual(100);
    }
  });

  it('every trend dim is a valid dimension', () => {
    for (const t of CIN_DATA.trends) {
      expect(CIN_DATA.dimensions).toContain(t.dim);
    }
  });

  it('every trend stage is a valid stage', () => {
    for (const t of CIN_DATA.trends) {
      expect(CIN_DATA.stages).toContain(t.stage);
    }
  });

  it('trend ids are unique', () => {
    const ids = CIN_DATA.trends.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('funnelStages', () => {
  it('has exactly 4 entries (validate was removed)', () => {
    expect(CIN_DATA.funnelStages).toHaveLength(4);
  });

  it('each stage has key, label, and count', () => {
    for (const fs of CIN_DATA.funnelStages) {
      expect(fs).toHaveProperty('key');
      expect(fs).toHaveProperty('label');
      expect(fs).toHaveProperty('count');
      expect(typeof fs.count).toBe('number');
    }
  });

  it('does not include a validate stage', () => {
    const keys = CIN_DATA.funnelStages.map(s => s.key);
    expect(keys).not.toContain('validate');
  });
});

describe('owners', () => {
  it('is derived from trends and has no duplicates', () => {
    const unique = new Set(CIN_DATA.owners);
    expect(unique.size).toBe(CIN_DATA.owners.length);
  });

  it('every owner appears in at least one trend', () => {
    const trendOwners = new Set(CIN_DATA.trends.map(t => t.owner));
    for (const owner of CIN_DATA.owners) {
      expect(trendOwners.has(owner)).toBe(true);
    }
  });
});

describe('signals', () => {
  it('each signal references a valid trend id', () => {
    const trendIds = new Set(CIN_DATA.trends.map(t => t.id));
    for (const s of CIN_DATA.signals) {
      expect(trendIds.has(s.trendId), `signal "${s.id}" references unknown trend "${s.trendId}"`).toBe(true);
    }
  });
});
