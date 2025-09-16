import { describe, it, expect } from 'vitest'
import { generatePolygon } from '@/utils/geometry'

describe('generatePolygon', () => {
  it('returns rectangle for layout=prosty', () => {
    const poly = generatePolygon('prosty', { length: 100, depth: 60 }, 'left-l')
    expect(poly).toHaveLength(4)
    expect(poly[0]).toEqual({ x: 0, y: 0 })
    expect(poly[2]).toEqual({ x: 100, y: 60 })
  })

  it('handles L-left with required dimensions', () => {
    const poly = generatePolygon('l-ksztaltny', { lengthA: 200, lengthB: 150, depth: 60 } as any, 'left-l')
    expect(poly.length).toBeGreaterThan(0)
  })
})

