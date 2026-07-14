import type { MapRef as MapboxMapRef } from 'react-map-gl/mapbox'
import type { MapRef as MapboxLegacyMapRef } from 'react-map-gl/mapbox-legacy'
import type { MapRef as MaplibeMapRef } from 'react-map-gl/maplibre'
import type { MapLike } from './types.js'

assert<Expect<MapLike, MapboxMapRef>>()
assert<Expect<MapLike, MapboxLegacyMapRef>>()
assert<Expect<MapLike, MaplibeMapRef>>()

type Expect<T, E> = E extends T ? true : false
function assert<_T extends true>(): void {}
