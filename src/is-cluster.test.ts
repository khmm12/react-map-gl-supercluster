import { describe, expect, it } from 'vitest'
import { isCluster } from './is-cluster.js'
import { pointFeature, type TestClusterProperties, type TestProperties } from './test-helpers.js'
import type { Cluster, ClusterFeature, PointClusterProperties } from './types.js'

type TestCluster = Cluster<TestProperties, TestClusterProperties>

describe('isCluster', () => {
  it('accepts generated cluster features', () => {
    const cluster: TestCluster = clusterFeature(1, 5)

    expect(isCluster(cluster)).toBe(true)
  })

  it('rejects point features', () => {
    const point: TestCluster = pointFeature(1, [0, 0])

    expect(isCluster(point)).toBe(false)
  })
})

function clusterFeature(id: number, sum: number): ClusterFeature<PointClusterProperties<TestClusterProperties>> {
  return {
    geometry: { coordinates: [0, 0], type: 'Point' },
    id,
    properties: {
      cluster: true,
      cluster_id: id,
      point_count: 2,
      point_count_abbreviated: 2,
      sum,
    },
    type: 'Feature',
  }
}
