import { type MapRef, useMap } from 'react-map-gl/mapbox-legacy'
import type { GeoJsonProperties } from './types.js'
import { create, type UseSuperclusterOptions as UseSuperclusterOptions1 } from './use-supercluster.js'

export type {
  Cluster,
  ClusterFeature,
  PointClusterProperties,
  PointFeature,
  PointFeatureProperties,
  SuperclusterInstance,
} from './types.js'
export type { UseSuperclusterReturnValue } from './use-supercluster.js'

/** Options for the legacy Mapbox `useSupercluster` hook. */
export type UseSuperclusterOptions<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
> = UseSuperclusterOptions1<MapRef, TFeatureProperties, TClusterProperties>

/**
 * React hook that clusters points for the current legacy Mapbox map viewport.
 *
 * @example
 * ```tsx
 * const { clusters, supercluster } = useSupercluster(points, { radius: 60 })
 * ```
 */
export const useSupercluster = /*@__PURE__*/ create<MapRef>(useMap)
