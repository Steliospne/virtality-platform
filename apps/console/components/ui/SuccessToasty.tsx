import { CheckCircle } from 'lucide-react'
import { toast } from 'react-toastify'

export const SuccessToastySettings = {
  autoClose: 2000,
  className: 'border border-green-500',
  progressClassName: 'bg-green-500',
  hideProgressBar: true,
}

const SuccessToasty = (message: string) => {
  // return <div className={className}>{children}</div>;
  return toast(
    () => (
      <div className='flex gap-2'>
        <CheckCircle />
        <span>{message}</span>
      </div>
    ),
    SuccessToastySettings,
  )
}

export default SuccessToasty
