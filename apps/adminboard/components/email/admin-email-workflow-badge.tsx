import { Badge } from '@virtality/ui/components/badge'
import {
  getAdminEmailWorkflowBadgeConfig,
  type AdminEmailWorkflowBadgeInput,
} from '@/lib/admin-email-workflow-badges'

export const AdminEmailWorkflowBadge = (props: AdminEmailWorkflowBadgeInput) => {
  const config = getAdminEmailWorkflowBadgeConfig(props)

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}
