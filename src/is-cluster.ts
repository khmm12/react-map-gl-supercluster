import type { Cluster, ClusterFeature, GeoJsonProperties, PointFeatureProperties } from './types.js'

/**
 * Narrows a feature returned from `useSupercluster` to a generated cluster.
 *
 * @example
 * ```tsx
 * clusters.map((feature) => (isCluster(feature) ? renderCluster(feature) : renderPoint(feature)))
 * ```
 */
export function isCluster<
  TFeatureProperties extends PointFeatureProperties,
  TClusterProperties extends GeoJsonProperties,
>(feature: Cluster<TFeatureProperties, TClusterProperties>): feature is ClusterFeature<TClusterProperties> {
  return feature.properties.cluster === true
}
