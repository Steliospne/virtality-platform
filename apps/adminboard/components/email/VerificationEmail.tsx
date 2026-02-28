/* eslint-disable @next/next/no-img-element */
import type React from 'react'

interface EmailPreviewProps {
  firstName: string
  verificationUrl: string
}

export const EmailPreview = ({
  firstName = 'User',
  verificationUrl = 'https://example.com/verify',
}: EmailPreviewProps) => {
  return (
    <div className='bg-gray-100 p-4 font-sans'>
      <div className='mx-auto max-w-[600px] p-4'>
        <div className='rounded-lg border border-gray-200 bg-white p-8 shadow-sm'>
          <img
            src='/placeholder.svg?height=48&width=48'
            width='48'
            height='48'
            alt='Logo'
            className='mx-auto mb-4'
          />
          <h1 className='mb-6 text-center text-xl font-bold text-gray-800'>
            Verify your email address
          </h1>
          <p className='mb-6 text-gray-600'>Hello {firstName},</p>
          <p className='mb-6 text-gray-600'>
            Thank you for signing up! To complete your registration and verify
            your email address, please click the button below:
          </p>
          <a
            className='block w-full rounded-md bg-blue-600 px-6 py-3 text-center font-medium text-white'
            href={verificationUrl}
          >
            Verify Email Address
          </a>
          <p className='mt-6 text-sm text-gray-500'>
            {`If the button above doesn't work, you can also copy and paste the following link into your browser:`}
          </p>
          <p className='text-sm break-all text-blue-600'>
            <a href={verificationUrl} className='text-blue-600 no-underline'>
              {verificationUrl}
            </a>
          </p>
          <hr className='my-6 border-t border-gray-300' />
          <p className='text-center text-xs text-gray-500'>
            {
              "If you didn't create an account, you can safely ignore this email."
            }
          </p>
          <p className='text-center text-xs text-gray-500'>
            © {new Date().getFullYear()} Virtality. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default EmailPreview
