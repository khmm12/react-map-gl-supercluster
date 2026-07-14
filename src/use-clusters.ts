import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { isClustersShallowEqual } from './cluster-equality.js'
import {
  containsBounds,
  expandBounds,
  getMapState,
  isMapStateEqual,
  type MapBounds,
  type MapState,
} from './map-state.js'
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
 *
 * With `boundsPadding > 0` clusters are queried for an expanded viewport and
 * reused while the map keeps moving inside it at the same rounded zoom.
 */
export function useClusters<TFeatureProperties extends GeoJsonProperties, TClusterProperties extends GeoJsonProperties>(
  map: MapLike | null,
  supercluster: SuperclusterInstance<TFeatureProperties, TClusterProperties>,
  boundsPadding = 0,
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
    () => createClustersSnapshot(map, supercluster, boundsPadding),
    [map, supercluster, boundsPadding],
  )

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

// `getSnapshot` must return the same reference until the store changes, otherwise
// `useSyncExternalStore` would re-render forever; hence the closure-level cache.
function createClustersSnapshot<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
>(
  map: MapLike | null,
  supercluster: SuperclusterInstance<TFeatureProperties, TClusterProperties>,
  boundsPadding: number,
) {
  const emptyResult: ClustersResult<TFeatureProperties, TClusterProperties> = { clusters: [], supercluster }
  const queriedArea = createQueriedArea(boundsPadding)
  let mapState: MapState | null = null
  let result = emptyResult

  const getSnapshot = (): ClustersResult<TFeatureProperties, TClusterProperties> => {
    const nextMapState = map == null ? null : getMapState(map)
    if (isMapStateEqual(mapState, nextMapState)) return result
    mapState = nextMapState

    // The viewport is still inside the padded area at the same zoom — reuse the queried clusters
    if (nextMapState != null && queriedArea.covers(nextMapState)) return result

    let clusters: Array<Cluster<TFeatureProperties, TClusterProperties>>
    if (nextMapState == null) {
      queriedArea.reset()
      clusters = []
    } else {
      clusters = supercluster.getClusters(queriedArea.update(nextMapState), nextMapState.zoom)
    }

    // Clusters might stay the same while the viewport moves — keep the identity to avoid re-renders
    if (!isClustersShallowEqual(result.clusters, clusters)) {
      result = { clusters, supercluster }
    }
    return result
  }

  return { getSnapshot, getServerSnapshot: () => emptyResult }
}

// Remembers the last queried (padded) area so movements inside it can reuse the
// previous result instead of querying the index again.
function createQueriedArea(boundsPadding: number) {
  let queried: { bounds: MapBounds; zoom: number } | null = null

  const covers = (mapState: MapState): boolean =>
    boundsPadding > 0 &&
    queried != null &&
    queried.zoom === mapState.zoom &&
    containsBounds(queried.bounds, mapState.bounds)

  const update = (mapState: MapState): MapBounds => {
    const bounds = boundsPadding > 0 ? expandBounds(mapState.bounds, boundsPadding) : mapState.bounds
    queried = { bounds, zoom: mapState.zoom }
    return bounds
  }

  const reset = (): void => {
    queried = null
  }

  return { covers, update, reset }
}

function noop(): void {}
