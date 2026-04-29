import { useCallback, useMemo, useState } from 'react'
import MapComponent, { type MapRef, Marker, NavigationControl, Popup } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  type Cluster,
  type PointClusterProperties,
  type PointFeature,
  type PointFeatureProperties,
  useSupercluster,
} from 'react-map-gl-supercluster/maplibre'
import { type Place, places } from './data.js'

type PlaceFeatureProperties = {
  place: Place
}

type PlaceClusterProperties = {
  places: Place[]
  totalAttendees: number
}

type PlaceCluster = Cluster<PlaceFeatureProperties, PlaceClusterProperties>

const mapStyle = 'https://demotiles.maplibre.org/style.json'

export default function App() {
  const [map, setMap] = useState<MapRef | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)

  const points = useMemo<Array<PointFeature<PointFeatureProperties<PlaceFeatureProperties>>>>(
    () =>
      places.map((place) => ({
        type: 'Feature',
        properties: { cluster: false, place },
        geometry: {
          type: 'Point',
          coordinates: [place.longitude, place.latitude],
        },
      })),
    [],
  )

  const mapFeature = useCallback(
    (properties: PointFeatureProperties<PlaceFeatureProperties>): PointClusterProperties<PlaceClusterProperties> => ({
      places: [properties.place],
      totalAttendees: properties.place.attendees,
    }),
    [],
  )

  const reduceCluster = useCallback(
    (
      memo: PointClusterProperties<PlaceClusterProperties>,
      properties: PointClusterProperties<PlaceClusterProperties>,
    ): void => {
      memo.places = memo.places.concat(properties.places)
      memo.totalAttendees += properties.totalAttendees
    },
    [],
  )

  const { supercluster, clusters } = useSupercluster<PlaceFeatureProperties, PlaceClusterProperties>(points, {
    mapRef: map,
    map: mapFeature,
    reduce: reduceCluster,
  })

  const expandCluster = useCallback(
    (clusterId: number, longitude: number, latitude: number) => {
      const zoom = Math.min(supercluster.getClusterExpansionZoom(clusterId), 18)
      map?.easeTo({ center: [longitude, latitude], zoom, duration: 650 })
    },
    [map, supercluster],
  )

  return (
    <main className="app-shell">
      <section className="map-stage" aria-label="Clustered events map">
        <MapComponent
          ref={setMap}
          initialViewState={{ longitude: 8.8, latitude: 49.2, zoom: 3.15 }}
          mapStyle={mapStyle}
          minZoom={2}
          maxZoom={18}
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />

          {clusters.map((cluster) => {
            const [longitude, latitude] = cluster.geometry.coordinates

            if (isCluster(cluster)) {
              const pointCount = cluster.properties.point_count
              const size = Math.min(74, 38 + pointCount * 0.18)

              return (
                <Marker
                  key={`cluster-${cluster.properties.cluster_id}`}
                  longitude={longitude}
                  latitude={latitude}
                  anchor="center"
                >
                  <button
                    className="cluster-marker"
                    style={{ width: size, height: size }}
                    type="button"
                    onClick={() => expandCluster(cluster.properties.cluster_id, longitude, latitude)}
                    aria-label={`Expand ${pointCount} places`}
                  >
                    <span>{pointCount}</span>
                  </button>
                </Marker>
              )
            }

            const { place } = cluster.properties

            return (
              <Marker key={place.id} longitude={longitude} latitude={latitude} anchor="bottom">
                <button
                  className="place-marker"
                  style={{ backgroundColor: place.color }}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    setSelectedPlace(place)
                  }}
                  aria-label={place.name}
                />
              </Marker>
            )
          })}

          {selectedPlace != null && (
            <Popup
              longitude={selectedPlace.longitude}
              latitude={selectedPlace.latitude}
              anchor="top"
              closeButton={false}
              offset={18}
              onClose={() => setSelectedPlace(null)}
            >
              <div className="place-popup">
                <strong>{selectedPlace.name}</strong>
                <span>{selectedPlace.city}</span>
                <small>{selectedPlace.attendees} attendees</small>
              </div>
            </Popup>
          )}
        </MapComponent>
      </section>

      <aside className="stats-panel" aria-label="Map statistics">
        <div>
          <span>Points</span>
          <strong>{places.length}</strong>
        </div>
        <div>
          <span>Rendered</span>
          <strong>{clusters.length}</strong>
        </div>
      </aside>
    </main>
  )
}

function isCluster(cluster: PlaceCluster): cluster is Extract<PlaceCluster, { properties: { cluster: true } }> {
  return cluster.properties.cluster === true
}
