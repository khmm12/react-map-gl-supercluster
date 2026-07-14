import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { isClustersShallowEqual } from './cluster-equality.js'
import { getMapState, isMapStateEqual, type MapState } from './map-state.js'
import type { Cluster, GeoJsonProperties, MapLike, SuperclusterInstance } from './types.js'

type ClustersResult<TFeatureProperties extends GeoJsonProperties, TClusterProperties extends GeoJsonProperties> = {
  clusters: Array<Cluster<TFeatureProperties, TClusterProperties>>
  supercluster: SuperclusterInstance<TFeatureProperties, TClusterProperties>
}

/**
 * Subscribes to map movements and returns clusters for the current viewport.
 *
 * The map is treated as an external store and the whole result is the snapshot:
 * `clusters` and `supercluster` stay atomic, and the result keeps its identity
 * (no re-render) while the visible clusters stay shallowly equal.
 */
export function useClusters<TFeatureProperties extends GeoJsonProperties, TClusterProperties extends GeoJsonProperties>(
  map: MapLike | null,
  supercluster: SuperclusterInstance<TFeatureProperties, TClusterProperties>,
): ClustersResult<TFeatureProperties, TClusterProperties> {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (map == null) return noop
      map.on('move', onStoreChange)
      return () => {
        map.off('move', onStoreChange)
      }
    },
    [map],
  )

  const { getSnapshot, getServerSnapshot } = useMemo(
    () => createClustersSnapshot(map, supercluster),
    [map, supercluster],
  )

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

// `getSnapshot` must return the same reference until the store changes, otherwise
// `useSyncExternalStore` would re-render forever; hence the closure-level cache.
function createClustersSnapshot<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
>(map: MapLike | null, supercluster: SuperclusterInstance<TFeatureProperties, TClusterProperties>) {
  const emptyResult: ClustersResult<TFeatureProperties, TClusterProperties> = { clusters: [], supercluster }
  let mapState: MapState | null = null
  let result = emptyResult

  const getSnapshot = (): ClustersResult<TFeatureProperties, TClusterProperties> => {
    const nextMapState = map == null ? null : getMapState(map)
    if (isMapStateEqual(mapState, nextMapState)) return result

    mapState = nextMapState
    const clusters = nextMapState == null ? [] : supercluster.getClusters(nextMapState.bounds, nextMapState.zoom)

    // Clusters might stay the same while the viewport moves — keep the identity to avoid re-renders
    if (!isClustersShallowEqual(result.clusters, clusters)) {
      result = { clusters, supercluster }
    }
    return result
  }

  return { getSnapshot, getServerSnapshot: () => emptyResult }
}

function noop(): void {}
