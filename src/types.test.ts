import type { MapRef as MapboxMapRef } from 'react-map-gl'
import type { MapRef as MaplibeMapRef } from 'react-map-gl/maplibre'
import type { RelMapRef } from './types.js'

assert<Expect<RelMapRef, MapboxMapRef>>()
assert<Expect<RelMapRef, MaplibeMapRef>>()

type Expect<T, E> = E extends T ? true : false
function assert<T extends true>(): void {}
