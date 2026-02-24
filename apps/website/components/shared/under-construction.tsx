import { cn } from '@/lib/utils'
import { Construction } from 'lucide-react'

const UnderConstruction = ({ className }: { className?: string }) => {
  return (
    <section className={cn('h-screen-with-nav flex items-center', className)}>
      <div className='flex flex-col w-full items-center gap-6'>
        <div className='w-24 h-24 bg-vital-blue-700/10 rounded-full flex items-center justify-center mx-auto'>
          <Construction className='w-12 h-12 text-vital-blue-700' />
        </div>
        <div className='inline-block bg-vital-blue-700/10 text-vital-blue-700 px-4 py-2 rounded-full text-sm font-medium'>
          Page Under Construction
        </div>
        <h1 className='text-4xl md:text-6xl font-bold text-gray-900 text-center leading-tight'>
          {"We're Building Something"}
          <br />
          <span className='text-vital-blue-700'>Revolutionary</span>
        </h1>
        <p className='text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed'>
          {
            "Our innovative VR rehabilitation platform is coming soon. We're working on cutting-edge technology that will transform patient recovery through virtual reality."
          }
        </p>
      </div>
    </section>
  )
}

export default UnderConstruction
