import { motion } from 'motion/react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'react-toastify'

export const NotifyDoctorToastySettings = {
  autoClose: 10000,
  className: 'border-2 border-amber-500 bg-amber-500/10',
  progressClassName: 'bg-amber-500',
  hideProgressBar: false,
}

const playNotifySound = () => {
  try {
    const audioContext = new (
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    )()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.15,
    )
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.15)
    setTimeout(() => {
      const osc2 = audioContext.createOscillator()
      const gain2 = audioContext.createGain()
      osc2.connect(gain2)
      gain2.connect(audioContext.destination)
      osc2.frequency.value = 800
      osc2.type = 'sine'
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime)
      gain2.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.15,
      )
      osc2.start(audioContext.currentTime)
      osc2.stop(audioContext.currentTime + 0.15)
    }, 150)
  } catch {
    // Ignore if audio fails (e.g. user gesture required)
  }
}

const NotifyDoctorToasty = (message: string) => {
  playNotifySound()
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
        className='flex items-center gap-3'
      >
        <AlertTriangle className='size-6 shrink-0 text-amber-500' />
        <span className='font-medium'>{message}</span>
      </motion.div>
    ),
    NotifyDoctorToastySettings,
  )
}

export default NotifyDoctorToasty
