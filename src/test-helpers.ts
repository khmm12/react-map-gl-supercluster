import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { MapLike, PointFeature } from './types.js'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

export type TestProperties = { value: number }
export type TestClusterProperties = { sum: number }

export function pointFeature(id: number, coordinates: number[], value = id): PointFeature<TestProperties> {
  return {
    geometry: { coordinates, type: 'Point' },
    id,
    properties: { value },
    type: 'Feature',
  }
}

type HookView<TProps, TResult> = {
  readonly result: TResult
  rerender(nextProps: TProps): Promise<void>
  unmount(): void
}

export async function renderHook<TProps, TResult>(
  useHook: (props: TProps) => TResult,
  initialProps: TProps,
  { strictMode = false }: { strictMode?: boolean } = {},
): Promise<HookView<TProps, TResult>> {
  const root = createRoot(document.createElement('div'))
  let props = initialProps
  let rendered: { current: TResult } | null = null

  function TestComponent(): null {
    rendered = { current: useHook(props) }
    return null
  }

  async function render(): Promise<void> {
    await act(async () => {
      const element = React.createElement(TestComponent)
      root.render(strictMode ? React.createElement(React.StrictMode, null, element) : element)
    })
  }

  await render()

  return {
    get result(): TResult {
      if (rendered == null) throw new Error('Hook did not render')
      return rendered.current
    },
    rerender: async (nextProps) => {
      props = nextProps
      await render()
    },
    unmount: () => {
      act(() => root.unmount())
    },
  }
}

type TestMapBounds = [[number, number], [number, number]]

export class TestMap implements MapLike {
  private bounds: TestMapBounds | null
  private readonly listeners = new Map<string, Set<(...args: unknown[]) => void>>()
  private zoom = 0

  constructor(bounds: TestMapBounds | null, zoom = 0) {
    this.bounds = bounds
    this.zoom = zoom
  }

  getBounds() {
    return this.bounds == null ? null : { toArray: () => this.bounds ?? [] }
  }

  getZoom() {
    return this.zoom
  }

  listenerCount(type: string) {
    return this.listeners.get(type)?.size ?? 0
  }

  off(type: string, listener?: (...args: unknown[]) => void) {
    if (listener == null) {
      this.listeners.delete(type)
      return
    }

    this.listeners.get(type)?.delete(listener)
  }

  on(type: string, listener: (...args: unknown[]) => void) {
    const listeners = this.listeners.get(type) ?? new Set()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }

  emit(type: string) {
    for (const listener of this.listeners.get(type) ?? []) listener()
  }

  setBounds(bounds: TestMapBounds | null) {
    this.bounds = bounds
  }

  setView(bounds: TestMapBounds | null, zoom: number) {
    this.bounds = bounds
    this.zoom = zoom
  }
}
