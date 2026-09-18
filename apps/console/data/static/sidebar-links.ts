import {
  BookMarkedIcon,
  User,
  CircleQuestionMark,
  ScrollText,
  RectangleGogglesIcon,
  Film,
  LucideProps,
} from 'lucide-react'
import { ForwardRefExoticComponent, RefAttributes } from 'react'
import { resolveVrExperiencesNavEnabled } from '@/lib/vr-experiences-feature'

type SidebarLink = {
  title: string
  url: string
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >
  /** Omit the link from the rendered sidebar when this returns false. */
  enabled?: () => boolean
}

const sidebarLinks: SidebarLink[] = [
  {
    title: 'patients',
    url: '/patients',
    icon: User,
  },
  {
    title: 'programs',
    url: '/programs',
    icon: BookMarkedIcon,
  },
  {
    title: 'VR experiences',
    url: '/vr-video',
    icon: Film,
    enabled: resolveVrExperiencesNavEnabled,
  },
  { title: 'devices', url: '/devices', icon: RectangleGogglesIcon },
  {
    title: 'guides',
    url: '/guides',
    icon: CircleQuestionMark,
  },
  { title: 'forms', url: '/forms', icon: ScrollText },
]

export function getVisibleSidebarLinks(): SidebarLink[] {
  return sidebarLinks.filter((link) => link.enabled?.() ?? true)
}

export default sidebarLinks
