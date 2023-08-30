import { useMap, type MapRef } from 'react-map-gl/maplibre'
import { create, type UseSuperclusterOptions as UseSuperclusterOptions1 } from './use-supercluster.js'
import { GeoJsonProperties } from './types.js'

export type { UseSuperclusterReturnValue } from './use-supercluster.js'

export type {
  Cluster,
  SuperclusterInstance,
  PointFeature,
  ClusterFeature,
  PointFeatureProperties,
  PointClusterProperties,
} from './types.js'

export type UseSuperclusterOptions<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
> = UseSuperclusterOptions1<MapRef, TFeatureProperties, TClusterProperties>

export const useSupercluster = /*@__PURE__*/ create<MapRef>(useMap)
