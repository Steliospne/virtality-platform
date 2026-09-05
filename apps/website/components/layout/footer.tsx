import Link from 'next/link'

const Footer = () => {
  return (
    <footer className='border-vital-blue-100 bg-liner-to-b relative border-t-2 from-slate-50 to-white py-16 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900'>
      <div className='container mx-auto px-4 md:px-8'>
        <div className='mb-8 text-center'>
          <p className='mb-2 text-sm font-medium text-slate-600 dark:text-gray-400'>
            © {new Date().getFullYear()} Virtality. All rights reserved.
          </p>
          <p className='text-xs text-slate-500 dark:text-gray-500'>
            Transforming patient recovery through evidence-based virtual reality
            rehabilitation.
          </p>
        </div>
        <div className='mb-6 flex flex-wrap justify-center gap-8'>
          <Link
            href='/privacy'
            className='hover:text-vital-blue-700 dark:hover:text-vital-blue-500 text-sm font-medium text-slate-600 transition-colors dark:text-gray-400'
          >
            Privacy Policy
          </Link>
          <Link
            href='/terms'
            className='hover:text-vital-blue-700 dark:hover:text-vital-blue-500 text-sm font-medium text-slate-600 transition-colors dark:text-gray-400'
          >
            Terms of Service
          </Link>
          <Link
            href='/contact'
            className='hover:text-vital-blue-700 dark:hover:text-vital-blue-500 text-sm font-medium text-slate-600 transition-colors dark:text-gray-400'
          >
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
