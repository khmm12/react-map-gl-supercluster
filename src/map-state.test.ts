import { describe, expect, it } from 'vitest'
import { getMapState, isMapStateEqual } from './map-state.js'
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
