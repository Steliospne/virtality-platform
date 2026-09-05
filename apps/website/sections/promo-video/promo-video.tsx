'use client'

import { usePromoVideo } from '@/lib/marketing-queries'
import { Play } from 'lucide-react'
import { useRef, useState } from 'react'

const PROMO_VIDEO_POSTER_URL = '/promo_video_poster.png'

const PromoVideo = () => {
  const { data: promoVideo, isPending } = usePromoVideo()
  const [isPlaying, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const handleVideoPlayback = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    if (isPlaying) {
      return video.pause()
    }

    video.play()
    video.onplay = () => {
      setPlaying(true)
    }

    video.onpause = () => {
      setPlaying(false)
    }
  }

  if (isPending || !promoVideo?.cdnUrl) {
    return null
  }

  return (
    <section
      id='promo-section'
      className='min-h-screen-with-nav relative flex items-center justify-center overflow-hidden py-20'
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
      <div className='bg-vital-blue-600/20 absolute top-1/4 left-1/4 h-96 w-96 rounded-full blur-3xl'></div>
      <div className='bg-vital-blue-500/20 absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full blur-3xl'></div>

      <div className='relative z-10 container m-auto px-4 md:px-8'>
        <div className='mx-auto max-w-5xl'>
          {/* Section header */}
          <div className='mb-12 text-center'>
            <div className='bg-vital-blue-700/20 text-vital-blue-300 mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold'>
              <span>Product Demonstration</span>
            </div>
            <h2 className='mb-4 text-3xl font-bold text-white md:text-4xl'>
              Virtality in Action
            </h2>
            <p className='mx-auto max-w-2xl text-lg text-slate-300'>
              Retrain the brain. Restore physical movement.
            </p>
          </div>

          {/* Video container */}
          <div className='border-vital-blue-700/30 group relative aspect-video overflow-hidden rounded-2xl border-2 shadow-2xl'>
            {/* Video frame decoration */}
            <div className='from-vital-blue-600 to-vital-blue-500 absolute -inset-1 rounded-2xl bg-linear-to-r opacity-0 blur transition-opacity group-hover:opacity-100'></div>

            <div className='relative overflow-hidden rounded-xl bg-black'>
              <video
                ref={videoRef}
                controls
                controlsList='nodownload'
                poster={PROMO_VIDEO_POSTER_URL}
                src={promoVideo.cdnUrl}
                className='w-full'
              />
              {!isPlaying && (
                <div
                  className='from-vital-blue-900/40 group/play absolute inset-0 flex cursor-pointer items-center justify-center bg-linear-to-br to-slate-900/60 backdrop-blur-[2px]'
                  role='button'
                  onClick={handleVideoPlayback}
                >
                  <div className='relative'>
                    {/* Pulse rings */}
                    <div className='bg-vital-blue-600/30 absolute inset-0 animate-ping rounded-full'></div>
                    <div className='bg-vital-blue-600/20 absolute inset-0 animate-pulse rounded-full'></div>

                    {/* Play button */}
                    <div className='from-vital-blue-700 to-vital-blue-600 shadow-vital-blue-700/50 relative flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br text-white shadow-2xl transition-transform group-hover/play:scale-110'>
                      <Play className='ml-1 h-8 w-8' />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video stats */}
          <div className='mt-12 grid grid-cols-2 gap-6 text-center md:grid-cols-4'>
            <div>
              <div className='text-vital-blue-400 mb-1 text-2xl font-bold'>
                100+
              </div>
              <div className='text-sm text-slate-400'>Exercises</div>
            </div>
            <div>
              <div className='text-vital-blue-400 mb-1 text-2xl font-bold'>
                Real-time
              </div>
              <div className='text-sm text-slate-400'>Biofeedback</div>
            </div>
            <div>
              <div className='text-vital-blue-400 mb-1 text-2xl font-bold'>
                Cloud
              </div>
              <div className='text-sm text-slate-400'>Data Analytics</div>
            </div>
            <div>
              <div className='text-vital-blue-400 mb-1 text-2xl font-bold'>
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
