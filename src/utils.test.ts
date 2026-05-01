import { describe, expect, it } from 'vitest'
import type { PointFeature, RelMapRef } from './types.js'
import { getMapState, isClustersShallowEqual, isEqual } from './utils.js'

describe('isEqual', () => {
  it('compares values structurally', () => {
    expect(isEqual({ a: [1, 2] }, { a: [1, 2] })).toBe(true)
    expect(isEqual({ a: [1, 2] }, { a: [2, 1] })).toBe(false)
  })
})

describe('isClustersShallowEqual', () => {
  const point = pointFeature(1, [10, 20])

  it('accepts the same feature object', () => {
    expect(isClustersShallowEqual([point], [point])).toBe(true)
  })

  it('accepts different feature objects with the same type, id, and point geometry', () => {
    expect(isClustersShallowEqual([point], [pointFeature(1, [10, 20])])).toBe(true)
  })

  it('rejects arrays with different lengths', () => {
    expect(isClustersShallowEqual([point], [])).toBe(false)
  })

  it('rejects missing features', () => {
    expect(isClustersShallowEqual([point], [undefined as unknown as typeof point])).toBe(false)
  })

  it('rejects features with different GeoJSON feature types', () => {
    const nextPoint = pointFeature(1, [10, 20])
    nextPoint.type = 'Other' as typeof nextPoint.type

    expect(isClustersShallowEqual([point], [nextPoint])).toBe(false)
  })

  it('rejects features with different ids', () => {
    expect(isClustersShallowEqual([point], [pointFeature(2, [10, 20])])).toBe(false)
  })

  it('rejects features with different point geometries', () => {
    expect(isClustersShallowEqual([point], [pointFeature(1, [20, 10])])).toBe(false)
  })
})

describe('getMapState', () => {
  it('returns null when bounds are not available', () => {
    const map = createMap(null, 3.4)

    expect(getMapState(map)).toBeNull()
  })

  it('flattens bounds and rounds zoom', () => {
    const map = createMap(
      [
        [-10, -20],
        [10, 20],
      ],
      3.6,
    )

    expect(getMapState(map)).toEqual({ bounds: [-10, -20, 10, 20], zoom: 4 })
  })
})

function pointFeature(id: number, coordinates: [number, number]): PointFeature<{ cluster: false }> {
  return {
    geometry: { coordinates, type: 'Point' },
    id,
    properties: { cluster: false },
    type: 'Feature',
  }
}

function createMap(bounds: number[][] | null, zoom: number): RelMapRef {
  return {
    getBounds: () => (bounds == null ? null : { toArray: () => bounds }),
    getZoom: () => zoom,
    off: () => {},
    on: () => {},
  }
}
