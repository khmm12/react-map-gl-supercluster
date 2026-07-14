import type { ClusterFeature, PointFeature, RelMapRef } from './types.js'

type MapBounds = [number, number, number, number]

export type MapState = {
  bounds: MapBounds
  zoom: number
}

export function isMapStateEqual(a: MapState | null, b: MapState | null): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  return a.zoom === b.zoom && isBoundsEqual(a.bounds, b.bounds)
}

function isBoundsEqual(a: MapBounds, b: MapBounds): boolean {
  return a === b || (a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3])
}

export function isClustersShallowEqual<T, C extends ReadonlyArray<PointFeature<T> | ClusterFeature<T>>>(
  clusters1: C,
  clusters2: C,
): boolean {
  return (
    clusters1.length === clusters2.length &&
    clusters1.every((feature1, index) => {
      const feature2 = clusters2[index]
      if (feature2 == null) return false

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
  return a === b || (a.type === b.type && isPositionEqual(a.coordinates, b.coordinates))
}

// A GeoJSON Position is [x, y] or [x, y, z] (RFC 7946); the optional z compares via `undefined`.
function isPositionEqual(a: readonly number[], b: readonly number[]): boolean {
  return a === b || (a[0] === b[0] && a[1] === b[1] && a[2] === b[2])
}

export function getMapState(map: RelMapRef): MapState | null {
  const mapBounds = map.getBounds()
  if (mapBounds == null) return null

  const bounds = mapBounds.toArray().flat() as MapBounds
  const zoom = Math.round(map.getZoom())
  return { bounds, zoom }
}
