import { useEffect, useState } from 'react'
import { isClustersShallowEqual } from './cluster-equality.js'
import { getMapState, isMapStateEqual, type MapState } from './map-state.js'
import type { Cluster, GeoJsonProperties, MapLike, SuperclusterInstance } from './types.js'

type ClustersResult<TFeatureProperties extends GeoJsonProperties, TClusterProperties extends GeoJsonProperties> = {
  clusters: Array<Cluster<TFeatureProperties, TClusterProperties>>
  supercluster: SuperclusterInstance<TFeatureProperties, TClusterProperties>
}

type ClustersState<TFeatureProperties extends GeoJsonProperties, TClusterProperties extends GeoJsonProperties> = {
  mapState: MapState | null
  result: ClustersResult<TFeatureProperties, TClusterProperties>
}

/**
 * Subscribes to map movements and returns clusters for the current viewport.
 *
 * `clusters` and `supercluster` update atomically so consumers never see clusters
 * computed by a different index than the one returned alongside them.
 */
export function useClusters<TFeatureProperties extends GeoJsonProperties, TClusterProperties extends GeoJsonProperties>(
  map: MapLike | null,
  supercluster: SuperclusterInstance<TFeatureProperties, TClusterProperties>,
): ClustersResult<TFeatureProperties, TClusterProperties> {
  const [state, setState] = useState(() => nextClustersState(null, supercluster, map))

  useEffect(() => {
    const update = (): void => {
      setState((current) => nextClustersState(current, supercluster, map))
    }

    // The map state might have changed between render and subscription
    update()

    if (map == null) return
    map.on('move', update)
    return () => {
      map.off('move', update)
    }
  }, [map, supercluster])

  return state.result
}

function nextClustersState<TFeatureProperties extends GeoJsonProperties, TClusterProperties extends GeoJsonProperties>(
  current: ClustersState<TFeatureProperties, TClusterProperties> | null,
  supercluster: SuperclusterInstance<TFeatureProperties, TClusterProperties>,
  map: MapLike | null,
): ClustersState<TFeatureProperties, TClusterProperties> {
  const mapState = map == null ? null : getMapState(map)

  // Map or its bounds are unavailable, no clusters
  if (mapState == null) {
    if (
      current != null &&
      current.result.supercluster === supercluster &&
      current.mapState == null &&
      current.result.clusters.length === 0
    ) {
      return current
    }
    return { mapState: null, result: { clusters: [], supercluster } }
  }

  // Supercluster has changed, always re-ask clusters
  if (current == null || current.result.supercluster !== supercluster) {
    return { mapState, result: { clusters: supercluster.getClusters(mapState.bounds, mapState.zoom), supercluster } }
  }

  if (isMapStateEqual(current.mapState, mapState)) return current

  // Map state has changed, but visible clusters might stay the same — avoid redundant re-renders
  const clusters = supercluster.getClusters(mapState.bounds, mapState.zoom)
  return isClustersShallowEqual(current.result.clusters, clusters)
    ? current
    : { mapState, result: { clusters, supercluster } }
}
