'use client'
import { UAParser } from 'ua-parser-js'
import { authClient, Session } from '@/auth-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Monitor, Smartphone, Trash2 } from 'lucide-react'
import { H3, P } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface SessionsTabProps {
  sessions: Session[]
  currentSessionToken: string
}

const SessionsTab = ({ sessions, currentSessionToken }: SessionsTabProps) => {
  return (
    <Card>
      <CardContent>
        <SessionsManagement
          sessions={sessions}
          currentSessionToken={currentSessionToken}
        />
      </CardContent>
    </Card>
  )
}

export default SessionsTab

type SessionsManagementProps = SessionsTabProps

const SessionsManagement = ({
  sessions,
  currentSessionToken,
}: SessionsManagementProps) => {
  const router = useRouter()
  const otherSessions = sessions.filter((s) => s.token !== currentSessionToken)
  const currentSession = sessions.find((s) => s.token == currentSessionToken)
  const revokeAllOtherSessionsHandler = () => {
    authClient.revokeOtherSessions(undefined, {
      onSuccess: () => router.refresh(),
    })
  }

  return (
    <div className='space-y-6'>
      {currentSession && (
        <SessionCard session={currentSession} isCurrentSession />
      )}

      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <H3>Other Active Sessions</H3>
          {otherSessions.length > 0 && (
            <Button
              variant='destructive'
              onClick={revokeAllOtherSessionsHandler}
            >
              Revoke All Sessions
            </Button>
          )}
        </div>

        {otherSessions.length === 0 ? (
          <Card>
            <CardContent>No other sessions</CardContent>
          </Card>
        ) : (
          <div className='space-y-3'>
            {otherSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface SessionCardProps {
  session: Session
  isCurrentSession?: boolean
}

const SessionCard = ({ session, isCurrentSession }: SessionCardProps) => {
  const router = useRouter()
  const userAgentInfo = session.userAgent ? UAParser(session.userAgent) : null

  const getBrowserInfo = () => {
    if (!userAgentInfo) return 'Unknown Device'
    if (!userAgentInfo.browser.name && !userAgentInfo.os.name)
      return 'Unknown Device'

    if (!userAgentInfo.browser.name) return userAgentInfo.os.name
    if (!userAgentInfo.os.name) return userAgentInfo.browser.name

    return `${userAgentInfo.browser.name}, ${userAgentInfo.os.name}`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date))
  }

  const revokeSessionHandler = () =>
    authClient.revokeSession({
      token: session.token,
      fetchOptions: { onSuccess: () => router.refresh() },
    })

  return (
    <Card>
      <CardHeader className='flex justify-between'>
        <CardTitle>{getBrowserInfo()}</CardTitle>
        {isCurrentSession && <Badge>Current Session</Badge>}
      </CardHeader>
      <CardContent>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            {userAgentInfo?.device.type === 'mobile' ? (
              <Smartphone />
            ) : (
              <Monitor />
            )}
            <div>
              <P>Created: {formatDate(session.createdAt)}</P>
              <P>Expires: {formatDate(session.expiresAt)}</P>
            </div>
          </div>
          {!isCurrentSession && (
            <Button
              variant='destructive'
              size='icon'
              onClick={revokeSessionHandler}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
