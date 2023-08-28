import type Supercluster from 'supercluster'
import type { PointFeature, ClusterFeature } from 'supercluster'

export type { PointFeature, ClusterFeature }

export type GeoJsonProperties = Record<string, unknown>

export type PointFeatureProperties<TProperties extends GeoJsonProperties> = { cluster: false } & TProperties
export type PointClusterProperties<TProperties extends GeoJsonProperties> = TProperties

export type Cluster<TFeatureProperties extends GeoJsonProperties, TClusterProperties extends GeoJsonProperties> =
  | PointFeature<PointFeatureProperties<TFeatureProperties>>
  | ClusterFeature<PointClusterProperties<TClusterProperties>>

export type SuperclusterInstance<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
> = Omit<Supercluster<PointFeatureProperties<TFeatureProperties>, PointClusterProperties<TClusterProperties>>, 'load'>

export type MapFeatureToCluster<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
> = (feature: PointFeatureProperties<TFeatureProperties>) => PointClusterProperties<TClusterProperties>

export type ReduceCluster<TClusterProperties extends GeoJsonProperties> = (
  memo: PointClusterProperties<TClusterProperties>,
  feature: PointClusterProperties<TClusterProperties>,
) => void

export type SuperclusterOptions<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
> = {
  minZoom?: number
  maxZoom?: number
  radius?: number
  minPoints?: number
  extent?: number
  nodeSize?: number
  generateId?: boolean
  map?: MapFeatureToCluster<TFeatureProperties, TClusterProperties>
  reduce?: ReduceCluster<TClusterProperties>
}
type LngLatBounds = {
  toArray(): number[][]
}

type MapEventListener = (...args: any[]) => void

export type RelMapRef = {
  getBounds(): LngLatBounds
  getZoom(): number
  on(type: string, listener: MapEventListener): void
  off(type: string, listener?: MapEventListener): void
}
