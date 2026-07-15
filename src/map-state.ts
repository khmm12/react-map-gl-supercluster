import type { MapLike } from './types.js'

type MapBounds = [number, number, number, number]

/** Snapshot of the map viewport used to query clusters. */
export type MapState = {
  bounds: MapBounds
  zoom: number
}

export function getMapState(map: MapLike): MapState | null {
  const mapBounds = map.getBounds()
  if (mapBounds == null) return null

  const bounds = mapBounds.toArray().flat() as MapBounds
  const zoom = Math.round(map.getZoom())
  return { bounds, zoom }
}

export function isMapStateEqual(a: MapState | null, b: MapState | null): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  return a.zoom === b.zoom && isBoundsEqual(a.bounds, b.bounds)
}

function isBoundsEqual(a: MapBounds, b: MapBounds): boolean {
  return a === b || (a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3])
}
