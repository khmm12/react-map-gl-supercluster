import type Supercluster from 'supercluster'
import type { ClusterFeature, PointFeature } from 'supercluster'

export type { ClusterFeature, PointFeature }

/** Plain GeoJSON properties object used by points and clusters. */
export type GeoJsonProperties = Record<string, unknown>

/**
 * Point properties accepted by `useSupercluster`.
 *
 * @example
 * ```ts
 * type CityPoint = PointFeatureProperties<{ name: string; population: number }>
 * ```
 */
export type PointFeatureProperties<TProperties extends GeoJsonProperties> = { cluster: false } & TProperties

/**
 * User-defined aggregate properties for generated cluster features.
 *
 * @example
 * ```ts
 * type CityCluster = PointClusterProperties<{ population: number }>
 * ```
 */
export type PointClusterProperties<TProperties extends GeoJsonProperties> = TProperties

/** A feature returned from `useSupercluster`: either an original point or a generated cluster. */
export type Cluster<TFeatureProperties extends GeoJsonProperties, TClusterProperties extends GeoJsonProperties> =
  | PointFeature<PointFeatureProperties<TFeatureProperties>>
  | ClusterFeature<PointClusterProperties<TClusterProperties>>

/**
 * Loaded `supercluster` instance returned by the hook.
 *
 * Use it for advanced reads such as leaves, children, and expansion zoom.
 *
 * @example
 * ```ts
 * const zoom = supercluster.getClusterExpansionZoom(clusterId)
 * ```
 */
export type SuperclusterInstance<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
> = Omit<Supercluster<PointFeatureProperties<TFeatureProperties>, PointClusterProperties<TClusterProperties>>, 'load'>

/**
 * Maps point properties to the aggregate properties used by clusters.
 *
 * Mirrors `supercluster`'s `map` option.
 *
 * @example
 * ```ts
 * type City = { name: string; population: number }
 * type CityCluster = { population: number }
 *
 * const map: MapFeatureToCluster<City, CityCluster> = (point) => ({
 *   population: point.population,
 * })
 * ```
 */
export type MapFeatureToCluster<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
> = (feature: PointFeatureProperties<TFeatureProperties>) => PointClusterProperties<TClusterProperties>

/**
 * Merges aggregate properties while building clusters.
 *
 * Mirrors `supercluster`'s `reduce` option.
 *
 * @example
 * ```ts
 * const reduce: ReduceCluster<CityCluster> = (memo, point) => {
 *   memo.population += point.population
 * }
 * ```
 */
export type ReduceCluster<TClusterProperties extends GeoJsonProperties> = (
  memo: PointClusterProperties<TClusterProperties>,
  feature: PointClusterProperties<TClusterProperties>,
) => void

/**
 * Options passed to the underlying `supercluster` index.
 *
 * Function options should be stable between renders.
 *
 * @example
 * ```ts
 * const options = {
 *   radius: 60,
 *   maxZoom: 18,
 *   map,
 *   reduce,
 * }
 * ```
 */
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

type MapEventListener = (...args: unknown[]) => void

export type RelMapRef = {
  getBounds(): LngLatBounds | null
  getZoom(): number
  on(type: string, listener: MapEventListener): void
  off(type: string, listener?: MapEventListener): void
}
