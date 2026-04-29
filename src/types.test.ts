import type { MapRef as MapboxMapRef } from 'react-map-gl/mapbox'
import type { MapRef as MapboxLegacyMapRef } from 'react-map-gl/mapbox-legacy'
import type { MapRef as MaplibeMapRef } from 'react-map-gl/maplibre'
import type { RelMapRef } from './types.js'

assert<Expect<RelMapRef, MapboxMapRef>>()
assert<Expect<RelMapRef, MapboxLegacyMapRef>>()
assert<Expect<RelMapRef, MaplibeMapRef>>()

type Expect<T, E> = E extends T ? true : false
function assert<_T extends true>(): void {}
