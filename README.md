# react-map-gl-supercluster

> The easiest way to get `react-map-gl` and `supercluster` to work together

# Highlights

- TypeScript support.
- Both ESM and CJS modules support.
- Ready for tree shaking.
- No unnecessary re-renders.

# Install

```bash
$ yarn add react-map-gl-supercluster
# or
$ npm install react-map-gl-supercluster
```

# Usage

```tsx
import Map, { useMap } from 'react-map-gl'
import {
  useSupercluster,
  PointFeature,
  PointFeatureProperties,
  PointClusterProperties
} from 'react-map-gl-supercluster'

type Item = {}
type ItemPointFeatureProperties = PointFeatureProperties<{ item: Item }>
type ItemPointClusterProperties = PointClusterProperties<{ items: Item[] }>

function MyAwesomeMap(): ReactElement {
  const mapRef = useRef()

  // Points should be memoized
  const points = useMemo(() => createPoints(items), [])

  const { supercluster, clusters } = useSupercluster(points, {
    mapRef,
    map: mapFeature,
    reduce: reduceCluster
  })

  const expandCluster = (clusterId, coordinates) => {
    const zoom = supercluster.getClusterExpansionZoom(clusterId)
    mapRef.current?.easeTo({
      center: [coordinates.longitude, coordinates.latitude],
      zoom,
    })
  }

  return (
    <Map ref={mapRef}>
      {clusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates

        return cluster.properties.cluster ? (
          <ClusterMarker
            key={`cluster-${cluster.properties.cluster_id}`}
            longitude={longitude}
            latitude={latitude}
            onClick={() => expandCluster(cluster.properties.cluster_id, { longitude, latitude })}
          />
        ) : (
          <Marker key={`item-${cluster.properties.item.id}`} longitude={longitude} latitude={longitude} />
        )
      })}
    </Map>
  )
}

function createPoints(items: Item[]): Array<PointFeature<ItemPointFeatureProperties>> {
  return items.map(createPoint)
}

function createPoint(item: Item): PointFeature<ItemPointFeatureProperties> {
  const { longitude, latitude } = item

  return {
    type: 'Feature',
    properties: { cluster: false, item },
    geometry: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
  }
}

// It creates cluster properties from feature properties.
function mapFeature(props: ItemPointFeatureProperties): ItemPointClusterProperties {
  return { items: [props.item] }
}

// It merges clusters properties. Yes, it's simply mutates.
function reduceCluster(memo: ItemPointClusterProperties, props: ItemPointClusterProperties): void {
  memo.items = memo.items.concat(props.items)
}
```

Alternatively you can use the hook inside `Map`.

```tsx
import Map, { useMap } from 'react-map-gl'
import { useSupercluster } from 'react-map-gl-supercluster'

function MyAwesomeMap(): ReactElement {
  return (
    <Map>
      <Markers items={items} />
    </Map>
  )
}

type MarkersProps = {
  items: Item[]
}

function Markers(props: MarkersProps): ReactElement {
  const { items } = props

  const map = useMap().current

  // Points should be memoized
  const points = useMemo(() => createPoints(items), [items])

  const { supercluster, clusters } = useSupercluster(points, {
    map: mapFeature,
    reduce: reduceCluster
  })

  const expandCluster = (clusterId, coordinates) => {
    const zoom = supercluster.getClusterExpansionZoom(clusterId)
    map?.easeTo({
      center: [coordinates.longitude, coordinates.latitude],
      zoom,
    })
  }

  return (
    <>
      {clusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates

        return cluster.properties.cluster ? (
          <ClusterMarker
            key={`cluster-${cluster.properties.cluster_id}`}
            longitude={longitude}
            latitude={latitude}
            onClick={() => expandCluster(cluster.properties.cluster_id, { longitude, latitude })}
          />
        ) : (
          <Marker key={`item-${cluster.properties.item.id}`} longitude={longitude} latitude={longitude} />
        )
      })}
    </>
  )
}
```

# API

## `useSupercluster`

The hook can be used in a component which renders `Map` component or inside `Map` children.

### Arguments

1. `points` - GeoJSON points array. The value should be memoized.
2. `options` – various options, see bellow.

### Return value

Object which contains 2 fields:
- `clusters` – clusters list
- `supercluster` – supercluster instance.

## Options

| Option    | Default  | Description                                                                                                                                                                                   |
| --------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mapRef    | Optional | Reference to `react-map-gl` instance.                                                                                                                                                         |
| minZoom   | 0        | Minimum zoom level at which clusters are generated.                                                                                                                                           |
| maxZoom   | 16       | Maximum zoom level at which clusters are generated.                                                                                                                                           |
| minPoints | 2        | Minimum number of points to form a cluster.                                                                                                                                                   |
| radius    | 40       | Cluster radius, in pixels.                                                                                                                                                                    |
| map       | Optional | A function that returns cluster properties corresponding to a single point. Should be memoized. [See](https://github.com/mapbox/supercluster/blob/main/README.md#property-mapreduce-options). |
| reduce    | Optional | A reduce function that merges properties of two clusters into one. Should be memoized. [See](https://github.com/mapbox/supercluster/blob/main/README.md#property-mapreduce-options).          |

`react-map-gl-supercluster` supports all `supercluster` options, you can find more information about them [there](https://github.com/mapbox/supercluster#options).

# FAQ

## Does it support react-map-gl v5/v6?

No, it doesn't.

## Why does it cause component re-rendering or why do I get infinite component update loop?

Please be careful with `points` and `map`/`reduce` functions. They always should be memoized.

## Does it support WebWorker?

No, the hook is running in the main thread. But probably WebWorker support will come in the future.
