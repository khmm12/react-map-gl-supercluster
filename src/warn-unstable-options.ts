import { useRef } from 'react'
import type { GeoJsonProperties, SuperclusterOptions } from './types.js'

const UNSTABLE_FUNCTION_OPTION_WARNING_THRESHOLD = 3

type TrackOption = (value: unknown) => void

/**
 * Dev-only. Warns once per option when `map`/`reduce` change reference on several
 * consecutive renders — each change recreates the `supercluster` index.
 */
export function useWarnOnUnstableFunctionOptions<
  TFeatureProperties extends GeoJsonProperties,
  TClusterProperties extends GeoJsonProperties,
>(options: SuperclusterOptions<TFeatureProperties, TClusterProperties>): void {
  const stateRef = useRef<{
    lastOptions: SuperclusterOptions<TFeatureProperties, TClusterProperties>
    trackMap: TrackOption
    trackReduce: TrackOption
  } | null>(null)

  stateRef.current ??= {
    lastOptions: options,
    trackMap: createFunctionOptionTracker('map', options.map),
    trackReduce: createFunctionOptionTracker('reduce', options.reduce),
  }

  const state = stateRef.current
  // A re-render with the same options object is not an options change
  if (state.lastOptions === options) return

  state.lastOptions = options
  state.trackMap(options.map)
  state.trackReduce(options.reduce)
}

function createFunctionOptionTracker(name: 'map' | 'reduce', initialValue: unknown): TrackOption {
  let previous = initialValue
  let consecutiveChanges = 0
  let warned = false

  return (value) => {
    const isStable = previous === value || typeof previous !== 'function' || typeof value !== 'function'
    consecutiveChanges = isStable ? 0 : consecutiveChanges + 1
    previous = value

    if (warned || consecutiveChanges < UNSTABLE_FUNCTION_OPTION_WARNING_THRESHOLD) return

    warned = true
    console.warn(
      `react-map-gl-supercluster: option "${name}" changed between renders. ` +
        'This recreates the Supercluster index. Wrap it in useCallback or define it outside the component.',
    )
  }
}
