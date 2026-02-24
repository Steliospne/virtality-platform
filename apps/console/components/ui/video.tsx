'use client'

import { useState } from 'react'
import ReactPlayer from 'react-player'

interface VideoProps {
  src: string
  controls?: boolean
  className?: string
}

const Video = ({ src, controls = true, className }: VideoProps) => {
  const [play, setPlay] = useState(false)

  return (
    <div onClick={() => setPlay(!play)} className={className}>
      <ReactPlayer
        playing={play}
        src={src || '/placeholder.svg'}
        controls={controls}
      />
    </div>
  )
}

export default Video
