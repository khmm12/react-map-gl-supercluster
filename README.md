# react-map-gl-supercluster

> React hook that clusters map markers with [supercluster](https://github.com/mapbox/supercluster) for [react-map-gl](https://visgl.github.io/react-map-gl/)

[![npm version](https://img.shields.io/npm/v/react-map-gl-supercluster)](https://www.npmjs.com/package/react-map-gl-supercluster)
[![CI](https://github.com/khmm12/react-map-gl-supercluster/actions/workflows/ci.yml/badge.svg)](https://github.com/khmm12/react-map-gl-supercluster/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/react-map-gl-supercluster)](./LICENSE)

## Highlights

- TypeScript support.
- ESM support.
- Ready for tree shaking.
- No unnecessary re-renders.
- SSR-friendly.

## Install

```bash
pnpm add react-map-gl-supercluster
# or
yarn add react-map-gl-supercluster
# or
npm install react-map-gl-supercluster
```

## Requirements

| react-map-gl-supercluster                                             | react-map-gl | React  | Status      |
| --------------------------------------------------------------------- | ------------ | ------ | ----------- |
| 4.x                                                                    | ^8           | ≥ 18   | Active      |
| [3.x](https://github.com/khmm12/react-map-gl-supercluster/tree/v3.x)   | ^8           | ≥ 16.8 | Maintenance |

## Usage

Choose the `react-map-gl-supercluster` entrypoint that matches your `react-map-gl` entrypoint.

| `react-map-gl` entrypoint    | `react-map-gl-supercluster` entrypoint    |
| ---------------------------- | ----------------------------------------- |
| `react-map-gl/mapbox`        | `react-map-gl-supercluster/mapbox`        |
| `react-map-gl/maplibre`      | `react-map-gl-supercluster/maplibre`      |
| `react-map-gl/mapbox-legacy` | `react-map-gl-supercluster/mapbox-legacy` |

There is no root entrypoint in v3+ because `react-map-gl` v8 no longer has a default root export.

## Example usage

```tsx
import { type ReactElement, useMemo, useState } from 'react'
import Map, { type MapRef, Marker } from 'react-map-gl/mapbox'
import { isCluster, type PointFeature, useSupercluster } from 'react-map-gl-supercluster/mapbox'

type Item = {
  id: string
  longitude: number
  latitude: number
}
type ItemProperties = { item: Item }
type ItemClusterProperties = { items: Item[] }

function MyAwesomeMap({ items }: { items: Item[] }): ReactElement {
  const [map, setMap] = useState<MapRef | null>(null)

  const points = useMemo(() => createPoints(items), [items])

  const { supercluster, clusters } = useSupercluster(points, {
    mapRef: map,
    map: mapFeature,
    reduce: reduceCluster,
  })

  const expandCluster = (clusterId: number, coordinates: { longitude: number; latitude: number }) => {
    const zoom = supercluster.getClusterExpansionZoom(clusterId)
    map?.easeTo({
      center: [coordinates.longitude, coordinates.latitude],
      zoom,
    })
  }

  return (
    <Map ref={setMap}>
      {clusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates

        return isCluster(cluster) ? (
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

function createPoints(items: Item[]): Array<PointFeature<ItemProperties>> {
  return items.map(createPoint)
}

function createPoint(item: Item): PointFeature<ItemProperties> {
  return {
    type: 'Feature',
    properties: { item },
    geometry: {
      type: 'Point',
      coordinates: [item.longitude, item.latitude],
    },
  }
}

function mapFeature(props: ItemProperties): ItemClusterProperties {
  return { items: [props.item] }
}

function reduceCluster(memo: ItemClusterProperties, props: ItemClusterProperties): void {
  memo.items = memo.items.concat(props.items)
}
```

If the hook is rendered inside `Map`, `mapRef` can be omitted. The hook resolves the current map from the matching `react-map-gl` entrypoint.

```tsx
import { type ReactElement, useMemo } from 'react'
import Map, { Marker } from 'react-map-gl/mapbox'
import { isCluster, useSupercluster } from 'react-map-gl-supercluster/mapbox'

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

        return isCluster(cluster) ? (
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

## Demo

The repository includes a Vite + MapLibre example. It uses the public MapLibre demo style, so no Mapbox token is required.

```bash
pnpm example
```

Open the URL printed by Vite. Or skip cloning and [open the repository in StackBlitz](https://stackblitz.com/github/khmm12/react-map-gl-supercluster) – the example starts automatically.

## API

### `useSupercluster`

The hook can be used in a component which renders `Map` component or inside `Map` children.

#### Arguments

1. `points` - GeoJSON points array. The value should be memoized.
2. `options` – various options, see below.

#### Return value

Object which contains 2 fields:
- `clusters` – clusters list
- `supercluster` – supercluster instance.

### Options

| Option     | Default  | Description                                                                                                                                                                          |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| mapRef     | Optional | `MapRef` instance. Optional when the hook is rendered inside `Map`.                                                                                                                    |
| boundsPadding | 0     | Extra viewport fraction (per side) included when querying clusters. Markers near the edges don't pop in and out, and pans at the same zoom inside the padded area skip recomputation. Larger values render more off-screen markers. |
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

### `isCluster`

Type guard that tells generated clusters from your own points:

```tsx
if (isCluster(cluster)) {
  // cluster.properties is ClusterProperties & TClusterProperties
} else {
  // cluster.properties is TFeatureProperties
}
```

### Types

Each entrypoint re-exports the public types: `Cluster`, `ClusterFeature`, `PointFeature`, `PointFeatureProperties`, `GeoJsonProperties`, `SuperclusterInstance`, `UseSuperclusterOptions` and `UseSuperclusterReturnValue`.

## Performance

The hook itself stays off the hot path: clusters are queried from a prebuilt index, and the result keeps its reference while the viewport stays within the queried area, so React bails out of re-rendering. With large datasets jank usually comes from two places – React re-rendering many `<Marker>` elements, and the index rebuild when `points` change. The techniques below compose.

### Pad the queried area

`boundsPadding` queries a larger-than-viewport area. Pans at the same zoom inside the padded area return the same `clusters` array, so nothing re-renders:

```tsx
const { clusters } = useSupercluster(points, { boundsPadding: 0.5 })
```

### Defer marker rendering

When `clusters` do change, rendering hundreds of markers can block the frame. Pass a deferred value to a memoized component: the urgent render stays cheap, and markers catch up at background priority – during an active pan they settle once it ends.

```tsx
const deferredClusters = useDeferredValue(clusters)

return <Markers clusters={deferredClusters} />
```

```tsx
const Markers = memo(function Markers({ clusters }: MarkersProps) {
  // render <Marker /> and <ClusterMarker /> elements
})
```

Without `memo` deferring makes things worse – the markers re-render in the urgent pass anyway, and then once more in the deferred one. The tradeoff: after zooming, the previous zoom's cluster set stays on screen for a moment until the deferred render commits. Markers remain anchored to their coordinates, so nothing drifts – the clustering is just briefly stale.

### Defer index rebuilds

If `points` change rapidly – filtering as the user types, live updates – defer them before passing to the hook. The rebuild moves off the urgent path, and React skips intermediate values it can't keep up with:

```tsx
const { clusters } = useSupercluster(useDeferredValue(points), options)
```

### Know when to switch

DOM markers stop scaling long before `supercluster` does. If you render thousands of visible markers or cluster hundreds of thousands of points, use the built-in clustering of your renderer instead (`cluster: true` on a GeoJSON source) – it runs in a worker and renders in WebGL. This library targets the React-markers use case.

## FAQ

### Why does it cause component re-rendering or why do I get infinite component update loop?

Please be careful with `points` and `map`/`reduce` functions. They always should be memoized.

### Why does TypeScript reject my properties type?

Properties types must satisfy `Record<string, unknown>`. Type aliases get an implicit index signature, `interface` declarations don't – declare properties types with `type`, not `interface`. Also note that the `cluster` key is reserved for generated clusters and must not appear in point properties.

### Does it support WebWorker?

No, and it is not planned – a worker would make the whole API asynchronous for little gain at this library's scale. If your dataset is large enough for the index build to matter, see [Performance](#performance): the built-in `cluster: true` clustering of mapbox-gl/maplibre-gl already runs in a worker.

## Contributing

Issues and PRs are welcome. To get started:

```bash
pnpm install
pnpm check # lint, typecheck, tests
```

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org).

## License

MIT © [Maxim Khvatalin](https://github.com/khmm12)
