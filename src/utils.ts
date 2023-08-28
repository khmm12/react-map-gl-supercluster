import { dequal } from 'dequal/lite'
import type { PointFeature, ClusterFeature, RelMapRef } from './types'

type MapBounds = [number, number, number, number]

type MapState = {
  bounds: MapBounds
  zoom: number
}

export function isEqual<T>(a: T, b: T): boolean {
  return dequal(a, b)
}

export function isClustersShallowEqual<T, C extends ReadonlyArray<PointFeature<T> | ClusterFeature<T>>>(
  clusters1: C,
  clusters2: C,
): boolean {
  return (
    clusters1.length === clusters2.length &&
    clusters1.every((feature1, index) => {
      const feature2 = clusters2[index]
      return (
        feature1 === feature2 ||
        (feature1.type === feature2.type &&
          feature1.id === feature2.id &&
          isPointGeometryEqual(feature1.geometry, feature2.geometry))
      )
    })
  )
}

function isPointGeometryEqual<T, P extends PointFeature<T>['geometry']>(a: P, b: P): boolean {
  return a === b || (a.type === b.type && isEqual(a.coordinates, b.coordinates))
}

export function getMapState(map: RelMapRef): MapState {
  const bounds = map.getBounds().toArray().flat() as MapBounds
  const zoom = Math.round(map.getZoom())
  return { bounds, zoom }
}
