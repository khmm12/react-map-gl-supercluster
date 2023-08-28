import { type RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { useMap } from 'react-map-gl'
import Supercluster from 'supercluster'
import { getMapState, isEqual, isClustersShallowEqual } from './utils'
import type {
  Cluster,
  PointFeature,
  PointFeatureProperties,
  SuperclusterOptions,
  SuperclusterInstance,
  GeoJsonProperties,
  RelMapRef
} from './types'

export type UseSuperclusterReturnValue<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
> = {
  clusters: Array<Cluster<TFeatureProperties, TClusterProperties>>
  supercluster: SuperclusterInstance<TFeatureProperties, TClusterProperties>
}

export type UseSuperclusterOptions<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
> = SuperclusterOptions<TFeatureProperties, TClusterProperties> & {
  mapRef?: RelMapRef | RefObject<RelMapRef> | undefined
}

export default function useReactMapGLSupercluster<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
>(
  points: Array<PointFeature<PointFeatureProperties<TFeatureProperties>>>,
  options: UseSuperclusterOptions<TFeatureProperties, TClusterProperties> = {},
): UseSuperclusterReturnValue<TFeatureProperties, TClusterProperties> {
  const map = useResolvedMapRef(options.mapRef)
  const supercluster = useSuperclusterFactory(points, options)

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

function useResolvedMapRef(outerRef?: RelMapRef | RefObject<RelMapRef | null | undefined> | undefined): RelMapRef | null {
  const maps = useMap()
  if (outerRef != null) return 'current' in outerRef ? outerRef.current ?? null : outerRef
  return maps.current ?? null
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
