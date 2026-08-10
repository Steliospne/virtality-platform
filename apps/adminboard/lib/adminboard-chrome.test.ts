// @vitest-environment node

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const adminboardRoot = fileURLToPath(new URL('..', import.meta.url))

function readAdminboardFile(relativePath: string): string {
  return readFileSync(join(adminboardRoot, relativePath), 'utf8')
}

function adminboardFileExists(relativePath: string): boolean {
  return existsSync(join(adminboardRoot, relativePath))
}

describe('adminboard sidebar chrome', () => {
  it('defines the agreed sidebar IA in a local nav config', () => {
    const nav = readAdminboardFile('data/static/sidebar-nav.ts')

    expect(nav).toMatch(/Overview/)
    expect(nav).toMatch(/href: ['"]\/['"]/)
    expect(nav).toMatch(/href: ['"]\/effectiveness['"]/)
    expect(nav).toMatch(/title: ['"]Bucket['"]/)
    expect(nav).toMatch(/href: ['"]\/bucket['"]/)
    expect(nav).toMatch(/Content/)
    expect(nav).toMatch(/href: ['"]\/partner-logos['"]/)
    expect(nav).toMatch(/href: ['"]\/promo-video['"]/)
    expect(nav).toMatch(/href: ['"]\/mosaic['"]/)
    expect(nav).toMatch(/href: ['"]\/benefits['"]/)
    expect(nav).toMatch(/href: ['"]\/features['"]/)
    expect(nav).toMatch(/href: ['"]\/email['"]/)
    expect(nav).toMatch(/Billing/)
    expect(nav).toMatch(/href: ['"]\/trial-redeem-codes['"]/)
    expect(nav).toMatch(/Admin/)
    expect(nav).toMatch(/href: ['"]\/tester-codes['"]/)
    expect(nav).toMatch(/href: ['"]\/admin\/create-user['"]/)
    expect(nav).not.toMatch(/\/resources\//)
    expect(nav).not.toMatch(/S3 bucket/)
  })

  it('wires a collapsible sidebar shell and slim top bar', () => {
    const shell = readAdminboardFile('components/layout/app-shell.tsx')
    const sidebar = readAdminboardFile('components/layout/app-sidebar.tsx')
    const topBar = readAdminboardFile('components/layout/top-bar.tsx')
    const layout = readAdminboardFile('app/layout.tsx')

    expect(shell).toMatch(/SidebarProvider/)
    expect(shell).toMatch(/AppSidebar|app-sidebar/)
    expect(shell).toMatch(/TopBar|top-bar/)
    expect(sidebar).toMatch(/collapsible=['"]icon['"]/)
    expect(sidebar).toMatch(/SidebarHeader/)
    expect(sidebar).toMatch(/h-15/)
    expect(sidebar).toMatch(/Collapsible/)
    expect(sidebar).toMatch(/sidebar-nav/)
    expect(topBar).toMatch(/SidebarTrigger/)
    expect(topBar).toMatch(/Adminboard/)
    expect(topBar).toMatch(/Avatar/)
    expect(topBar).not.toMatch(
      /\/partner-logos|\/promo-video|\/mosaic|\/email|\/tester-codes|\/trial-redeem-codes|\/bucket/,
    )
    expect(layout).toMatch(/AppShell|app-shell/)
    expect(layout).not.toMatch(/from ['"]@\/components\/layout\/navbar['"]/)
  })

  it('exposes create user as a page, not a chrome dialog', () => {
    expect(adminboardFileExists('app/admin/create-user/page.tsx')).toBe(true)

    const page = readAdminboardFile('app/admin/create-user/page.tsx')
    const topBar = readAdminboardFile('components/layout/top-bar.tsx')
    const sidebar = readAdminboardFile('components/layout/app-sidebar.tsx')

    expect(page).toMatch(/UserForm/)
    expect(page).not.toMatch(/dialog/)
    expect(topBar).not.toMatch(/UserForm|create user|Create user/i)
    expect(sidebar).not.toMatch(/UserForm|setNewUserDialogOpen/)
  })
})
