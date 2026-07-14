import { afterEach, describe, expect, it, vi } from 'vitest'
import { pointFeature, renderHook, type TestClusterProperties, type TestProperties } from './test-helpers.js'
import type { PointFeature, SuperclusterOptions } from './types.js'
import { useSuperclusterIndex } from './use-supercluster-index.js'

type Options = SuperclusterOptions<TestProperties, TestClusterProperties>
type Props = { points: Array<PointFeature<TestProperties>>; options: Options }

const WORLD_BOUNDS: [number, number, number, number] = [-180, -85, 180, 85]

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useSuperclusterIndex', () => {
  it('builds an index loaded with the given points', async () => {
    const points = [pointFeature(1, [0, 0], 2), pointFeature(2, [0.01, 0.01], 3)]
    const options = {
      map: (properties) => ({ sum: properties.value }),
      reduce: (memo, properties) => {
        memo.sum += properties.sum
      },
    } satisfies Options
    const view = await renderIndex({ points, options })

    const clusters = view.result.getClusters(WORLD_BOUNDS, 0)

    expect(clusters).toHaveLength(1)
    expect(clusters[0]?.properties).toMatchObject({ cluster: true, sum: 5 })
  })

  it('rebuilds the index when points change', async () => {
    const view = await renderIndex({ points: [pointFeature(1, [0, 0])], options: {} })
    const firstIndex = view.result

    await view.rerender({ points: [pointFeature(1, [0, 0]), pointFeature(2, [1, 1])], options: {} })

    expect(view.result).not.toBe(firstIndex)
  })

  it('rebuilds the index when options change', async () => {
    const points = [pointFeature(1, [0, 0])]
    const view = await renderIndex({ points, options: { radius: 40 } })
    const firstIndex = view.result

    await view.rerender({ points, options: { radius: 80 } })

    expect(view.result).not.toBe(firstIndex)
  })

  it('memoizes structurally equal options', async () => {
    const points = [pointFeature(1, [0, 0], 2), pointFeature(2, [0.01, 0.01], 3)]
    const options = {
      extent: 256,
      generateId: true,
      map: (properties) => ({ sum: properties.value }),
      maxZoom: 12,
      minPoints: 2,
      minZoom: 1,
      nodeSize: 32,
      radius: 60,
      reduce: (memo, properties) => {
        memo.sum += properties.sum
      },
    } satisfies Options
    const view = await renderIndex({ points, options })
    const firstIndex = view.result

    await view.rerender({ points, options: { ...options } })

    expect(view.result).toBe(firstIndex)
  })

  it('warns about unstable function options in development', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const points = [pointFeature(1, [0, 0])]
    const view = await renderIndex({ points, options: { map: unstableMapOption() } })

    await view.rerender({ points, options: { map: unstableMapOption() } })
    await view.rerender({ points, options: { map: unstableMapOption() } })
    await view.rerender({ points, options: { map: unstableMapOption() } })

    expect(warn).toHaveBeenCalledTimes(1)
  })
})

function renderIndex(props: Props) {
  return renderHook(({ points, options }: Props) => useSuperclusterIndex(points, options), props)
}

function unstableMapOption(): NonNullable<Options['map']> {
  return (properties) => ({ sum: properties.value })
}
