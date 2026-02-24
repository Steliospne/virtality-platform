import { motion } from 'motion/react'
import { Frown } from 'lucide-react'
import { toast } from 'react-toastify'

export const ErrorToastySettings = {
  autoClose: 2000,
  className: 'border border-red-500',
  progressClassName: 'bg-red-500',
  hideProgressBar: true,
}

const ErrorToasty = (message: string) => {
  return toast(
    () => (
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{
          x: 0,
          opacity: 1,
          transition: { type: 'spring', stiffness: 300, damping: 20 },
        }}
        exit={{ opacity: 0, x: '100%' }}
        whileInView={{
          x: [0, -10, 10, -8, 8, -4, 4, 0],
          transition: { duration: 0.6 },
        }}
        style={{ width: '100%' }}
        className='flex items-center gap-2'
      >
        <Frown />
        <span>{message}</span>
      </motion.div>
    ),
    ErrorToastySettings,
  )
}

export default ErrorToasty
