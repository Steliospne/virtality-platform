import { Badge } from '@virtality/ui/components/badge'
import {
  getAdminEmailWorkflowBadgeConfig,
  type AdminEmailWorkflowBadgeInput,
} from '@/lib/admin-email-workflow-badges'
import { cn } from '@/lib/utils'

export const AdminEmailWorkflowBadge = (props: AdminEmailWorkflowBadgeInput) => {
  const config = getAdminEmailWorkflowBadgeConfig(props)

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, config.minWidthClass)}
    >
      {config.label}
    </Badge>
  )
}
