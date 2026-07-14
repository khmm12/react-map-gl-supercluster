import type { RefObject } from 'react'
import type {
  Cluster,
  GeoJsonProperties,
  MapLike,
  PointFeature,
  PointFeatureProperties,
  SuperclusterInstance,
  SuperclusterOptions,
} from './types.js'
import { useClusters } from './use-clusters.js'
import { useSuperclusterIndex } from './use-supercluster-index.js'

/** Values returned by `useSupercluster`. */
export type UseSuperclusterReturnValue<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
> = {
  /** Clusters for the current map bounds and rounded zoom. */
  clusters: Array<Cluster<TFeatureProperties, TClusterProperties>>
  /** Loaded index for advanced `supercluster` queries. */
  supercluster: SuperclusterInstance<TFeatureProperties, TClusterProperties>
}

/**
 * Hook options.
 *
 * Pass `mapRef` when the map is outside `react-map-gl` context or when several maps are mounted.
 */
export type UseSuperclusterOptions<
  MapRef extends MapLike,
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
> = SuperclusterOptions<TFeatureProperties, TClusterProperties> & {
  mapRef?: MapRef | RefObject<MapRef | null | undefined> | undefined | null
  /**
   * Extra viewport fraction (per side) included when querying clusters.
   *
   * Markers near the edges don't pop in and out, and small pans inside the
   * padded area skip recomputation entirely. The queried area grows as
   * `(1 + 2 * padding)²`, so large values render more off-screen markers.
   *
   * @default 0
   */
  boundsPadding?: number
}

type UseMap<T> = () => {
  [id: string]: T | undefined
  current?: T
}

/**
 * Creates a renderer-specific `useSupercluster` hook.
 */
export function create<MapRef extends MapLike>(useMap: UseMap<MapRef>) {
  return function useSupercluster<
    TFeatureProperties extends GeoJsonProperties,
    TClusterProperties extends GeoJsonProperties,
  >(
    points: Array<PointFeature<PointFeatureProperties<TFeatureProperties>>>,
    options: UseSuperclusterOptions<MapRef, TFeatureProperties, TClusterProperties> = {},
  ): UseSuperclusterReturnValue<TFeatureProperties, TClusterProperties> {
    const map = useResolvedMap(options.mapRef)
    const supercluster = useSuperclusterIndex(points, options)
    return useClusters(map, supercluster, options.boundsPadding)
  }

  function useResolvedMap(mapRef?: MapRef | RefObject<MapRef | null | undefined> | null | undefined): MapRef | null {
    const maps = useMap()
    if (mapRef != null) return 'current' in mapRef ? (mapRef.current ?? null) : mapRef
    return maps.current ?? null
  }
}
