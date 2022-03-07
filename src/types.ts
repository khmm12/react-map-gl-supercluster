import type Supercluster from 'supercluster'
import type { PointFeature, ClusterFeature } from 'supercluster'

export type { PointFeature, ClusterFeature }

export type PointFeatureProperties<TProperties> = { cluster: false } & TProperties
export type PointClusterProperties<TProperties> = TProperties

export type Cluster<TFeatureProperties, TClusterProperties> =
  | PointFeature<PointFeatureProperties<TFeatureProperties>>
  | ClusterFeature<PointClusterProperties<TClusterProperties>>

export type SuperclusterInstance<TFeatureProperties, TClusterProperties> = Omit<Supercluster<
  PointFeatureProperties<TFeatureProperties>,
  PointClusterProperties<TClusterProperties>
>, 'load'>

export type MapFeatureToCluster<TFeatureProperties, TClusterProperties> = (
  feature: PointFeatureProperties<TFeatureProperties>
) => PointClusterProperties<TClusterProperties>

export type ReduceCluster<TClusterProperties> = (
  memo: PointClusterProperties<TClusterProperties>,
  feature: PointClusterProperties<TClusterProperties>
) => void

export type SuperclusterOptions<TFeatureProperties, TClusterProperties> = {
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
