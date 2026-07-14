import React, { act } from 'react'
import { renderToString } from 'react-dom/server'
import Supercluster from 'supercluster'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pointFeature, renderHook, type TestClusterProperties, TestMap, type TestProperties } from './test-helpers.js'
import type { PointFeature, SuperclusterInstance } from './types.js'
import { useClusters } from './use-clusters.js'

type Index = SuperclusterInstance<TestProperties, TestClusterProperties>
type Props = { map: TestMap | null; index: Index; boundsPadding?: number }

afterEach(() => {
  vi.restoreAllMocks()
})

const worldMap = () =>
  new TestMap([
    [-180, -85],
    [180, 85],
  ])

describe('useClusters', () => {
  it('computes clusters for the current viewport on mount', async () => {
    const map = worldMap()
    const index = createIndex([pointFeature(1, [0, 0]), pointFeature(2, [0.01, 0.01])])
    const view = await renderClusters({ map, index })

    expect(view.result.clusters).toHaveLength(1)
    expect(view.result.supercluster).toBe(index)
  })

  it('exposes only clusters and supercluster', async () => {
    const view = await renderClusters({ map: worldMap(), index: createIndex([pointFeature(1, [0, 0])]) })

    expect(Object.keys(view.result).sort()).toEqual(['clusters', 'supercluster'])
  })

  it('returns empty clusters and keeps the state stable while the map is unavailable', async () => {
    const index = createIndex([pointFeature(1, [0, 0])])
    const view = await renderClusters({ map: null, index })
    const previousResult = view.result

    expect(previousResult.clusters).toEqual([])

    await view.rerender({ map: null, index })

    expect(view.result).toBe(previousResult)
  })

  it('subscribes to move events', async () => {
    const map = worldMap()
    const view = await renderClusters({ map, index: createIndex([pointFeature(1, [0, 0])]) })

    expect(map.listenerCount('move')).toBe(1)
    view.unmount()
  })

  it('updates clusters on move events', async () => {
    const map = worldMap()
    const index = createIndex([pointFeature(1, [0, 0]), pointFeature(2, [0.01, 0.01])])
    const view = await renderClusters({ map, index })

    await act(async () => {
      map.setView(
        [
          [100, 50],
          [120, 70],
        ],
        5,
      )
      map.emit('move')
    })

    expect(view.result.clusters).toEqual([])
  })

  it('unsubscribes from move events on unmount', async () => {
    const map = worldMap()
    const view = await renderClusters({ map, index: createIndex([pointFeature(1, [0, 0])]) })

    view.unmount()

    expect(map.listenerCount('move')).toBe(0)
  })

  it('keeps the previous state when the viewport moves but visible clusters stay the same', async () => {
    const map = new TestMap([
      [-10, -10],
      [10, 10],
    ])
    const view = await renderClusters({ map, index: createIndex([pointFeature(1, [0, 0])]) })
    const previousResult = view.result

    await act(async () => {
      map.setView(
        [
          [-9, -9],
          [9, 9],
        ],
        0.2,
      )
      map.emit('move')
    })

    expect(view.result).toBe(previousResult)
  })

  it('updates when bounds disappear after clusters were available', async () => {
    const map = new TestMap([
      [-10, -10],
      [10, 10],
    ])
    const view = await renderClusters({ map, index: createIndex([pointFeature(1, [0, 0])]) })

    await act(async () => {
      map.setBounds(null)
      map.emit('move')
    })

    expect(view.result.clusters).toEqual([])
  })

  it('does not update when bounds remain unavailable and clusters are already empty', async () => {
    const map = new TestMap(null)
    const view = await renderClusters({ map, index: createIndex([pointFeature(1, [0, 0])]) })
    const previousResult = view.result

    await act(async () => {
      map.emit('move')
    })

    expect(view.result).toBe(previousResult)
  })

  it('recomputes clusters atomically when the index changes', async () => {
    const map = worldMap()
    const firstIndex = createIndex([pointFeature(1, [0, 0]), pointFeature(2, [0.01, 0.01])])
    const nextIndex = createIndex([pointFeature(3, [0, 0])])
    const view = await renderClusters({ map, index: firstIndex })

    await view.rerender({ map, index: nextIndex })

    expect(view.result.supercluster).toBe(nextIndex)
    expect(view.result.clusters).toHaveLength(1)
    expect(view.result.clusters[0]?.properties).toEqual({ value: 3 })
    expect(map.listenerCount('move')).toBe(1)
  })

  it('exposes the new index when it changes while the map is unavailable', async () => {
    const firstIndex = createIndex([pointFeature(1, [0, 0])])
    const nextIndex = createIndex([pointFeature(2, [1, 1])])
    const view = await renderClusters({ map: null, index: firstIndex })

    await view.rerender({ map: null, index: nextIndex })

    expect(view.result.supercluster).toBe(nextIndex)
    expect(view.result.clusters).toEqual([])
  })

  it('picks up a map that appears after mount', async () => {
    const index = createIndex([pointFeature(1, [0, 0]), pointFeature(2, [0.01, 0.01])])
    const view = await renderClusters({ map: null, index })

    await view.rerender({ map: worldMap(), index })

    expect(view.result.clusters).toHaveLength(1)
  })

  it('clears clusters and unsubscribes when the map goes away', async () => {
    const map = worldMap()
    const index = createIndex([pointFeature(1, [0, 0]), pointFeature(2, [0.01, 0.01])])
    const view = await renderClusters({ map, index })
    expect(view.result.clusters).toHaveLength(1)

    await view.rerender({ map: null, index })

    expect(view.result.clusters).toEqual([])
    expect(map.listenerCount('move')).toBe(0)
  })

  it('moves the subscription to a replacement map', async () => {
    const firstMap = new TestMap([
      [-10, -10],
      [10, 10],
    ])
    const nextMap = new TestMap([
      [100, 50],
      [120, 70],
    ])
    const index = createIndex([pointFeature(1, [110, 60])])
    const view = await renderClusters({ map: firstMap, index })
    expect(view.result.clusters).toEqual([])

    await view.rerender({ map: nextMap, index })

    expect(firstMap.listenerCount('move')).toBe(0)
    expect(nextMap.listenerCount('move')).toBe(1)
    expect(view.result.clusters).toHaveLength(1)
  })

  describe('boundsPadding', () => {
    it('includes clusters slightly outside the viewport', async () => {
      const map = new TestMap([
        [-10, -10],
        [10, 10],
      ])
      const index = createIndex([pointFeature(1, [12, 12])])
      const view = await renderClusters({ boundsPadding: 0.5, index, map })

      expect(view.result.clusters).toHaveLength(1)
    })

    it('does not include clusters outside the viewport without padding', async () => {
      const map = new TestMap([
        [-10, -10],
        [10, 10],
      ])
      const index = createIndex([pointFeature(1, [12, 12])])
      const view = await renderClusters({ index, map })

      expect(view.result.clusters).toEqual([])
    })

    it('skips recomputation while the viewport stays inside the padded area', async () => {
      const map = new TestMap([
        [-10, -10],
        [10, 10],
      ])
      const index = createIndex([pointFeature(1, [0, 0])])
      const getClusters = vi.spyOn(index, 'getClusters')
      const view = await renderClusters({ boundsPadding: 0.5, index, map })
      const callsAfterMount = getClusters.mock.calls.length
      const previousResult = view.result

      await act(async () => {
        map.setView(
          [
            [-12, -12],
            [8, 8],
          ],
          0.2,
        )
        map.emit('move')
      })

      expect(view.result).toBe(previousResult)
      expect(getClusters.mock.calls.length).toBe(callsAfterMount)
    })

    it('recomputes when the viewport leaves the padded area', async () => {
      const map = new TestMap([
        [-10, -10],
        [10, 10],
      ])
      const index = createIndex([pointFeature(1, [40, 40])])
      const getClusters = vi.spyOn(index, 'getClusters')
      const view = await renderClusters({ boundsPadding: 0.5, index, map })
      expect(view.result.clusters).toEqual([])
      const callsAfterMount = getClusters.mock.calls.length

      await act(async () => {
        map.setView(
          [
            [25, 25],
            [45, 45],
          ],
          0,
        )
        map.emit('move')
      })

      expect(getClusters.mock.calls.length).toBeGreaterThan(callsAfterMount)
      expect(view.result.clusters).toHaveLength(1)
    })

    it('recomputes when the rounded zoom changes inside the padded area', async () => {
      const map = new TestMap([
        [-10, -10],
        [10, 10],
      ])
      const index = createIndex([pointFeature(1, [0, 0]), pointFeature(2, [0.01, 0.01])])
      const getClusters = vi.spyOn(index, 'getClusters')
      const view = await renderClusters({ boundsPadding: 0.5, index, map })
      const callsAfterMount = getClusters.mock.calls.length

      await act(async () => {
        map.setView(
          [
            [-9, -9],
            [9, 9],
          ],
          0.8,
        )
        map.emit('move')
      })

      expect(getClusters.mock.calls.length).toBeGreaterThan(callsAfterMount)
      expect(view.result.clusters).toHaveLength(1)
    })

    it('drops the cached padded area when bounds disappear', async () => {
      const map = new TestMap([
        [-10, -10],
        [10, 10],
      ])
      const index = createIndex([pointFeature(1, [0, 0])])
      const view = await renderClusters({ boundsPadding: 0.5, index, map })
      expect(view.result.clusters).toHaveLength(1)

      await act(async () => {
        map.setBounds(null)
        map.emit('move')
      })
      expect(view.result.clusters).toEqual([])

      await act(async () => {
        // Back inside the previously cached padded area — must requery, not reuse the empty result
        map.setBounds([
          [-8, -8],
          [8, 8],
        ])
        map.emit('move')
      })

      expect(view.result.clusters).toHaveLength(1)
    })

    it('requeries a new index even when the viewport stays inside the padded area', async () => {
      const map = new TestMap([
        [-10, -10],
        [10, 10],
      ])
      const firstIndex = createIndex([pointFeature(1, [0, 0])])
      const nextIndex = createIndex([pointFeature(2, [0, 0], 7)])
      const view = await renderClusters({ boundsPadding: 0.5, index: firstIndex, map })
      expect(view.result.clusters[0]?.properties).toEqual({ value: 1 })

      await view.rerender({ boundsPadding: 0.5, index: nextIndex, map })

      expect(view.result.supercluster).toBe(nextIndex)
      expect(view.result.clusters[0]?.properties).toEqual({ value: 7 })
    })

    it('always requeries without padding, even when the viewport shrinks', async () => {
      const map = new TestMap([
        [-10, -10],
        [10, 10],
      ])
      const index = createIndex([pointFeature(1, [0, 0])])
      const getClusters = vi.spyOn(index, 'getClusters')
      const view = await renderClusters({ index, map })
      const callsAfterMount = getClusters.mock.calls.length

      await act(async () => {
        map.setView(
          [
            [-5, -5],
            [5, 5],
          ],
          0.2,
        )
        map.emit('move')
      })

      expect(view.result.clusters).toHaveLength(1)
      expect(getClusters.mock.calls.length).toBeGreaterThan(callsAfterMount)
    })
  })

  it('renders empty clusters on the server even when a map is provided', () => {
    const index = createIndex([pointFeature(1, [0, 0]), pointFeature(2, [0.01, 0.01])])
    const rendered: { result: ReturnType<typeof useClusters<TestProperties, TestClusterProperties>> | null } = {
      result: null,
    }

    function ServerComponent(): null {
      rendered.result = useClusters<TestProperties, TestClusterProperties>(worldMap(), index)
      return null
    }

    renderToString(React.createElement(ServerComponent))

    expect(rendered.result?.clusters).toEqual([])
    expect(rendered.result?.supercluster).toBe(index)
  })
})

function renderClusters(props: Props) {
  return renderHook(({ map, index, boundsPadding }: Props) => useClusters(map, index, boundsPadding), props)
}

function createIndex(points: Array<PointFeature<TestProperties>>): Index {
  const index = new Supercluster<TestProperties, TestClusterProperties>({
    map: (properties) => ({ sum: properties.value }),
    reduce(memo, properties) {
      memo.sum += properties.sum
    },
  })
  index.load(points)
  return index
}
