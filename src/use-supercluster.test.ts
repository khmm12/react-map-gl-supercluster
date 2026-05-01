import React, { act, type RefObject } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { PointFeature, RelMapRef } from './types.js'
import { create, type UseSuperclusterOptions, type UseSuperclusterReturnValue } from './use-supercluster.js'

type Properties = { cluster: false; value: number }
type ClusterProperties = { sum: number }
type Result = UseSuperclusterReturnValue<Properties, ClusterProperties>
type Options = UseSuperclusterOptions<TestMap, Properties, ClusterProperties>

beforeAll(() => {
  ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('create', () => {
  describe('map resolution', () => {
    it('returns empty clusters while the map is unavailable', async () => {
      const currentMap = { current: null as TestMap | null }
      const useSupercluster = create<TestMap>(() => (currentMap.current == null ? {} : { current: currentMap.current }))
      const points = [pointFeature(1, [0, 0])]
      const view = await renderUseSupercluster(useSupercluster, points)

      expect(view.result.clusters).toEqual([])
    })

    it('resolves the map from react-map-gl context when mapRef is omitted', async () => {
      const map = new TestMap([
        [-180, -85],
        [180, 85],
      ])
      const useSupercluster = create(() => ({ current: map }))
      const points = [pointFeature(1, [0, 0]), pointFeature(2, [0.01, 0.01])]
      const view = await renderUseSupercluster(useSupercluster, points)

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
      const view = await renderUseSupercluster(useSupercluster, [pointFeature(1, [0, 0])], { mapRef: explicitMap })

      expect(view.result.clusters).toHaveLength(1)
      expect(contextMap.listenerCount('move')).toBe(0)
      expect(explicitMap.listenerCount('move')).toBe(1)
    })

    it('accepts an explicit React ref', async () => {
      const map = new TestMap([
        [-10, -10],
        [10, 10],
      ])
      const useSupercluster = create(() => ({}))
      const view = await renderUseSupercluster(useSupercluster, [pointFeature(1, [0, 0])], {
        mapRef: { current: map } as RefObject<TestMap>,
      })

      expect(view.result.clusters).toHaveLength(1)
    })

    it('treats an empty explicit React ref as unavailable map', async () => {
      const useSupercluster = create(() => ({}))
      const view = await renderUseSupercluster(useSupercluster, [pointFeature(1, [0, 0])], {
        mapRef: { current: null } as RefObject<TestMap | null>,
      })

      expect(view.result.clusters).toEqual([])
    })
  })

  it('subscribes to move events', async () => {
    const map = new TestMap([
      [-180, -85],
      [180, 85],
    ])
    const useSupercluster = create(() => ({ current: map }))

    await renderUseSupercluster(useSupercluster, [pointFeature(1, [0, 0])])

    expect(map.listenerCount('move')).toBe(1)
  })

  it('updates clusters on move events', async () => {
    const map = new TestMap([
      [-180, -85],
      [180, 85],
    ])
    const useSupercluster = create(() => ({ current: map }))
    const points = [pointFeature(1, [0, 0]), pointFeature(2, [0.01, 0.01])]
    const view = await renderUseSupercluster(useSupercluster, points)

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
    const map = new TestMap([
      [-180, -85],
      [180, 85],
    ])
    const useSupercluster = create(() => ({ current: map }))
    const view = await renderUseSupercluster(useSupercluster, [pointFeature(1, [0, 0])])

    view.unmount()

    expect(map.listenerCount('move')).toBe(0)
  })

  it('keeps the previous state when the map changes but visible clusters are shallowly equal', async () => {
    const map = new TestMap([
      [-10, -10],
      [10, 10],
    ])
    const useSupercluster = create(() => ({ current: map }))
    const view = await renderUseSupercluster(useSupercluster, [pointFeature(1, [0, 0])])
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
    const useSupercluster = create(() => ({ current: map }))
    const view = await renderUseSupercluster(useSupercluster, [pointFeature(1, [0, 0])])

    await act(async () => {
      map.setBounds(null)
      map.emit('move')
    })

    expect(view.result.clusters).toEqual([])
  })

  it('does not update when bounds remain unavailable and clusters are already empty', async () => {
    const map = new TestMap(null)
    const useSupercluster = create(() => ({ current: map }))
    const view = await renderUseSupercluster(useSupercluster, [pointFeature(1, [0, 0])])
    const previousResult = view.result

    await act(async () => {
      map.emit('move')
    })

    expect(view.result).toBe(previousResult)
  })

  it('rebuilds supercluster when points change', async () => {
    const map = new TestMap([
      [-10, -10],
      [10, 10],
    ])
    const useSupercluster = create(() => ({ current: map }))
    const firstPoints = [pointFeature(1, [0, 0])]
    const view = await renderUseSupercluster(useSupercluster, firstPoints)
    const firstSupercluster = view.result.supercluster

    await view.rerender([pointFeature(1, [0, 0]), pointFeature(2, [1, 1])])

    expect(view.result.supercluster).not.toBe(firstSupercluster)
  })

  it('rebuilds supercluster when options change', async () => {
    const map = new TestMap([
      [-10, -10],
      [10, 10],
    ])
    const useSupercluster = create(() => ({ current: map }))
    const points = [pointFeature(1, [0, 0])]
    const view = await renderUseSupercluster(useSupercluster, points)
    const firstSupercluster = view.result.supercluster

    await view.rerender(view.points, { radius: 80 })

    expect(view.result.supercluster).not.toBe(firstSupercluster)
  })

  it('memoizes structurally equal options', async () => {
    const map = new TestMap([
      [-180, -85],
      [180, 85],
    ])
    const useSupercluster = create(() => ({ current: map }))
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
    const view = await renderUseSupercluster(useSupercluster, points, options)
    const firstSupercluster = view.result.supercluster

    await view.rerender(points, { ...options })

    expect(view.result.supercluster).toBe(firstSupercluster)
  })

  it('supports map/reduce cluster properties', async () => {
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
    const view = await renderUseSupercluster(useSupercluster, points, options)

    expect(view.result.clusters[0]?.properties).toMatchObject({ cluster: true, sum: 5 })
  })

  it('does not warn when map/reduce option references stay stable', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const map = new TestMap([
      [-180, -85],
      [180, 85],
    ])
    const useSupercluster = create(() => ({ current: map }))
    const points = [pointFeature(1, [0, 0], 2), pointFeature(2, [0.01, 0.01], 3)]
    const mapOption: NonNullable<Options['map']> = (properties) => ({ sum: properties.value })
    const reduceOption: NonNullable<Options['reduce']> = (memo, properties) => {
      memo.sum += properties.sum
    }
    const view = await renderUseSupercluster(useSupercluster, points, { map: mapOption, reduce: reduceOption })

    await view.rerender(points, { map: mapOption, reduce: reduceOption })

    expect(warn).not.toHaveBeenCalled()
  })

  it('warns once when map option reference changes for three consecutive renders', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const map = new TestMap([
      [-180, -85],
      [180, 85],
    ])
    const useSupercluster = create(() => ({ current: map }))
    const points = [pointFeature(1, [0, 0], 2), pointFeature(2, [0.01, 0.01], 3)]
    const view = await renderUseSupercluster(useSupercluster, points, {
      map: (properties) => ({ sum: properties.value }),
    })

    await view.rerender(points, { map: (properties) => ({ sum: properties.value }) })
    await view.rerender(points, { map: (properties) => ({ sum: properties.value }) })
    expect(warn).not.toHaveBeenCalled()

    await view.rerender(points, { map: (properties) => ({ sum: properties.value }) })
    await view.rerender(points, { map: (properties) => ({ sum: properties.value }) })

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(
      'react-map-gl-supercluster: option "map" changed between renders. This recreates the Supercluster index. Wrap it in useCallback or define it outside the component.',
    )
  })

  it('does not warn when map/reduce options are added after initial render', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const map = new TestMap([
      [-180, -85],
      [180, 85],
    ])
    const useSupercluster = create(() => ({ current: map }))
    const points = [pointFeature(1, [0, 0], 2), pointFeature(2, [0.01, 0.01], 3)]
    const view = await renderUseSupercluster(useSupercluster, points)

    await view.rerender(points, {
      map: (properties) => ({ sum: properties.value }),
      reduce: (memo, properties) => {
        memo.sum += properties.sum
      },
    })

    expect(warn).not.toHaveBeenCalled()
  })

  it('resets the unstable map option counter when the reference stabilizes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const map = new TestMap([
      [-180, -85],
      [180, 85],
    ])
    const useSupercluster = create(() => ({ current: map }))
    const points = [pointFeature(1, [0, 0], 2), pointFeature(2, [0.01, 0.01], 3)]
    const stableMapOption: NonNullable<Options['map']> = (properties) => ({ sum: properties.value })
    const view = await renderUseSupercluster(useSupercluster, points, {
      map: (properties) => ({ sum: properties.value }),
    })

    await view.rerender(points, { map: (properties) => ({ sum: properties.value }) })
    await view.rerender(points, { map: stableMapOption })
    await view.rerender(points, { map: stableMapOption })
    await view.rerender(points, { map: (properties) => ({ sum: properties.value }) })
    await view.rerender(points, { map: (properties) => ({ sum: properties.value }) })

    expect(warn).not.toHaveBeenCalled()
  })

  it('warns once when reduce option reference changes for three consecutive renders', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const map = new TestMap([
      [-180, -85],
      [180, 85],
    ])
    const useSupercluster = create(() => ({ current: map }))
    const points = [pointFeature(1, [0, 0], 2), pointFeature(2, [0.01, 0.01], 3)]
    const mapOption: NonNullable<Options['map']> = (properties) => ({ sum: properties.value })
    const view = await renderUseSupercluster(useSupercluster, points, {
      map: mapOption,
      reduce: (memo, properties) => {
        memo.sum += properties.sum
      },
    })

    await view.rerender(points, {
      map: mapOption,
      reduce: (memo, properties) => {
        memo.sum += properties.sum
      },
    })
    expect(warn).not.toHaveBeenCalled()

    await view.rerender(points, {
      map: mapOption,
      reduce: (memo, properties) => {
        memo.sum += properties.sum
      },
    })
    await view.rerender(points, {
      map: mapOption,
      reduce: (memo, properties) => {
        memo.sum += properties.sum
      },
    })

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(
      'react-map-gl-supercluster: option "reduce" changed between renders. This recreates the Supercluster index. Wrap it in useCallback or define it outside the component.',
    )
  })
})

