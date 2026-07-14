import React, { act } from 'react'
import { renderToString } from 'react-dom/server'
import Supercluster from 'supercluster'
import { describe, expect, it } from 'vitest'
import { pointFeature, renderHook, type TestClusterProperties, TestMap, type TestProperties } from './test-helpers.js'
import type { PointFeature, SuperclusterInstance } from './types.js'
import { useClusters } from './use-clusters.js'

type Index = SuperclusterInstance<TestProperties, TestClusterProperties>
type Props = { map: TestMap | null; index: Index }

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
    expect(view.result.clusters[0]?.properties).toMatchObject({ cluster: false })
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

  it('renders empty clusters on the server even when a map is provided', () => {
    const index = createIndex([pointFeature(1, [0, 0]), pointFeature(2, [0.01, 0.01])])
    const rendered: { result: ReturnType<typeof useClusters<TestProperties, TestClusterProperties>> | null } = {
      result: null,
    }

    function ServerComponent(): null {
      rendered.result = useClusters(worldMap(), index)
      return null
    }

    renderToString(React.createElement(ServerComponent))

    expect(rendered.result?.clusters).toEqual([])
    expect(rendered.result?.supercluster).toBe(index)
  })
})

function renderClusters(props: Props) {
  return renderHook(({ map, index }: Props) => useClusters(map, index), props)
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
