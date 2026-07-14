import { describe, expect, it } from 'vitest'
import { isClustersShallowEqual } from './cluster-equality.js'
import { pointFeature } from './test-helpers.js'

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

  it('rejects features with coordinates of different length', () => {
    expect(isClustersShallowEqual([point], [pointFeature(1, [10, 20, 5])])).toBe(false)
  })
})
