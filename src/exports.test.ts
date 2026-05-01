import { describe, expect, it } from 'vitest'

describe('public entrypoints', () => {
  it('export mapbox hook', async () => {
    const entrypoint = await import('./exports-mapbox.js')

    expect(entrypoint.useSupercluster).toEqual(expect.any(Function))
  })

  it('export mapbox-legacy hook', async () => {
    const entrypoint = await import('./exports-mapbox-legacy.js')

    expect(entrypoint.useSupercluster).toEqual(expect.any(Function))
  })

  it('export maplibre hook', async () => {
    const entrypoint = await import('./exports-maplibre.js')

    expect(entrypoint.useSupercluster).toEqual(expect.any(Function))
  })
})
