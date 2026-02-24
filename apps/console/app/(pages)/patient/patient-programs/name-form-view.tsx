import { memo } from 'react'
import { Input } from '@/components/ui/input'
import { PatientProgramForm } from '@/types/models'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../../components/ui/form'
import { useForm } from 'react-hook-form'

interface NameFormViewProps {
  editForm: ReturnType<typeof useForm<PatientProgramForm>>
  onSubmit: (values: PatientProgramForm) => void
}

const NameFormView = memo(function NameFormView({
  editForm,
  onSubmit,
}: NameFormViewProps) {
  return (
    <div className='flex items-center'>
      <Form {...editForm}>
        <form id='program' onSubmit={editForm.handleSubmit(onSubmit)}>
          <FormField
            name='name'
            control={editForm.control}
            render={({ field }) => (
              <FormItem className='grid-cols-[auto_1fr]'>
                <FormLabel>Program Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  )
})

export default NameFormView
