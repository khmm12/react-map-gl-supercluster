import { afterEach, describe, expect, it, vi } from 'vitest'
import { pointFeature, renderHook } from './test-helpers.js'
import type { GeoJsonProperties, PointFeature } from './types.js'
import { useWarnOnReservedClusterKey } from './warn-reserved-cluster-key.js'

type Points = Array<PointFeature<GeoJsonProperties>>

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useWarnOnReservedClusterKey', () => {
  it('does not warn for points without the cluster key', async () => {
    const warn = spyOnWarn()
    const view = await renderWarnings([pointFeature(1, [0, 0])])

    await view.rerender([pointFeature(2, [1, 1])])

    expect(warn).not.toHaveBeenCalled()
  })

  it('warns when a point defines the reserved cluster key', async () => {
    const warn = spyOnWarn()

    await renderWarnings([pointFeature(1, [0, 0]), reservedPoint()])

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(
      'react-map-gl-supercluster: point properties must not define "cluster". ' +
        'The key is reserved for generated clusters and makes isCluster misreport such points.',
    )
  })

  it('warns only once across re-renders with offending points', async () => {
    const warn = spyOnWarn()
    const view = await renderWarnings([reservedPoint()])

    await view.rerender([reservedPoint()])
    await view.rerender([reservedPoint()])

    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('does not re-scan re-renders with the same points array', async () => {
    const warn = spyOnWarn()
    const points: Points = [pointFeature(1, [0, 0])]
    const view = await renderWarnings(points)

    points.push(reservedPoint())
    await view.rerender(points)

    expect(warn).not.toHaveBeenCalled()
  })
})

function renderWarnings(points: Points) {
  return renderHook((props: Points) => useWarnOnReservedClusterKey(props), points)
}

function spyOnWarn() {
  return vi.spyOn(console, 'warn').mockImplementation(() => {})
}

function reservedPoint(): PointFeature<GeoJsonProperties> {
  return {
    geometry: { coordinates: [0, 0], type: 'Point' },
    properties: { cluster: true },
    type: 'Feature',
  }
}
