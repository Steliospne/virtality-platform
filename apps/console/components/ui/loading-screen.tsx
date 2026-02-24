'use client'

import { motion, Variants } from 'motion/react'
import { useEffect, useState } from 'react'

export default function LoadingScreen() {
  const text = 'Loading...'
  const [key, setKey] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setKey((prev) => prev + 1)
    }, 3000) // Restart animation every 3 seconds

    return () => clearInterval(interval)
  }, [])

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const letterVariants: Variants = {
    hidden: {
      x: 100,
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 200,
        mass: 0.8,
      },
    },
  }

  return (
    <div className='flex flex-1 items-center justify-center'>
      <motion.div
        key={key}
        className='text-foreground flex font-mono text-4xl font-semibold tracking-wider'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        {text.split('').map((char, index) => (
          <motion.span
            key={index}
            variants={letterVariants}
            className='mx-1 inline-block'
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.div>
    </div>
  )
}
