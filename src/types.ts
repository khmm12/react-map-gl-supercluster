import type Supercluster from 'supercluster'
import type { ClusterFeature, PointFeature } from 'supercluster'

export type { ClusterFeature, PointFeature }

/** Plain GeoJSON properties object used by points and clusters. */
export type GeoJsonProperties = Record<string, unknown>

/**
 * Point properties accepted by `useSupercluster`.
 *
 * The `cluster` key is reserved: generated clusters use it as a discriminator,
 * so input points must not define it. Use `isCluster` to tell features apart.
 *
 * @example
 * ```ts
 * type CityPoint = { name: string; population: number } // satisfies PointFeatureProperties
 * ```
 */
export type PointFeatureProperties = GeoJsonProperties & { cluster?: never }

/** A feature returned from `useSupercluster`: either an original point or a generated cluster. */
export type Cluster<TFeatureProperties extends GeoJsonProperties, TClusterProperties extends GeoJsonProperties> =
  | PointFeature<TFeatureProperties>
  | ClusterFeature<TClusterProperties>

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
> = Omit<Supercluster<TFeatureProperties, TClusterProperties>, 'load'>

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
> = (feature: TFeatureProperties) => TClusterProperties

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
  memo: TClusterProperties,
  feature: TClusterProperties,
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

/** Minimal structural contract satisfied by every `react-map-gl` `MapRef` flavor. */
export type MapLike = {
  getBounds(): LngLatBounds | null
  getZoom(): number
  on(type: string, listener: MapEventListener): void
  off(type: string, listener?: MapEventListener): void
}
