import { describe, it, expect } from 'vitest'
import { validateDesign } from '@/utils/validation'
import type { Design } from '@/types'

const base: Design = {
  layout: 'prosty',
  orientation: 'left-l',
  dimensions: { length: 100, depth: 60 },
  style: { type: 'color', value: '#ffffff', name: 'White' },
  cutouts: [],
}

describe('validateDesign', () => {
  it('returns no errors for empty cutouts', () => {
    const errors = validateDesign(base)
    expect(errors).toHaveLength(0)
  })
})

