import { DEV } from 'esm-env'
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react'
import Supercluster from 'supercluster'
import type {
  Cluster,
  GeoJsonProperties,
  PointFeature,
  PointFeatureProperties,
  RelMapRef,
  SuperclusterInstance,
  SuperclusterOptions,
} from './types.js'
import { getMapState, isClustersShallowEqual, isEqual } from './utils.js'

const UNSTABLE_FUNCTION_OPTION_WARNING_THRESHOLD = 3

/** Values returned by `useSupercluster`. */
export type UseSuperclusterReturnValue<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
> = {
  /** Clusters for the current map bounds and rounded zoom. */
  clusters: Array<Cluster<TFeatureProperties, TClusterProperties>>
  /** Loaded index for advanced `supercluster` queries. */
  supercluster: SuperclusterInstance<TFeatureProperties, TClusterProperties>
}

/**
 * Hook options.
 *
 * Pass `mapRef` when the map is outside `react-map-gl` context or when several maps are mounted.
 */
export type UseSuperclusterOptions<
  MapRef extends RelMapRef,
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
> = SuperclusterOptions<TFeatureProperties, TClusterProperties> & {
  mapRef?: MapRef | RefObject<MapRef | null | undefined> | undefined | null
}

type UseMap<T> = () => {
  [id: string]: T | undefined
  current?: T
}

/**
 * Creates a renderer-specific `useSupercluster` hook.
 */
export function create<MapRef extends RelMapRef>(useMap: UseMap<MapRef>) {
  const useSupercluster = DEV ? useSuperclusterFactoryWithWarnings : useSuperclusterFactory

  return function useReactMapGLSupercluster<
    TFeatureProperties extends GeoJsonProperties,
    TClusterProperties extends GeoJsonProperties,
  >(
    points: Array<PointFeature<PointFeatureProperties<TFeatureProperties>>>,
    options: UseSuperclusterOptions<MapRef, TFeatureProperties, TClusterProperties> = {},
  ): UseSuperclusterReturnValue<TFeatureProperties, TClusterProperties> {
    const map = useResolvedMapRef(options.mapRef)
    const supercluster = useSupercluster(points, options)

    const [state, setState] = useState(() => {
      const mapState = map != null ? getMapState(map) : null
      return {
        supercluster,
        mapState,
        clusters: mapState != null ? supercluster.getClusters(mapState.bounds, mapState.zoom) : [],
      }
    })

    useEffect(() => {
      // Map is not available yet, no clusters
      if (map == null) {
        setState({ supercluster, clusters: [], mapState: null })
        return
      }

      const update = (): void => {
        setState((current) => {
          const nextMapState = getMapState(map)

          if (nextMapState == null) {
            if (current.mapState != null || current.clusters.length > 0 || current.supercluster !== supercluster) {
              return { supercluster, mapState: null, clusters: [] }
            }

            return current
          }

          // Supercluster has changed, always re-ask clusters
          if (current.supercluster !== supercluster) {
            const nextClusters = supercluster.getClusters(nextMapState.bounds, nextMapState.zoom)
            return { supercluster, mapState: nextMapState, clusters: nextClusters }
          }

          // Map state has changed, but points stay the same
          if (!isEqual(current.mapState, nextMapState)) {
            const nextClusters = supercluster.getClusters(nextMapState.bounds, nextMapState.zoom)

            // Clusters might stay the same, avoid redundant re-renders
            if (!isClustersShallowEqual(current.clusters, nextClusters))
              return { supercluster, mapState: nextMapState, clusters: nextClusters }
          }

          return current
        })
      }

      // Perform update because the map state might have changed, then subscribe to interactions
      update()
      map.on('move', update)
      return () => {
        map.off('move', update)
      }
    }, [map, supercluster])

    return state
  }

  function useResolvedMapRef(
    outerRef?: MapRef | RefObject<MapRef | null | undefined> | null | undefined,
  ): MapRef | null {
    const maps = useMap()
    if (outerRef != null) return 'current' in outerRef ? (outerRef.current ?? null) : outerRef
    return maps.current ?? null
  }
}

function useSuperclusterFactoryWithWarnings<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
>(
  points: Array<PointFeature<PointFeatureProperties<TFeatureProperties>>>,
  options: SuperclusterOptions<TFeatureProperties, TClusterProperties>,
) {
  useWarnIfFunctionOptionChanges(options)
  return useSuperclusterFactory(points, options)
}

function useSuperclusterFactory<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
>(
  points: Array<PointFeature<PointFeatureProperties<TFeatureProperties>>>,
  _options: SuperclusterOptions<TFeatureProperties, TClusterProperties>,
) {
  // Memoize options
  const nextOptions = pickOptions(_options)
  const optionsRef = useRef(nextOptions)
  if (!isEqual(optionsRef.current, nextOptions)) optionsRef.current = nextOptions
  const options = optionsRef.current

  return useMemo(() => {
    const instance = new Supercluster(options)
    instance.load(points)
    return instance
  }, [points, options])
}

function pickOptions<TFeatureProperties extends GeoJsonProperties, TClusterProperties extends GeoJsonProperties>(
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

function useWarnIfFunctionOptionChanges<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
>(options: SuperclusterOptions<TFeatureProperties, TClusterProperties>): void {
  const unstableOptionsRef = useRef({
    changesCount: { map: 0, reduce: 0 },
    options,
    optionValues: { map: options.map, reduce: options.reduce },
    warned: { map: false, reduce: false },
  })

  const current = unstableOptionsRef.current
  if (current.options === options) {
    return
  }

  current.changesCount = {
    map: getNextFunctionOptionChangesCount(current.optionValues.map, options.map, current.changesCount.map),
    reduce: getNextFunctionOptionChangesCount(current.optionValues.reduce, options.reduce, current.changesCount.reduce),
  }

  warnIfFunctionOptionChanged('map', current.changesCount.map, current.warned.map)
  warnIfFunctionOptionChanged('reduce', current.changesCount.reduce, current.warned.reduce)

  current.warned = {
    map: current.warned.map || current.changesCount.map >= UNSTABLE_FUNCTION_OPTION_WARNING_THRESHOLD,
    reduce: current.warned.reduce || current.changesCount.reduce >= UNSTABLE_FUNCTION_OPTION_WARNING_THRESHOLD,
  }
  current.optionValues = { map: options.map, reduce: options.reduce }
  current.options = options
}

function getNextFunctionOptionChangesCount(prev: unknown, next: unknown, currentCount: number): number {
  if (prev === next || typeof prev !== 'function' || typeof next !== 'function') return 0
  return currentCount + 1
}

function warnIfFunctionOptionChanged(name: 'map' | 'reduce', changesCount: number, alreadyWarned: boolean): void {
  if (changesCount < UNSTABLE_FUNCTION_OPTION_WARNING_THRESHOLD || alreadyWarned) return

  console.warn(
    `react-map-gl-supercluster: option "${name}" changed between renders. ` +
      'This recreates the Supercluster index. Wrap it in useCallback or define it outside the component.',
  )
}
