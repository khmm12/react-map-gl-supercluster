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
  /** Clusters for the current — optionally padded — map bounds and rounded zoom. */
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
  mapRef?: MapRef | undefined | null
  /**
   * Extra viewport fraction (per side) included when querying clusters.
   *
   * Markers near the edges don't pop in and out, and pans inside the padded
   * area at the same rounded zoom skip recomputation entirely. The queried
   * area grows as `(1 + 2 * padding)²`, so large values render more
   * off-screen markers. Non-positive values disable padding.
   *
   * @default 0
   */
  boundsPadding?: number | undefined
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
    TFeatureProperties extends PointFeatureProperties,
    TClusterProperties extends GeoJsonProperties,
  >(
    points: Array<PointFeature<TFeatureProperties>>,
    options: UseSuperclusterOptions<MapRef, TFeatureProperties, TClusterProperties> = {},
  ): UseSuperclusterReturnValue<TFeatureProperties, TClusterProperties> {
    const map = useResolvedMap(options.mapRef)
    const supercluster = useSuperclusterIndex(points, options)
    return useClusters(map, supercluster, options.boundsPadding)
  }

  function useResolvedMap(mapRef?: MapRef | null | undefined): MapRef | null {
    const maps = useMap()
    return mapRef ?? maps.current ?? null
  }
}
