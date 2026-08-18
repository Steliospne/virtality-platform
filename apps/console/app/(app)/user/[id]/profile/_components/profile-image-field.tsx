'use client'
import Image from 'next/image'
import placeholder from '@/public/placeholder.svg'
import { Input } from '@virtality/ui/components/input'
import { ChangeEvent, useState } from 'react'
import { Button } from '@virtality/ui/components/button'
import { shouldBypassVercelImageOptimization } from '@virtality/shared/utils'
import { ControllerRenderProps } from 'react-hook-form'
import { Trash2, UserIcon } from 'lucide-react'
import { FieldLabel } from '@/components/ui/field'
import { type SessionUser, type UserForm } from './profile-info-form'

type AvatarState = {
  previewUrl: string | null
  hasImage: boolean
  isImageHovered: boolean
}

interface ImageFieldProps {
  field: ControllerRenderProps<UserForm, 'image'>
  user: SessionUser
  previewReset?: () => void
}

export const ImageField = ({ field, user }: ImageFieldProps) => {
  const [avatarState, setAvatarState] = useState<AvatarState>({
    previewUrl: null,
    hasImage: user?.image ? true : false,
    isImageHovered: false,
  })

  const handleMouseEnter = () => {
    if (!avatarState.hasImage) return
    setAvatarState({ ...avatarState, isImageHovered: true })
  }

  const handleMouseLeave = () => {
    if (!avatarState.hasImage) return
    setAvatarState({ ...avatarState, isImageHovered: false })
  }

  const removeImage = () => {
    setAvatarState({ previewUrl: null, hasImage: false, isImageHovered: false })
    field.onChange(null)
  }

  const handlePhotoUpload = (
    event: ChangeEvent<HTMLInputElement>,
    field: ControllerRenderProps<UserForm, 'image'>,
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      field.onChange(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarState({
          ...avatarState,
          previewUrl: e.target?.result as string,
          hasImage: true,
          isImageHovered: false,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <FieldLabel
      htmlFor={field.name}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className='border-vital-blue-700 relative ml-auto size-24! cursor-pointer overflow-hidden rounded-full border-2 bg-slate-100 shadow-lg'
    >
      {avatarState.isImageHovered && avatarState.hasImage && (
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
      {avatarState.hasImage ? (
        <Image
          height={200}
          width={200}
          alt='Patient'
          src={
            avatarState.previewUrl
              ? avatarState.previewUrl
              : user?.image
                ? user.image
                : placeholder
          }
          unoptimized={shouldBypassVercelImageOptimization(
            avatarState.previewUrl || user?.image,
          )}
          className='size-full object-cover'
        />
      ) : (
        <div className='flex size-full items-center justify-center bg-linear-to-br from-slate-200 to-slate-300'>
          <UserIcon className='size-12 text-zinc-400' />
        </div>
      )}

      <Input
        type='file'
        accept='image/*'
        name={field.name}
        id={field.name}
        hidden
        onChange={(e) => {
          handlePhotoUpload(
            e,
            field as ControllerRenderProps<UserForm, 'image'>,
          )
        }}
      />
    </FieldLabel>
  )
}
