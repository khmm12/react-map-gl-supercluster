import { describe, expect, it } from 'vitest'
import { containsBounds, expandBounds, getMapState, isMapStateEqual } from './map-state.js'
import { TestMap } from './test-helpers.js'

describe('isMapStateEqual', () => {
  it('accepts equal map states', () => {
    expect(isMapStateEqual({ bounds: [-10, -20, 10, 20], zoom: 4 }, { bounds: [-10, -20, 10, 20], zoom: 4 })).toBe(true)
  })

  it('rejects different bounds', () => {
    expect(isMapStateEqual({ bounds: [-10, -20, 10, 20], zoom: 4 }, { bounds: [-10, -20, 10, 21], zoom: 4 })).toBe(
      false,
    )
  })

  it('rejects different zoom', () => {
    expect(isMapStateEqual({ bounds: [-10, -20, 10, 20], zoom: 4 }, { bounds: [-10, -20, 10, 20], zoom: 5 })).toBe(
      false,
    )
  })

  it('handles null', () => {
    expect(isMapStateEqual(null, null)).toBe(true)
    expect(isMapStateEqual(null, { bounds: [-10, -20, 10, 20], zoom: 4 })).toBe(false)
    expect(isMapStateEqual({ bounds: [-10, -20, 10, 20], zoom: 4 }, null)).toBe(false)
  })
})

describe('expandBounds', () => {
  it('expands each side by the given fraction of the viewport size', () => {
    expect(expandBounds([0, 0, 10, 20], 0.5)).toEqual([-5, -10, 15, 30])
  })

  it('does not clamp to world limits (supercluster normalizes the bbox itself)', () => {
    expect(expandBounds([170, 80, 180, 85], 1)).toEqual([160, 75, 190, 90])
  })
})

describe('containsBounds', () => {
  it('accepts inner bounds fully inside outer', () => {
    expect(containsBounds([-10, -10, 10, 10], [-5, -5, 5, 5])).toBe(true)
  })

  it('accepts equal bounds', () => {
    expect(containsBounds([-10, -10, 10, 10], [-10, -10, 10, 10])).toBe(true)
  })

  it('rejects bounds sticking out on any side', () => {
    expect(containsBounds([-10, -10, 10, 10], [-11, -5, 5, 5])).toBe(false)
    expect(containsBounds([-10, -10, 10, 10], [-5, -11, 5, 5])).toBe(false)
    expect(containsBounds([-10, -10, 10, 10], [-5, -5, 11, 5])).toBe(false)
    expect(containsBounds([-10, -10, 10, 10], [-5, -5, 5, 11])).toBe(false)
  })
})

describe('getMapState', () => {
  it('returns null when bounds are not available', () => {
    const map = new TestMap(null, 3.4)

    expect(getMapState(map)).toBeNull()
  })

  it('flattens bounds and rounds zoom', () => {
    const map = new TestMap(
      [
        [-10, -20],
        [10, 20],
      ],
      3.6,
    )

    expect(getMapState(map)).toEqual({ bounds: [-10, -20, 10, 20], zoom: 4 })
  })
})
