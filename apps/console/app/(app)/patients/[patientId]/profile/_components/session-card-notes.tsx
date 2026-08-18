'use client'

import { Button } from '@virtality/ui/components/button'
import { Textarea } from '@virtality/ui/components/textarea'
import { ExtendedPatientSession } from '@/types/models'
import {
  getQueryClient,
  useORPC,
  useUpdatePatientSession,
} from '@virtality/react-query'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { trackAnalyticsEvent } from '@/lib/analytics-contract'

const SessionCardNotes = ({
  session,
  patientId,
}: {
  session: ExtendedPatientSession
  patientId: string
}) => {
  const queryClient = getQueryClient()
  const orpc = useORPC()
  const [notes, setNotes] = useState(session?.notes ?? '')
  const [isEditing, setIsEditing] = useState(false)

  const { mutate: updatePatientSession, isPending } = useUpdatePatientSession({
    onSuccess: () => {
      toast.success('Notes updated successfully.')

      trackAnalyticsEvent('session_notes_saved', {
        session_id: session.id,
        notes_length: notes.length,
      })

      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: orpc.patientSession.list.key({
            input: { where: { patientId } },
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: orpc.patientSession.find.key({
            input: { where: { id: session.id } },
          }),
        }),
      ])
    },
  })

  const handleSaveNotes = () => {
    updatePatientSession({ id: session.id, notes })
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  return (
    <div>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='font-medium'>Session Notes</h3>
        {!isEditing ? (
          <Button
            variant='outline'
            size='sm'
            onClick={() => setIsEditing(true)}
          >
            Edit Notes
          </Button>
        ) : (
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button size='sm' onClick={handleSaveNotes} disabled={isPending}>
              Save
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder='Add session notes...'
          className='min-h-30 resize-none'
        />
      ) : (
        <div className='bg-muted/30 min-h-30 rounded-lg p-4'>
          {notes ? (
            <p className='text-sm leading-relaxed whitespace-pre-wrap'>
              {notes}
            </p>
          ) : (
            <p className='text-muted-foreground text-sm italic'>
              No notes available for this session.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default SessionCardNotes
