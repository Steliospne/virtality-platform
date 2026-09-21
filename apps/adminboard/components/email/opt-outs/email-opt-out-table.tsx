'use client'

import type { EmailOptOutScope } from '@virtality/shared/types'
import { getEmailOptOutScopeLabel } from '@virtality/shared/utils'
import { Badge } from '@virtality/ui/components/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@virtality/ui/components/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@virtality/ui/components/table'
import { format } from 'date-fns'

type OptOutRow = {
  id: string
  email: string
  scope: EmailOptOutScope
  source: 'recipient_link' | 'admin'
  note: string | null
  createdAt: string | Date
}

type EmailOptOutTableProps = {
  optOuts: OptOutRow[]
}

const sourceLabel: Record<OptOutRow['source'], string> = {
  recipient_link: 'Email link',
  admin: 'Admin',
}

export const EmailOptOutTable = ({ optOuts }: EmailOptOutTableProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Opt-outs</CardTitle>
      <CardDescription>
        Enforced at Final Send for every recipient, however they reached the
        draft.
      </CardDescription>
    </CardHeader>
    <CardContent>
      {optOuts.length === 0 ? (
        <p className='text-muted-foreground text-sm'>No opt-outs recorded.</p>
      ) : (
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Recorded</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {optOuts.map((optOut) => (
                <TableRow key={optOut.id}>
                  <TableCell className='font-medium'>{optOut.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={optOut.scope === 'all' ? 'default' : 'secondary'}
                    >
                      {getEmailOptOutScopeLabel(optOut.scope)}
                    </Badge>
                  </TableCell>
                  <TableCell>{sourceLabel[optOut.source]}</TableCell>
                  <TableCell className='text-muted-foreground text-xs'>
                    {format(new Date(optOut.createdAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className='text-muted-foreground max-w-60 truncate text-xs'>
                    {optOut.note ?? ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </CardContent>
  </Card>
)
