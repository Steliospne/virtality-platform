import {
  BookMarkedIcon,
  User,
  CircleQuestionMark,
  ScrollText,
  RectangleGogglesIcon,
  LucideProps,
} from 'lucide-react'
import { ForwardRefExoticComponent, RefAttributes } from 'react'

type SidebarLink = {
  title: string
  url: string
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >
}

const sidebarLinks: SidebarLink[] = [
  { title: 'Devices', url: '/devices', icon: RectangleGogglesIcon },
  {
    title: 'Patients',
    url: '/patients',
    icon: User,
  },
  {
    title: 'Presets',
    url: '/presets',
    icon: BookMarkedIcon,
  },
  {
    title: 'Guides',
    url: '/guides',
    icon: CircleQuestionMark,
  },
  { title: 'Forms', url: '/forms', icon: ScrollText },
]

export default sidebarLinks
