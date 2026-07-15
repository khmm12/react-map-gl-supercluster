import { type MapRef, useMap } from 'react-map-gl/maplibre'
import type { GeoJsonProperties } from './types.js'
import { type UseSuperclusterOptions as BaseUseSuperclusterOptions, create } from './use-supercluster.js'

export { isCluster } from './is-cluster.js'
export type {
  Cluster,
  ClusterFeature,
  PointClusterProperties,
  PointFeature,
  PointFeatureProperties,
  SuperclusterInstance,
} from './types.js'
export type { UseSuperclusterReturnValue } from './use-supercluster.js'

/** Options for the MapLibre `useSupercluster` hook. */
export type UseSuperclusterOptions<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
> = BaseUseSuperclusterOptions<MapRef, TFeatureProperties, TClusterProperties>

/**
 * React hook that clusters points for the current MapLibre map viewport.
 *
 * @example
 * ```tsx
 * const { clusters, supercluster } = useSupercluster(points, { radius: 60 })
 * ```
 */
export const useSupercluster = /*@__PURE__*/ create<MapRef>(useMap)
