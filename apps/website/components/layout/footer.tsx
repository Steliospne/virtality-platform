import Link from 'next/link'

const Footer = () => {
  return (
    <footer className='relative border-t-2 border-vital-blue-100 bg-liner-to-b from-slate-50 to-white py-16 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900'>
      <div className='container mx-auto px-4 md:px-8'>
        <div className='text-center mb-8'>
          <p className='text-slate-600 dark:text-gray-400 text-sm font-medium mb-2'>
            © 2025 Virtality. All rights reserved.
          </p>
          <p className='text-slate-500 dark:text-gray-500 text-xs'>
            Transforming patient recovery through evidence-based virtual reality
            rehabilitation.
          </p>
        </div>
        <div className='flex flex-wrap justify-center gap-8 mb-6'>
          <Link
            href='/privacy'
            className='text-slate-600 hover:text-vital-blue-700 dark:text-gray-400 dark:hover:text-vital-blue-500 text-sm font-medium transition-colors'
          >
            Privacy Policy
          </Link>
          <Link
            href='/terms'
            className='text-slate-600 hover:text-vital-blue-700 dark:text-gray-400 dark:hover:text-vital-blue-500 text-sm font-medium transition-colors'
          >
            Terms of Service
          </Link>
          <Link
            href='/contact'
            className='text-slate-600 hover:text-vital-blue-700 dark:text-gray-400 dark:hover:text-vital-blue-500 text-sm font-medium transition-colors'
          >
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
