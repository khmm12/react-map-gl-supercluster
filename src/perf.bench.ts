import Supercluster from 'supercluster'
import { bench, describe } from 'vitest'
import { isClustersShallowEqual } from './cluster-equality.js'
import { getMapState, isMapStateEqual } from './map-state.js'
import type { MapLike, PointFeature } from './types.js'

type Properties = { cluster: false; value: number }

function makePoints(count: number): Array<PointFeature<Properties>> {
  const points: Array<PointFeature<Properties>> = []
  for (let i = 0; i < count; i += 1) {
    points.push({
      geometry: { coordinates: [Math.random() * 360 - 180, Math.random() * 170 - 85], type: 'Point' },
      id: i,
      properties: { cluster: false, value: i },
      type: 'Feature',
    })
  }
  return points
}

function makeIndex(points: Array<PointFeature<Properties>>) {
  const index = new Supercluster<Properties, { sum: number }>({
    map: (properties) => ({ sum: properties.value }),
    reduce: (memo, properties) => {
      memo.sum += properties.sum
    },
  })
  index.load(points)
  return index
}

function makeMap(bounds: [[number, number], [number, number]], zoom: number): MapLike {
  return {
    getBounds: () => ({ toArray: () => bounds }),
    getZoom: () => zoom,
    off: () => {},
    on: () => {},
  }
}

const points10k = makePoints(10_000)
const points100k = makePoints(100_000)
const index10k = makeIndex(points10k)
const index100k = makeIndex(points100k)

const WORLD: [number, number, number, number] = [-180, -85, 180, 85]
const CITY: [number, number, number, number] = [10, 45, 20, 55]

describe('index build (load)', () => {
  bench(
    'load 10k points',
    () => {
      makeIndex(points10k)
    },
    { iterations: 5, time: 300 },
  )

  bench(
    'load 100k points',
    () => {
      makeIndex(points100k)
    },
    { iterations: 3, time: 500 },
  )
})

describe('per-move pipeline, 100k index', () => {
  bench('getClusters world @ z0', () => {
    index100k.getClusters(WORLD, 0)
  })

  bench('getClusters world @ z5', () => {
    index100k.getClusters(WORLD, 5)
  })

  bench('getClusters city viewport @ z10', () => {
    index100k.getClusters(CITY, 10)
  })

  let offset = 0
  const movingMap: MapLike = {
    getBounds: () => ({
      toArray: () => [
        [-180 + offset, -85],
        [180 + offset, 85],
      ],
    }),
    getZoom: () => 5.2,
    off: () => {},
    on: () => {},
  }
  let previousMapState = getMapState(movingMap)
  let previousClusters = index100k.getClusters(WORLD, 5)

  bench('full move step: getMapState + isMapStateEqual + getClusters + isClustersShallowEqual', () => {
    offset += 0.0001
    const mapState = getMapState(movingMap)
    if (mapState == null) return
    if (isMapStateEqual(previousMapState, mapState)) return
    const clusters = index100k.getClusters(mapState.bounds, mapState.zoom)
    isClustersShallowEqual(previousClusters, clusters)
    previousMapState = mapState
    previousClusters = clusters
  })

  const staticMap = makeMap(
    [
      [-180, -85],
      [180, 85],
    ],
    5.2,
  )

  bench('getMapState alone (toArray().flat())', () => {
    getMapState(staticMap)
  })
})

describe('points identity, 100k array', () => {
  const copy = [...points100k]

  bench('shallow-ref compare (new array, same features)', () => {
    let equal = points100k.length === copy.length
    for (let i = 0; equal && i < points100k.length; i += 1) {
      equal = points100k[i] === copy[i]
    }
  })

  bench(
    'rebuild index instead (current behavior)',
    () => {
      makeIndex(points100k)
    },
    { iterations: 3, time: 500 },
  )
})

describe('cluster comparison, world @ z5 on 10k index', () => {
  const a = index10k.getClusters(WORLD, 5)
  const b = index10k.getClusters(WORLD, 5)

  bench('isClustersShallowEqual (fresh cluster objects)', () => {
    isClustersShallowEqual(a, b)
  })
})
