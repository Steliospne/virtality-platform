'use client'

import { useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'

const PromoVideo = () => {
  const [isPlaying, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const handleVideoPlayback = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    if (isPlaying) {
      return video.pause()
    }

    video.play()
    video.onplay = (_event) => {
      setPlaying(true)
    }

    video.onpause = (_event) => {
      setPlaying(false)
    }
  }

  return (
    <section
      id='promo-section'
      className='relative min-h-screen-with-nav items-center justify-center flex py-20 overflow-hidden'
    >
      {/* Background */}
      <div className='absolute inset-0 bg-slate-900'></div>
      <div
        className='absolute inset-0 opacity-5'
        style={{
          backgroundImage: `
            radial-gradient(circle at 2px 2px, #0cd8f3 1px, transparent 0)
          `,
          backgroundSize: '40px 40px',
        }}
      ></div>

      {/* Gradient orbs */}
      <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-vital-blue-600/20 rounded-full blur-3xl'></div>
      <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-vital-blue-500/20 rounded-full blur-3xl'></div>

      <div className='container relative z-10 m-auto px-4 md:px-8'>
        <div className='max-w-5xl mx-auto'>
          {/* Section header */}
          <div className='text-center mb-12'>
            <div className='inline-flex items-center gap-2 rounded-full bg-vital-blue-700/20 px-4 py-2 text-sm font-semibold text-vital-blue-300 mb-6'>
              <span>Product Demonstration</span>
            </div>
            <h2 className='text-3xl md:text-4xl font-bold text-white mb-4'>
              See Virtality in Action
            </h2>
            <p className='text-lg text-slate-300 max-w-2xl mx-auto'>
              Watch how our VR platform transforms rehabilitation therapy and
              improves patient outcomes
            </p>
          </div>

          {/* Video container */}
          <div className='relative aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-vital-blue-700/30 group'>
            {/* Video frame decoration */}
            <div className='absolute -inset-1 bg-gradient-to-r from-vital-blue-600 to-vital-blue-500 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity'></div>

            <div className='relative bg-black rounded-xl overflow-hidden'>
              <video
                ref={videoRef}
                controls
                controlsList='nodownload'
                src='https://cdn.virtality.app/virtality-promo-web-latest.mp4'
                className='w-full'
              />
              {!isPlaying && (
                <div
                  className='absolute inset-0 bg-gradient-to-br from-vital-blue-900/40 to-slate-900/60 backdrop-blur-[2px] flex items-center justify-center cursor-pointer group/play'
                  role='button'
                  onClick={handleVideoPlayback}
                >
                  <div className='relative'>
                    {/* Pulse rings */}
                    <div className='absolute inset-0 bg-vital-blue-600/30 rounded-full animate-ping'></div>
                    <div className='absolute inset-0 bg-vital-blue-600/20 rounded-full animate-pulse'></div>

                    {/* Play button */}
                    <div className='relative bg-gradient-to-br from-vital-blue-700 to-vital-blue-600 rounded-full w-20 h-20 flex items-center justify-center text-white shadow-2xl shadow-vital-blue-700/50 group-hover/play:scale-110 transition-transform'>
                      <Play className='w-8 h-8 ml-1' />
                    </div>
                  </div>

                  {/* Text overlay */}
                  <div className='absolute bottom-8 left-8 right-8 text-white'>
                    <div className='bg-black/50 backdrop-blur-md rounded-lg p-4 border border-white/10'>
                      <p className='text-sm font-medium mb-1'>
                        Clinical VR Platform Overview
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video stats */}
          <div className='mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center'>
            <div>
              <div className='text-2xl font-bold text-vital-blue-400 mb-1 font-(--font-jetbrains-mono)'>
                100+
              </div>
              <div className='text-sm text-slate-400'>Exercises</div>
            </div>
            <div>
              <div className='text-2xl font-bold text-vital-blue-400 mb-1 font-(--font-jetbrains-mono)'>
                Real-time
              </div>
              <div className='text-sm text-slate-400'>Biofeedback</div>
            </div>
            <div>
              <div className='text-2xl font-bold text-vital-blue-400 mb-1 font-(--font-jetbrains-mono)'>
                Cloud
              </div>
              <div className='text-sm text-slate-400'>Data Analytics</div>
            </div>
            <div>
              <div className='text-2xl font-bold text-vital-blue-400 mb-1 font-(--font-jetbrains-mono)'>
                Custom
              </div>
              <div className='text-sm text-slate-400'>Treatment Plans</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PromoVideo
