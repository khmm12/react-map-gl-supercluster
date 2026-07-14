import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, type TestClusterProperties, type TestProperties } from './test-helpers.js'
import type { SuperclusterOptions } from './types.js'
import { useWarnOnUnstableFunctionOptions } from './warn-unstable-options.js'

type Options = SuperclusterOptions<TestProperties, TestClusterProperties>

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useWarnOnUnstableFunctionOptions', () => {
  it('does not warn when function option references stay stable', async () => {
    const warn = spyOnWarn()
    const map = mapOption()
    const reduce = reduceOption()
    const view = await renderWarnings({ map, reduce })

    await view.rerender({ map, reduce })
    await view.rerender({ map, reduce })
    await view.rerender({ map, reduce })

    expect(warn).not.toHaveBeenCalled()
  })

  it('warns once when the map option reference changes for three consecutive renders', async () => {
    const warn = spyOnWarn()
    const view = await renderWarnings({ map: mapOption() })

    await view.rerender({ map: mapOption() })
    await view.rerender({ map: mapOption() })
    expect(warn).not.toHaveBeenCalled()

    await view.rerender({ map: mapOption() })
    await view.rerender({ map: mapOption() })

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(
      'react-map-gl-supercluster: option "map" changed between renders. This recreates the Supercluster index. Wrap it in useCallback or define it outside the component.',
    )
  })

  it('warns once when the reduce option reference changes for three consecutive renders', async () => {
    const warn = spyOnWarn()
    const map = mapOption()
    const view = await renderWarnings({ map, reduce: reduceOption() })

    await view.rerender({ map, reduce: reduceOption() })
    await view.rerender({ map, reduce: reduceOption() })
    expect(warn).not.toHaveBeenCalled()

    await view.rerender({ map, reduce: reduceOption() })

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(
      'react-map-gl-supercluster: option "reduce" changed between renders. This recreates the Supercluster index. Wrap it in useCallback or define it outside the component.',
    )
  })

  it('does not warn when function options are added after the initial render', async () => {
    const warn = spyOnWarn()
    const view = await renderWarnings({})

    await view.rerender({ map: mapOption(), reduce: reduceOption() })

    expect(warn).not.toHaveBeenCalled()
  })

  it('resets the counter when the option reference stabilizes', async () => {
    const warn = spyOnWarn()
    const stableMap = mapOption()
    const view = await renderWarnings({ map: mapOption() })

    await view.rerender({ map: mapOption() })
    await view.rerender({ map: stableMap })
    await view.rerender({ map: stableMap })
    await view.rerender({ map: mapOption() })
    await view.rerender({ map: mapOption() })

    expect(warn).not.toHaveBeenCalled()
  })

  it('ignores re-renders with the same options object', async () => {
    const warn = spyOnWarn()
    const view = await renderWarnings({ map: mapOption() })
    const repeatedOptions: Options = { map: mapOption() }

    await view.rerender({ map: mapOption() })
    await view.rerender({ map: mapOption() })
    await view.rerender(repeatedOptions)
    await view.rerender(repeatedOptions)
    await view.rerender({ map: mapOption() })

    expect(warn).toHaveBeenCalledTimes(1)
  })
})

function renderWarnings(options: Options) {
  return renderHook((props: Options) => useWarnOnUnstableFunctionOptions(props), options)
}

function spyOnWarn() {
  return vi.spyOn(console, 'warn').mockImplementation(() => {})
}

function mapOption(): NonNullable<Options['map']> {
  return (properties) => ({ sum: properties.value })
}

function reduceOption(): NonNullable<Options['reduce']> {
  return (memo, properties) => {
    memo.sum += properties.sum
  }
}
