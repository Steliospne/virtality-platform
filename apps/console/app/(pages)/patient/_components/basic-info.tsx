'use client'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import PhoneInput from '@/components/ui/phone-input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { PatientForm } from '@/types/models'
import { Patient } from '@virtality/db'
import { CalendarIcon, Trash2, Upload, User } from 'lucide-react'
import Image from 'next/image'
import { ChangeEvent, useState } from 'react'
import { ControllerRenderProps, useForm } from 'react-hook-form'
import { format, formatISO } from 'date-fns'
import placeholder from '@/public/placeholder.svg'
import { useClientT } from '@/i18n/use-client-t'

interface BasicInfoProps {
  form: ReturnType<typeof useForm<PatientForm>>
  patient?: Patient
}

const BasicInfo = ({ form, patient }: BasicInfoProps) => {
  const { t } = useClientT(['common'])
  const [previewUrl, setPreviewUrl] = useState<Patient['image']>(null)
  const [hasImage, setImage] = useState(patient?.image ? true : false)
  const [isImageHovered, setIsImageHovered] = useState(false)

  const handlePhotoUpload = (
    event: ChangeEvent<HTMLInputElement>,
    field: ControllerRenderProps<PatientForm, 'image'>,
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      field.onChange(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
        setImage(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setPreviewUrl(null)
    setImage(false)
    if (patient) patient.image = null
    form.setValue('image', null, { shouldDirty: true })
  }

  const handleMouseEnter = () => {
    if (!hasImage) return
    setIsImageHovered(true)
  }

  const handleMouseLeave = () => {
    if (!hasImage) return
    setIsImageHovered(false)
  }

  return (
    <div className='flex gap-6 max-xl:flex-col'>
      {/* Left Container - Patient History */}
      <div className='flex flex-col items-center justify-center space-y-4 rounded-lg border bg-white/80 p-2 backdrop-blur-sm dark:bg-zinc-950'>
        {/* Patient Photo */}

        <div className='relative p-16'>
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className='border-vital-blue-700 relative size-[200px] overflow-hidden rounded-full border-2 bg-slate-100 shadow-lg'
          >
            {isImageHovered && hasImage && (
              <Button
                type='button'
                size='icon'
                variant='ghost'
                onClick={removeImage}
                className='absolute z-10 size-full rounded-full text-red-500 hover:bg-zinc-500/50 hover:text-red-500'
              >
                <Trash2 className='size-6' />
              </Button>
            )}
            {hasImage ? (
              <Image
                height={200}
                width={200}
                alt='Patient'
                src={
                  previewUrl
                    ? previewUrl
                    : patient?.image
                      ? patient.image
                      : placeholder
                }
                className='size-full object-cover'
              />
            ) : (
              <div className='flex size-full items-center justify-center bg-linear-to-br from-slate-200 to-slate-300'>
                <User className='size-12 text-zinc-400' />
              </div>
            )}
          </div>
          <FormField
            control={form.control}
            name='image'
            render={({ field }) => (
              <FormItem className='absolute right-[82px] bottom-[82px] z-20 cursor-pointer'>
                <FormLabel className='rounded-full bg-blue-600 p-2 text-white shadow-lg transition-colors hover:bg-blue-700'>
                  <Upload className='size-4' />
                </FormLabel>
                <FormControl>
                  <Input
                    name='image'
                    type='file'
                    accept='image/*'
                    capture
                    onChange={(event) => handlePhotoUpload(event, field)}
                    className='hidden'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <p className='text-sm text-zinc-500'>Click to upload patient photo</p>
      </div>

      {/* Right Container - Patient Information */}
      <Card className='border bg-white/80 p-0 backdrop-blur-sm'>
        <CardHeader className='from-vital-blue-700 to-vital-blue-600 rounded-t-lg bg-linear-to-br p-2 text-zinc-200'>
          <CardTitle className='flex items-center gap-2'>
            <User className='size-4' />
            Patient Information
          </CardTitle>
          <CardDescription className='text-zinc-200'>
            Basic patient details and demographics
          </CardDescription>
        </CardHeader>
        <CardContent className='flex-1 space-y-6 p-6'>
          {/* Form Fields */}
          <div className='grid gap-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fullName')} *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter patient's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.email')} *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type='email'
                        placeholder='patient@example.com'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.phone')} *</FormLabel>
                    <FormControl>
                      <PhoneInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='dob'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>{t('form.dateOfBirth')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'pl-3 text-left font-normal',
                              (!field.value || !patient?.dob) &&
                                'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={
                            field.value ? new Date(field.value) : new Date()
                          }
                          onSelect={(value) => {
                            if (!value) return
                            field.onChange(
                              formatISO(value, { representation: 'date' }),
                            )
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='sex'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.sex')}</FormLabel>
                    <Select
                      name='sex'
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full shadow-none'>
                          <SelectValue placeholder='Select sex...' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className='bg-white'>
                        <SelectItem value='male'>{t('form.male')}</SelectItem>
                        <SelectItem value='female'>
                          {t('form.female')}
                        </SelectItem>
                        <SelectItem value='other'>{t('form.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='weight'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='70.5' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='height'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='175.0' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='language'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('language', { ns: 'glossary' })}</FormLabel>
                    <Select
                      name='language'
                      onValueChange={field.onChange}
                      value={field.value ?? undefined}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full shadow-none'>
                          <SelectValue placeholder='Select language...' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className='bg-white'>
                        <SelectItem value='Greek'>
                          {t('lng.el', { ns: 'glossary' })}
                        </SelectItem>
                        <SelectItem value='English'>
                          {t('lng.en', { ns: 'glossary' })}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name='occupation'
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              ></FormField>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BasicInfo
