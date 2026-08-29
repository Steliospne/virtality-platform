import { describe, expect, it } from 'vitest'
import {
  isRenderableLucideIcon,
  resolveLucideIconFromModule,
} from './lucide-icon.ts'
import {
  createMockLucideModule,
  mockLucideIcon,
} from './lucide-icon.testing.ts'

describe('lucide icon resolvability', () => {
  it('accepts names that resolve to forward-ref icon components', () => {
    const lucideModule = createMockLucideModule({
      Activity: mockLucideIcon(),
      BarChartBig: mockLucideIcon(),
    })

    expect(isRenderableLucideIcon('Activity', lucideModule)).toBe(true)
    expect(isRenderableLucideIcon('BarChartBig', lucideModule)).toBe(true)
  })

  it('rejects unknown names and non-glyph exports', () => {
    const lucideModule = createMockLucideModule({
      Activity: mockLucideIcon(),
    })

    expect(isRenderableLucideIcon('NotARealIcon', lucideModule)).toBe(false)
    expect(isRenderableLucideIcon('icons', lucideModule)).toBe(false)
    expect(isRenderableLucideIcon('createLucideIcon', lucideModule)).toBe(false)
    expect(isRenderableLucideIcon('Icon', lucideModule)).toBe(false)
  })

  it('rejects plain functions that are not forward-ref components', () => {
    const lucideModule = createMockLucideModule({
      Activity: () => null,
    })

    expect(isRenderableLucideIcon('Activity', lucideModule)).toBe(false)
  })

  it('resolves renderable icon components and rejects invalid names', () => {
    const activity = mockLucideIcon()
    const lucideModule = createMockLucideModule({ Activity: activity })

    expect(resolveLucideIconFromModule('Activity', lucideModule)).toBe(activity)
    expect(resolveLucideIconFromModule(undefined, lucideModule)).toBeNull()
    expect(resolveLucideIconFromModule('NotARealIcon', lucideModule)).toBeNull()
    expect(resolveLucideIconFromModule('icons', lucideModule)).toBeNull()
    expect(
      resolveLucideIconFromModule('createLucideIcon', lucideModule),
    ).toBeNull()
    expect(resolveLucideIconFromModule('Icon', lucideModule)).toBeNull()
  })

  it('accepts seed icon names from the website Lucide version when available', async () => {
    let websiteLucide: Record<string, unknown> | null = null

    try {
      websiteLucide = await import('lucide-react')
    } catch {
      return
    }

    const seedIconNames = [
      'PersonStanding',
      'Shield',
      'Users',
      'Sparkles',
      'ClipboardList',
      'Building2',
      'Activity',
      'Brain',
      'Package',
      'BarChartBig',
      'Sliders',
      'Clock',
    ]

    for (const iconName of seedIconNames) {
      expect(isRenderableLucideIcon(iconName, websiteLucide)).toBe(true)
    }
  })
})