async function renderUseSupercluster(
  useSupercluster: (points: Array<PointFeature<Properties>>, options?: Options) => Result,
  points: Array<PointFeature<Properties>>,
  options: Options = {},
) {
  const container = document.createElement('div')
  const root = createRoot(container)
  const view: {
    points: Array<PointFeature<Properties>>
    result: Result | null
    root: Root
    unmount(): void
    rerender(nextPoints: Array<PointFeature<Properties>>, nextOptions?: Options): Promise<void>
  } = {
    points,
    result: null,
    root,
    unmount: () => {
      act(() => root.unmount())
    },
    rerender: async (nextPoints, nextOptions = options) => {
      view.points = nextPoints
      options = nextOptions
      await render()
    },
  }

  function TestComponent() {
    view.result = useSupercluster(view.points, options)
    return null
  }

  async function render() {
    await act(async () => {
      root.render(React.createElement(TestComponent))
    })
  }

  await render()

  if (view.result == null) throw new Error('Hook did not render')

  return view as typeof view & { result: Result }
}

function pointFeature(id: number, coordinates: [number, number], value = id): PointFeature<Properties> {
  return {
    geometry: { coordinates, type: 'Point' },
    id,
    properties: { cluster: false, value },
    type: 'Feature',
  }
}

class TestMap implements RelMapRef {
  private bounds: [[number, number], [number, number]] | null
  private readonly listeners = new Map<string, Set<(...args: unknown[]) => void>>()
  private zoom = 0

  constructor(bounds: [[number, number], [number, number]] | null, zoom = 0) {
    this.bounds = bounds
    this.zoom = zoom
  }

  getBounds() {
    return this.bounds == null ? null : { toArray: () => this.bounds ?? [] }
  }

  getZoom() {
    return this.zoom
  }

  listenerCount(type: string) {
    return this.listeners.get(type)?.size ?? 0
  }

  off(type: string, listener?: (...args: unknown[]) => void) {
    if (listener == null) {
      this.listeners.delete(type)
      return
    }

    this.listeners.get(type)?.delete(listener)
  }

  on(type: string, listener: (...args: unknown[]) => void) {
    const listeners = this.listeners.get(type) ?? new Set()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }

  emit(type: string) {
    for (const listener of this.listeners.get(type) ?? []) listener()
  }

  setBounds(bounds: [[number, number], [number, number]] | null) {
    this.bounds = bounds
  }

  setView(bounds: [[number, number], [number, number]] | null, zoom: number) {
    this.bounds = bounds
    this.zoom = zoom
  }
}
