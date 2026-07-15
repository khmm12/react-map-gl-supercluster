import { useRef } from 'react'
import type { GeoJsonProperties, PointFeature } from './types.js'

/**
 * Dev-only. Warns once when input points carry the reserved `cluster` property
 * key — the types forbid it, but it slips through widened types and makes
 * `isCluster` misreport such points as clusters.
 */
export function useWarnOnReservedClusterKey(points: Array<PointFeature<GeoJsonProperties>>): void {
  const stateRef = useRef<{ lastPoints: Array<PointFeature<GeoJsonProperties>> | null; warned: boolean }>({
    lastPoints: null,
    warned: false,
  })

  const state = stateRef.current
  // Scan only new arrays, and stop scanning entirely once warned
  if (state.warned || state.lastPoints === points) return

  state.lastPoints = points
  if (points.some((point) => 'cluster' in point.properties)) {
    state.warned = true
    console.warn(
      'react-map-gl-supercluster: point properties must not define "cluster". ' +
        'The key is reserved for generated clusters and makes isCluster misreport such points.',
    )
  }
}
