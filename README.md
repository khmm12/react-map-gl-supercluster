# react-map-gl-supercluster

> The easiest way to get `react-map-gl` and `supercluster` to work together

# Highlights

- TypeScript support.
- ESM support.
- Ready for tree shaking.
- No unnecessary re-renders.

# Install

```bash
$ pnpm add react-map-gl-supercluster
# or
$ yarn add react-map-gl-supercluster
# or
$ npm install react-map-gl-supercluster
```

# Usage

Choose the `react-map-gl-supercluster` entrypoint that matches your `react-map-gl` entrypoint.

| `react-map-gl` entrypoint    | `react-map-gl-supercluster` entrypoint    |
| ---------------------------- | ----------------------------------------- |
| `react-map-gl/mapbox`        | `react-map-gl-supercluster/mapbox`        |
| `react-map-gl/maplibre`      | `react-map-gl-supercluster/maplibre`      |
| `react-map-gl/mapbox-legacy` | `react-map-gl-supercluster/mapbox-legacy` |

There is no root entrypoint in v3+ because `react-map-gl` v8 no longer has a default root export.

# Example usage

```tsx
import { type ReactElement, useMemo, useRef } from 'react'
import Map, { type MapRef, Marker } from 'react-map-gl/mapbox'
import {
  type PointClusterProperties,
  type PointFeature,
  type PointFeatureProperties,
  useSupercluster,
} from 'react-map-gl-supercluster/mapbox'

type Item = {
  id: string
  longitude: number
  latitude: number
}
type ItemPointFeatureProperties = PointFeatureProperties<{ item: Item }>
type ItemPointClusterProperties = PointClusterProperties<{ items: Item[] }>

function MyAwesomeMap({ items }: { items: Item[] }): ReactElement {
  const mapRef = useRef<MapRef | null>(null)

  const points = useMemo(() => createPoints(items), [items])

  const { supercluster, clusters } = useSupercluster(points, {
    mapRef,
    map: mapFeature,
    reduce: reduceCluster,
  })

  const expandCluster = (clusterId: number, coordinates: { longitude: number; latitude: number }) => {
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
          <Marker key={`item-${cluster.properties.item.id}`} longitude={longitude} latitude={latitude} />
        )
      })}
    </Map>
  )
}

function createPoints(items: Item[]): Array<PointFeature<ItemPointFeatureProperties>> {
  return items.map(createPoint)
}

function createPoint(item: Item): PointFeature<ItemPointFeatureProperties> {
  return {
    type: 'Feature',
    properties: { cluster: false, item },
    geometry: {
      type: 'Point',
      coordinates: [item.longitude, item.latitude],
    },
  }
}

function mapFeature(props: ItemPointFeatureProperties): ItemPointClusterProperties {
  return { items: [props.item] }
}

function reduceCluster(memo: ItemPointClusterProperties, props: ItemPointClusterProperties): void {
  memo.items = memo.items.concat(props.items)
}
```

If the hook is rendered inside `Map`, `mapRef` can be omitted. The hook resolves the current map from the matching `react-map-gl` entrypoint.

```tsx
import { type ReactElement, useMemo } from 'react'
import Map, { Marker } from 'react-map-gl/mapbox'
import { useSupercluster } from 'react-map-gl-supercluster/mapbox'

function MyAwesomeMap({ items }: { items: Item[] }): ReactElement {
  return (
    <Map>
      <Markers items={items} />
    </Map>
  )
}

type MarkersProps = {
  items: Item[]
}

function Markers(props: MarkersProps) {
  const { items } = props

  const points = useMemo(() => createPoints(items), [items])

  const { clusters } = useSupercluster(points, {
    map: mapFeature,
    reduce: reduceCluster,
  })

  return (
    <>
      {clusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates

        return cluster.properties.cluster ? (
          <ClusterMarker
            key={`cluster-${cluster.properties.cluster_id}`}
            longitude={longitude}
            latitude={latitude}
          />
        ) : (
          <Marker key={`item-${cluster.properties.item.id}`} longitude={longitude} latitude={latitude} />
        )
      })}
    </>
  )
}
```

# Example

The repository includes a Vite + MapLibre example. It uses the public MapLibre demo style, so no Mapbox token is required.

```bash
$ pnpm example
```

Open the URL printed by Vite.

# API

## `useSupercluster`

The hook can be used in a component which renders `Map` component or inside `Map` children.

### Arguments

1. `points` - GeoJSON points array. The value should be memoized.
2. `options` – various options, see below.

### Return value

Object which contains 2 fields:
- `clusters` – clusters list
- `supercluster` – supercluster instance.

## Options

| Option     | Default  | Description                                                                                                                                                                          |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| mapRef     | Optional | `MapRef` instance or React ref. Optional when the hook is rendered inside `Map`.                                                                                                      |
| minZoom    | 0        | Minimum zoom level at which clusters are generated.                                                                                                                                  |
| maxZoom    | 16       | Maximum zoom level at which clusters are generated.                                                                                                                                  |
| minPoints  | 2        | Minimum number of points to form a cluster.                                                                                                                                          |
| radius     | 40       | Cluster radius, in pixels.                                                                                                                                                           |
| extent     | 512      | Tile extent.                                                                                                                                                                         |
| nodeSize   | 64       | Size of the KD-tree leaf node.                                                                                                                                                       |
| generateId | false    | Whether to generate ids for input features.                                                                                                                                          |
| map        | Optional | A function that returns cluster properties corresponding to a single point. Should be memoized. See `supercluster` property map/reduce options.                                      |
| reduce     | Optional | A reduce function that merges properties of two clusters into one. Should be memoized. See `supercluster` property map/reduce options.                                               |

`react-map-gl-supercluster` supports all `supercluster` options, you can find more information about them [there](https://github.com/mapbox/supercluster#options).

# FAQ

## Why does it cause component re-rendering or why do I get infinite component update loop?

Please be careful with `points` and `map`/`reduce` functions. They always should be memoized.

## Does it support WebWorker?

No, the hook is running in the main thread. But probably WebWorker support will come in the future.
