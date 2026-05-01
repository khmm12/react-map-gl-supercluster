import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { PointFeature } from './types.js'
import type { UseSuperclusterOptions, UseSuperclusterReturnValue } from './use-supercluster.js'

type Properties = { cluster: false; value: number }
type ClusterProperties = { sum: number }
type Result = UseSuperclusterReturnValue<Properties, ClusterProperties>
type Options = UseSuperclusterOptions<never, Properties, ClusterProperties>

beforeAll(() => {
  ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

describe('create in production', () => {
  it('does not warn about unstable map/reduce options', async () => {
    vi.doMock('esm-env', () => ({ DEV: false }))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { create } = await import('./use-supercluster.js')
    const useSupercluster = create<never>(() => ({}))
    const points = [pointFeature(1, [0, 0], 2), pointFeature(2, [0.01, 0.01], 3)]
    const view = await renderUseSupercluster(useSupercluster, points, unstableOptions())

    await view.rerender(points, unstableOptions())
    await view.rerender(points, unstableOptions())
    await view.rerender(points, unstableOptions())

    expect(warn).not.toHaveBeenCalled()
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
    rerender(nextPoints: Array<PointFeature<Properties>>, nextOptions?: Options): Promise<void>
  } = {
    points,
    result: null,
    root,
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

function unstableOptions(): Options {
  return {
    map: (properties) => ({ sum: properties.value }),
    reduce: (memo, properties) => {
      memo.sum += properties.sum
    },
  }
}

function pointFeature(id: number, coordinates: [number, number], value = id): PointFeature<Properties> {
  return {
    geometry: { coordinates, type: 'Point' },
    id,
    properties: { cluster: false, value },
    type: 'Feature',
  }
}
