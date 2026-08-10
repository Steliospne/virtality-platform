import { EFFECTIVENESS_REPORT_COPY } from '@/lib/effectiveness-report-copy'
import type { LucideIcon } from 'lucide-react'
import {
  CreditCard,
  Film,
  Grid3x3,
  Images,
  Layers,
  LayoutDashboard,
  LineChart,
  LinkIcon,
  Mail,
  Sparkles,
  Trash2,
  UserPlus,
} from 'lucide-react'

export type SidebarNavItem = {
  title: string
  href: string
  icon: LucideIcon
}

export type SidebarNavGroup = {
  label?: string
  items: SidebarNavItem[]
}

export const sidebarNav: SidebarNavGroup[] = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', href: '/', icon: LayoutDashboard },
      {
        title: EFFECTIVENESS_REPORT_COPY.navLabel,
        href: '/effectiveness',
        icon: LineChart,
      },
    ],
  },
  {
    items: [{ title: 'Bucket', href: '/bucket', icon: Trash2 }],
  },
  {
    label: 'Content',
    items: [
      { title: 'Partner logos', href: '/partner-logos', icon: Images },
      { title: 'Promo video', href: '/promo-video', icon: Film },
      { title: 'Mosaic', href: '/mosaic', icon: Grid3x3 },
      { title: 'Benefits', href: '/benefits', icon: Sparkles },
      { title: 'Features', href: '/features', icon: Layers },
      { title: 'Email', href: '/email', icon: Mail },
    ],
  },
  {
    label: 'Billing',
    items: [
      {
        title: 'Trial Redeem Codes',
        href: '/trial-redeem-codes',
        icon: CreditCard,
      },
    ],
  },
  {
    label: 'Admin',
    items: [
      { title: 'Tester Codes', href: '/tester-codes', icon: LinkIcon },
      { title: 'Create user', href: '/admin/create-user', icon: UserPlus },
    ],
  },
]
