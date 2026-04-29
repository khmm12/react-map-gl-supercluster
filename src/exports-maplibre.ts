import { type MapRef, useMap } from 'react-map-gl/maplibre'
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

export type UseSuperclusterOptions<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
> = UseSuperclusterOptions1<MapRef, TFeatureProperties, TClusterProperties>

export const useSupercluster = /*@__PURE__*/ create<MapRef>(useMap)
