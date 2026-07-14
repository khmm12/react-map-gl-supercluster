import type { RefObject } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pointFeature, renderHook, type TestClusterProperties, TestMap, type TestProperties } from './test-helpers.js'
import type { PointFeature } from './types.js'
import { create, type UseSuperclusterOptions, type UseSuperclusterReturnValue } from './use-supercluster.js'

type Options = UseSuperclusterOptions<TestMap, TestProperties, TestClusterProperties>
type Result = UseSuperclusterReturnValue<TestProperties, TestClusterProperties>
type Props = { points: Array<PointFeature<TestProperties>>; options?: Options }

afterEach(() => {
  vi.restoreAllMocks()
})

describe('create', () => {
  describe('map resolution', () => {
    it('returns empty clusters while the map is unavailable', async () => {
      const useSupercluster = create<TestMap>(() => ({}))
      const view = await renderUseSupercluster(useSupercluster, { points: [pointFeature(1, [0, 0])] })

      expect(view.result.clusters).toEqual([])
    })

    it('resolves the map from react-map-gl context when mapRef is omitted', async () => {
      const map = new TestMap([
        [-180, -85],
        [180, 85],
      ])
      const useSupercluster = create(() => ({ current: map }))
      const points = [pointFeature(1, [0, 0]), pointFeature(2, [0.01, 0.01])]
      const view = await renderUseSupercluster(useSupercluster, { points })

      expect(view.result.clusters).toHaveLength(1)
    })

    it('prefers explicit mapRef over the context map', async () => {
      const contextMap = new TestMap([
        [100, 50],
        [120, 70],
      ])
      const explicitMap = new TestMap([
        [-10, -10],
        [10, 10],
      ])
      const useSupercluster = create(() => ({ current: contextMap }))
      const view = await renderUseSupercluster(useSupercluster, {
        options: { mapRef: explicitMap },
        points: [pointFeature(1, [0, 0])],
      })

      expect(view.result.clusters).toHaveLength(1)
      expect(contextMap.listenerCount('move')).toBe(0)
      expect(explicitMap.listenerCount('move')).toBe(1)
    })

    it('accepts an explicit React ref', async () => {
      const map = new TestMap([
        [-10, -10],
        [10, 10],
      ])
      const useSupercluster = create<TestMap>(() => ({}))
      const view = await renderUseSupercluster(useSupercluster, {
        options: { mapRef: { current: map } as RefObject<TestMap> },
        points: [pointFeature(1, [0, 0])],
      })

      expect(view.result.clusters).toHaveLength(1)
    })

    it('treats an empty explicit React ref as unavailable map', async () => {
      const useSupercluster = create<TestMap>(() => ({}))
      const view = await renderUseSupercluster(useSupercluster, {
        options: { mapRef: { current: null } as RefObject<TestMap | null> },
        points: [pointFeature(1, [0, 0])],
      })

      expect(view.result.clusters).toEqual([])
    })
  })

  it('clusters points with map/reduce options end to end', async () => {
    const map = new TestMap([
      [-180, -85],
      [180, 85],
    ])
    const useSupercluster = create(() => ({ current: map }))
    const points = [pointFeature(1, [0, 0], 2), pointFeature(2, [0.01, 0.01], 3)]
    const options = {
      map: (properties) => ({ sum: properties.value }),
      reduce: (memo, properties) => {
        memo.sum += properties.sum
      },
    } satisfies Options
    const view = await renderUseSupercluster(useSupercluster, { options, points })

    expect(view.result.clusters[0]?.properties).toMatchObject({ cluster: true, sum: 5 })
  })

  it('passes boundsPadding through to clustering', async () => {
    const map = new TestMap([
      [-10, -10],
      [10, 10],
    ])
    const useSupercluster = create(() => ({ current: map }))
    const view = await renderUseSupercluster(useSupercluster, {
      options: { boundsPadding: 0.5 },
      points: [pointFeature(1, [12, 12])],
    })

    expect(view.result.clusters).toHaveLength(1)
  })

  it('works under React StrictMode', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const map = new TestMap([
      [-180, -85],
      [180, 85],
    ])
    const useSupercluster = create(() => ({ current: map }))
    const points = [pointFeature(1, [0, 0], 2), pointFeature(2, [0.01, 0.01], 3)]
    const options = {
      map: (properties) => ({ sum: properties.value }),
      reduce: (memo, properties) => {
        memo.sum += properties.sum
      },
    } satisfies Options
    const view = await renderUseSupercluster(useSupercluster, { options, points }, { strictMode: true })
    const firstSupercluster = view.result.supercluster

    expect(view.result.clusters).toHaveLength(1)
    expect(map.listenerCount('move')).toBe(1)

    await view.rerender({ options: { ...options }, points })

    expect(view.result.supercluster).toBe(firstSupercluster)
    expect(warn).not.toHaveBeenCalled()
  })
})

function renderUseSupercluster(
  useSupercluster: (points: Array<PointFeature<TestProperties>>, options?: Options) => Result,
  props: Props,
  renderOptions?: { strictMode?: boolean },
) {
  return renderHook(({ points, options }: Props) => useSupercluster(points, options), props, renderOptions)
}
