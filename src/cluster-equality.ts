import type { ClusterFeature, PointFeature } from './types.js'

export function isClustersShallowEqual<T, C extends ReadonlyArray<PointFeature<T> | ClusterFeature<T>>>(
  clusters1: C,
  clusters2: C,
): boolean {
  return (
    clusters1 === clusters2 ||
    (clusters1.length === clusters2.length &&
      clusters1.every((feature1, index) => {
        const feature2 = clusters2[index]
        if (feature2 == null) return false

        return (
          feature1 === feature2 ||
          (feature1.type === feature2.type &&
            feature1.id === feature2.id &&
            isPointGeometryEqual(feature1.geometry, feature2.geometry))
        )
      }))
  )
}

function isPointGeometryEqual<T, P extends PointFeature<T>['geometry']>(a: P, b: P): boolean {
  return a === b || (a.type === b.type && isPositionEqual(a.coordinates, b.coordinates))
}

// A GeoJSON Position is [x, y] or [x, y, z] (RFC 7946); the optional z compares via `undefined`.
function isPositionEqual(a: readonly number[], b: readonly number[]): boolean {
  return a === b || (a[0] === b[0] && a[1] === b[1] && a[2] === b[2])
}
