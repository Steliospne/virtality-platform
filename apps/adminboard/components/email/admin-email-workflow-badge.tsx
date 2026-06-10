import { Badge } from '@virtality/ui/components/badge'
import {
  getAdminEmailWorkflowBadgeConfig,
  type AdminEmailWorkflowBadgeInput,
} from '@/lib/admin-email-workflow-badges'

type AdminEmailWorkflowBadgeProps = AdminEmailWorkflowBadgeInput

export const AdminEmailWorkflowBadge = (props: AdminEmailWorkflowBadgeProps) => {
  const config = getAdminEmailWorkflowBadgeConfig(props)

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}
