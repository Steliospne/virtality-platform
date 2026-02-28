'use client'
import { Input } from './ui/input'
import { Label } from './ui/label'
import Image from 'next/image'
import placeHolderImage from '@/public/placeholder.svg'
import { Camera, X } from 'lucide-react'
import {
  ChangeEventHandler,
  useActionState,
  useEffect,
  useRef,
  useState,
} from 'react'
import { uploadFileAction } from '@/lib/actions/generalActions'
const initialState = {
  validationErrors: null,
  values: null,
}
interface UploadResourceProps {
  rowId: string
  rowIndex: number
  typeName: string
  onImageUploaded?: (imageUrl: string, rowIndex: number) => void
}
const UploadResource = ({
  rowIndex,
  rowId,
  typeName,
  onImageUploaded,
}: UploadResourceProps) => {
  const [formState, formAction] = useActionState(uploadFileAction, initialState)
  // Notify parent component when upload is successful
  const hasCalledRef = useRef(false)

  useEffect(() => {
    if (formState.values && onImageUploaded && !hasCalledRef.current) {
      onImageUploaded(formState.values, rowIndex)
      hasCalledRef.current = true // otherwise it re-renders forever
    }
  }, [formState.values, onImageUploaded, rowIndex])

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    if (e.target.files) {
      const file = e.target.files[0]
      setPreviewUrl(URL.createObjectURL(file))
    }
  }
  return (
    <>
      {' '}
      <div className='flex flex-col gap-4'>
        <form action={formAction} className='flex flex-col gap-4'>
          <Label
            htmlFor='image'
            className='relative m-auto hover:cursor-pointer'
          >
            <button
              disabled={!previewUrl}
              type='button'
              className='absolute top-[4px] left-[117px] z-10 m-auto rounded-full bg-white p-1 dark:bg-zinc-800'
              onClick={() => {
                setPreviewUrl(null)
              }}
            >
              <X className='z-10 m-auto text-red-700 transition-transform hover:scale-125 hover:opacity-80' />
            </button>
            <Input
              id='typeName'
              name='typeName'
              type='string'
              className='hidden'
              defaultValue={typeName}
            />

            <Input
              id='itemId'
              name='itemId'
              type='string'
              className='hidden'
              defaultValue={rowId}
            />
            <Input
              id='image'
              name='image'
              type='file'
              accept='image/png, image/jpeg'
              onChange={handleInputChange}
              className='hidden'
            />
            <div className='relative m-auto flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-full'>
              {
                <>
                  <Image
                    fill={true}
                    className='z-0 h-full w-full object-cover contrast-50'
                    src={previewUrl ? previewUrl : placeHolderImage}
                    alt='User image'
                  />
                  <Camera className='z-10 dark:text-zinc-200' />
                </>
              }
            </div>
          </Label>
          <button
            disabled={!previewUrl}
            type='submit'
            className='m-auto cursor-pointer rounded-lg bg-amber-600 p-2 text-white'
          >
            Upload File
          </button>
        </form>
      </div>
    </>
  )
}

export default UploadResource
