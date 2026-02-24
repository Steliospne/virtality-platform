'use client'
import React, { ChangeEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ControllerRenderProps, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import Image from 'next/image'
import { CheckCircle, Loader2, Trash2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { createBugReport } from '@/lib/actions'
import { BugReportForm as BugReportFormType } from '@/types/models'
import { BugReportFormSchema } from '@/lib/definitions'
import { useClientT } from '@/i18n/use-client-t'
import capitalize from 'lodash.capitalize'
import { P } from './typography'

interface BugReportFormProps {
  children: React.ReactNode
}

export const BugReportForm = ({ children }: BugReportFormProps) => {
  const { t } = useClientT('common')
  const [imageFiles, setImageFiles] = useState<
    { previewUrl: string; file: File }[]
  >([])
  const [isDialogOpen, setDialogOpen] = useState(false)

  const {
    mutate: createReport,
    isPending,
    isSuccess,
    reset,
  } = useMutation({
    mutationFn: createBugReport,
    onSuccess: () => handleClearForm(),
  })

  const form = useForm<BugReportFormType>({
    resolver: zodResolver(BugReportFormSchema),
    defaultValues: {
      title: '',
      platform: undefined,
      description: '',
      image: undefined,
    },
  })

  const handlePhotoUpload = (
    event: ChangeEvent<HTMLInputElement>,
    field: ControllerRenderProps<BugReportFormType, 'image'>,
  ) => {
    const files = Array.from(event.target.files || [])

    if (files.length > 0) {
      files.forEach((file) => {
        const reader = new FileReader()

        reader.onload = () => {
          const previewUrl = reader.result as string
          setImageFiles((prev) => [...prev, { file, previewUrl }])
        }
        reader.readAsDataURL(file)
      })

      event.target.value = ''
    } else {
      setImageFiles([])

      field.onChange(undefined)
    }
  }

  const handlePhotoRemoval = (url: string) => {
    const newPreviewUrls = imageFiles.filter((file) => file.previewUrl !== url)
    setImageFiles(newPreviewUrls)
  }

  const handleClearForm = () => {
    form.reset()
    setImageFiles([])
  }

  const handleDialogToggle = (open: boolean) => {
    if (isSuccess) {
      reset()
    }
    setDialogOpen(open)
  }

  function onSubmit(values: BugReportFormType) {
    const image = imageFiles.map((_file) => _file.file)
    createReport({ ...values, image })
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogToggle}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='max-h-[700px] overflow-auto sm:max-w-[525px] dark:bg-zinc-900'>
        {isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                Report submitted <CheckCircle className='text-green-500' />
              </DialogTitle>
              <P>Thank you for taking the time to make our platform better.</P>
              <P>Hang in tight while we work to resolve the issue.</P>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button>{t('btn.close')}</Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Report a Bug</DialogTitle>
              <DialogDescription>
                Fill out the form below to report a bug.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-4'
              >
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-right'>
                        {capitalize(t('form.title'))}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder='Bug title' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='platform'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-right'>
                        {capitalize(t('platform', { ns: 'glossary' }))}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ''}
                      >
                        <FormControl className='col-span-3'>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='Select platform' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='web'>
                            Web {capitalize(t('platform', { ns: 'glossary' }))}
                          </SelectItem>
                          <SelectItem value='vr'>
                            VR{' '}
                            {capitalize(t('application', { ns: 'glossary' }))}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-right'>
                        {capitalize(t('form.description'))}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Describe the bug...'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='image'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex flex-col items-start text-right'>
                        <span>{'Image'}</span>
                        <span className='w-full rounded-md border p-2 text-left'>
                          Choose Files
                          <span className='font-normal'>
                            {imageFiles.length === 0
                              ? ' No files chosen'
                              : ` ${imageFiles.length} File(s) chosen`}
                          </span>
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='file'
                          accept='image/*'
                          onChange={(event) => {
                            handlePhotoUpload(event, field)
                          }}
                          multiple
                          className='hidden'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {imageFiles.length > 0 && (
                  <div className='flex flex-wrap gap-2 pt-2'>
                    {imageFiles.map((file, index) => (
                      <div key={index} className='relative'>
                        <Image
                          src={file.previewUrl}
                          alt={`Preview ${index + 1}`}
                          width={80}
                          height={80}
                          className='size-20 rounded-md object-cover'
                        />
                        <div
                          onClick={() => handlePhotoRemoval(file.previewUrl)}
                          className='absolute top-0 flex size-20 cursor-pointer items-center rounded-md hover:bg-zinc-200/20 [&_svg]:hidden hover:[&_svg]:block'
                        >
                          <Trash2 className='mx-auto text-red-500' />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleClearForm}
                  >
                    {t('btn.clear')}
                  </Button>
                  <Button variant='primary'>
                    {isPending ? (
                      <Loader2 className='animate-spin' />
                    ) : (
                      t('btn.submit')
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
