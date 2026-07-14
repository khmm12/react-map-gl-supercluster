import { describe, expect, it, vi } from 'vitest'
import { pointFeature, renderHook, type TestClusterProperties, type TestProperties } from './test-helpers.js'
import type { SuperclusterOptions } from './types.js'

type Options = SuperclusterOptions<TestProperties, TestClusterProperties>

describe('useSuperclusterIndex in production', () => {
  it('does not warn about unstable map/reduce options', async () => {
    vi.doMock('esm-env', () => ({ DEV: false }))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { useSuperclusterIndex } = await import('./use-supercluster-index.js')
    const points = [pointFeature(1, [0, 0], 2), pointFeature(2, [0.01, 0.01], 3)]
    const view = await renderHook(({ options }: { options: Options }) => useSuperclusterIndex(points, options), {
      options: unstableOptions(),
    })

    await view.rerender({ options: unstableOptions() })
    await view.rerender({ options: unstableOptions() })
    await view.rerender({ options: unstableOptions() })

    expect(warn).not.toHaveBeenCalled()
  })
})

function unstableOptions(): Options {
  return {
    map: (properties) => ({ sum: properties.value }),
    reduce: (memo, properties) => {
      memo.sum += properties.sum
    },
  }
}
