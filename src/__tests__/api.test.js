import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to mock fetch before importing the module
const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockJsonResponse(data, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

// Dynamic import so fetch is already mocked
let signalsApi, campaignsApi, clustersApi, conceptsApi, trendsApi;
beforeEach(async () => {
  vi.resetModules();
  global.fetch = mockFetch;
  const mod = await import('../api.js');
  signalsApi = mod.signalsApi;
  campaignsApi = mod.campaignsApi;
  clustersApi = mod.clustersApi;
  conceptsApi = mod.conceptsApi;
  trendsApi = mod.trendsApi;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('signalsApi', () => {
  it('list() extracts signals array from response', async () => {
    const payload = { signals: [{ id: 's1', title: 'Test Signal' }, { id: 's2', title: 'Another' }] };
    mockFetch.mockReturnValueOnce(mockJsonResponse(payload));

    const result = await signalsApi.list();
    expect(result).toEqual(payload.signals);
    expect(result).toHaveLength(2);
    expect(mockFetch).toHaveBeenCalledWith('/api/signals', expect.objectContaining({
      headers: { 'Content-Type': 'application/json' },
    }));
  });

  it('list() returns empty array when signals key is missing', async () => {
    mockFetch.mockReturnValueOnce(mockJsonResponse({}));
    const result = await signalsApi.list();
    expect(result).toEqual([]);
  });

  it('create() sends POST with JSON body', async () => {
    const newSignal = { title: 'New', source: 'test' };
    mockFetch.mockReturnValueOnce(mockJsonResponse({ signal: { id: 'x', ...newSignal } }, 201));

    await signalsApi.create(newSignal);
    expect(mockFetch).toHaveBeenCalledWith('/api/signals', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(newSignal),
    }));
  });

  it('throws on HTTP error with error message from body', async () => {
    mockFetch.mockReturnValueOnce(mockJsonResponse({ error: 'not found' }, 404));
    await expect(signalsApi.get('bad')).rejects.toThrow('not found');
  });
});

describe('campaignsApi', () => {
  it('list() extracts campaigns array from response', async () => {
    const payload = { campaigns: [{ id: 'c1', name: 'Camp1' }] };
    mockFetch.mockReturnValueOnce(mockJsonResponse(payload));

    const result = await campaignsApi.list();
    expect(result).toEqual(payload.campaigns);
    expect(result).toHaveLength(1);
  });

  it('list() returns empty array when campaigns key is missing', async () => {
    mockFetch.mockReturnValueOnce(mockJsonResponse({}));
    const result = await campaignsApi.list();
    expect(result).toEqual([]);
  });
});

describe('clustersApi', () => {
  it('list() extracts clusters array from response', async () => {
    const payload = { clusters: [{ id: 'cl1' }, { id: 'cl2' }, { id: 'cl3' }] };
    mockFetch.mockReturnValueOnce(mockJsonResponse(payload));

    const result = await clustersApi.list();
    expect(result).toEqual(payload.clusters);
    expect(result).toHaveLength(3);
  });

  it('list() returns empty array when clusters key is missing', async () => {
    mockFetch.mockReturnValueOnce(mockJsonResponse({}));
    const result = await clustersApi.list();
    expect(result).toEqual([]);
  });
});

describe('conceptsApi', () => {
  it('list() returns the full response (no extraction)', async () => {
    const payload = [{ id: 'co1', title: 'Concept' }];
    mockFetch.mockReturnValueOnce(mockJsonResponse(payload));

    const result = await conceptsApi.list();
    // conceptsApi.list does NOT extract — returns raw parsed JSON
    expect(result).toEqual(payload);
  });
});

describe('trendsApi', () => {
  it('update() sends PUT with id as query param', async () => {
    const patch = { title: 'Updated' };
    mockFetch.mockReturnValueOnce(mockJsonResponse({ trend: { id: 't1', ...patch } }));

    await trendsApi.update('t1', patch);
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/trends?id=t1',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(patch) })
    );
  });

  it('remove() sends DELETE with id as query param', async () => {
    mockFetch.mockReturnValueOnce(mockJsonResponse(null));
    await trendsApi.remove('t1');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/trends?id=t1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
