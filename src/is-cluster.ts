import type { Cluster, ClusterFeature, GeoJsonProperties, PointClusterProperties } from './types.js'

/**
 * Narrows a feature returned from `useSupercluster` to a generated cluster.
 *
 * @example
 * ```tsx
 * clusters.map((feature) => (isCluster(feature) ? renderCluster(feature) : renderPoint(feature)))
 * ```
 */
export function isCluster<TFeatureProperties extends GeoJsonProperties, TClusterProperties extends GeoJsonProperties>(
  feature: Cluster<TFeatureProperties, TClusterProperties>,
): feature is ClusterFeature<PointClusterProperties<TClusterProperties>> {
  return feature.properties.cluster === true
}
