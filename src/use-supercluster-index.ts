import { DEV } from 'esm-env'
import { useMemo, useRef } from 'react'
import Supercluster from 'supercluster'
import type { GeoJsonProperties, PointFeature, SuperclusterInstance, SuperclusterOptions } from './types.js'
import { useWarnOnReservedClusterKey } from './warn-reserved-cluster-key.js'
import { useWarnOnUnstableFunctionOptions } from './warn-unstable-options.js'

type UseSuperclusterIndex = <
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
>(
  points: Array<PointFeature<TFeatureProperties>>,
  options: SuperclusterOptions<TFeatureProperties, TClusterProperties>,
) => SuperclusterInstance<TFeatureProperties, TClusterProperties>

/** Builds a loaded `supercluster` index, memoized by shallow points equality and structurally equal options. */
export const useSuperclusterIndex: UseSuperclusterIndex = DEV
  ? useSuperclusterIndexWithWarnings
  : useSuperclusterIndexImpl

function useSuperclusterIndexWithWarnings<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
>(
  points: Array<PointFeature<TFeatureProperties>>,
  options: SuperclusterOptions<TFeatureProperties, TClusterProperties>,
) {
  useWarnOnReservedClusterKey(points)
  useWarnOnUnstableFunctionOptions(options)
  return useSuperclusterIndexImpl(points, options)
}

function useSuperclusterIndexImpl<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
>(
  outerPoints: Array<PointFeature<TFeatureProperties>>,
  outerOptions: SuperclusterOptions<TFeatureProperties, TClusterProperties>,
) {
  const nextOptions = normalizeOptions(outerOptions)
  const optionsRef = useRef(nextOptions)
  if (!isOptionsEqual(optionsRef.current, nextOptions)) optionsRef.current = nextOptions
  const options = optionsRef.current

  // A new array with the same features must not trigger an O(n log n) index rebuild
  const pointsRef = useRef(outerPoints)
  if (!isPointsShallowEqual(pointsRef.current, outerPoints)) pointsRef.current = outerPoints
  const points = pointsRef.current

  return useMemo(() => {
    const index = new Supercluster(options)
    index.load(points)
    return index
  }, [points, options])
}

function isPointsShallowEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function normalizeOptions<TFeatureProperties extends GeoJsonProperties, TClusterProperties extends GeoJsonProperties>(
  options: SuperclusterOptions<TFeatureProperties, TClusterProperties>,
) {
  const {
    minZoom = 0,
    maxZoom = 16,
    radius = 40,
    minPoints = 2,
    extent = 512,
    nodeSize = 64,
    generateId = false,
    map,
    reduce,
  } = options
  return { minZoom, maxZoom, radius, minPoints, extent, nodeSize, generateId, map, reduce }
}

type NormalizedOptions<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
> = ReturnType<typeof normalizeOptions<TFeatureProperties, TClusterProperties>>

// Keep the compared fields in sync with `normalizeOptions`; `map`/`reduce` compare by identity.
function isOptionsEqual<TFeatureProperties extends GeoJsonProperties, TClusterProperties extends GeoJsonProperties>(
  a: NormalizedOptions<TFeatureProperties, TClusterProperties>,
  b: NormalizedOptions<TFeatureProperties, TClusterProperties>,
): boolean {
  return (
    a === b ||
    (a.minZoom === b.minZoom &&
      a.maxZoom === b.maxZoom &&
      a.radius === b.radius &&
      a.minPoints === b.minPoints &&
      a.extent === b.extent &&
      a.nodeSize === b.nodeSize &&
      a.generateId === b.generateId &&
      a.map === b.map &&
      a.reduce === b.reduce)
  )
}
