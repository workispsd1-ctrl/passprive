'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Folder, Image as ImageIcon, X, type LucideIcon } from 'lucide-react'
import { DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { t, tMin } from '@/components/sections/dining/designUnit'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif'

function Option({ label, Icon, onClick }: { label: string; Icon: LucideIcon; onClick: () => void }) {
  return (
    <button type='button' onClick={onClick} className='flex w-full items-center border border-[#E5E7EB] bg-[#F9FAFB] text-left font-medium text-[#252427] hover:bg-[#F3F4F6]' style={{ height: tMin(72, 52), gap: tMin(16, 10), borderRadius: t(16), padding: tMin(16, 10), fontSize: tMin(16, 13) }}>
      <span className='flex shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] bg-white' style={{ width: tMin(40, 30), height: tMin(40, 30) }}><Icon className='text-[#666666]' strokeWidth={2} style={{ width: tMin(20, 15), height: tMin(20, 15) }} /></span>
      <span className='min-w-0 flex-1'>{label}</span>
      <svg viewBox='0 0 6 12' fill='none' aria-hidden='true' className='shrink-0' style={{ width: tMin(6, 5), height: tMin(12, 10) }}>
        <path d='M1 2l4 4-4 4' stroke='#666666' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
      </svg>
    </button>
  )
}

/** Figma "Add image(s)": camera, gallery or files. Laptops have no native camera picker, so it opens here. */
export function ReviewImagePicker({ remaining, onAdd, onCancel }: { remaining: number; onAdd: (files: File[]) => void; onCancel: () => void }) {
  const captureRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const filesRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [camera, setCamera] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!camera) return
    let stream: MediaStream | null = null
    let live = true
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        if (!live) { s.getTracks().forEach(track => track.stop()); return }
        stream = s
        if (videoRef.current) videoRef.current.srcObject = s
      })
      .catch(() => {
        setCamera(false)
        setError('We couldn’t open your camera. Allow access, or choose an image instead.')
      })
    return () => {
      live = false
      stream?.getTracks().forEach(track => track.stop())
    }
  }, [camera])

  function takePhoto() {
    setError('')
    // phones and tablets open their own camera from the file input
    if (window.matchMedia('(pointer: coarse)').matches) captureRef.current?.click()
    else if (navigator.mediaDevices) setCamera(true)
    else setError('Your browser can’t open a camera here. Choose an image instead.')
  }

  function capture() {
    const video = videoRef.current
    if (!video?.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      if (blob) onAdd([new File([blob], 'camera.jpg', { type: 'image/jpeg' })])
    }, 'image/jpeg', 0.9)
  }

  function picked(list: FileList | null) {
    const files = Array.from(list ?? []).slice(0, remaining)
    if (files.length) onAdd(files)
  }

  const header = (title: string, close: () => void) => (
    <div className='flex items-center justify-between' style={{ minHeight: t(32) }}>
      <DialogTitle className='font-bold text-[#161616]' style={{ fontSize: tMin(24, 17), lineHeight: 1.29 }}>{title}</DialogTitle>
      <button type='button' onClick={close} aria-label='Close' className='flex items-center justify-center rounded-full text-[#404045] hover:bg-gray-100' style={{ width: tMin(32, 24), height: tMin(32, 24) }}>
        <X className='size-full' strokeWidth={1.5} />
      </button>
    </div>
  )

  const outline = 'flex items-center justify-center border border-[#FF4800] font-semibold tracking-[-0.02em] text-[#FF4800] hover:bg-brand-tint'
  const buttonSize = { width: tMin(120, 84), height: tMin(48, 36), borderRadius: t(27), fontSize: tMin(16, 13) }

  if (camera) {
    return (
      <>
        {header('Take a photo', () => setCamera(false))}
        <DialogDescription className='sr-only'>Your camera preview</DialogDescription>
        <video ref={videoRef} autoPlay playsInline muted className='aspect-4/3 w-full rounded-2xl bg-black object-cover' style={{ marginTop: t(32) }} />
        <div className='flex justify-end' style={{ marginTop: t(32), gap: tMin(16, 10) }}>
          <button type='button' onClick={() => setCamera(false)} className={outline} style={buttonSize}>Back</button>
          <button type='button' onClick={capture} className='flex items-center justify-center bg-[#FF4800] font-semibold tracking-[-0.02em] text-white hover:bg-brand-dark' style={buttonSize}>Capture</button>
        </div>
      </>
    )
  }

  return (
    <>
      {header('Add image(s)', onCancel)}
      <DialogDescription className='sr-only'>Choose where your images come from</DialogDescription>
      <div className='flex flex-col' style={{ marginTop: t(32), gap: t(12) }}>
        <Option label='Take a photo' Icon={Camera} onClick={takePhoto} />
        <Option label='Choose from gallery' Icon={ImageIcon} onClick={() => galleryRef.current?.click()} />
        <Option label='Choose from files' Icon={Folder} onClick={() => filesRef.current?.click()} />
      </div>
      {error && <p role='alert' className='mt-3 text-[13px] font-semibold text-[#E23B3B]'>{error}</p>}
      <div className='flex justify-end' style={{ marginTop: t(32), gap: tMin(16, 10) }}>
        <button type='button' onClick={onCancel} className={outline} style={buttonSize}>Cancel</button>
      </div>
      <input ref={captureRef} type='file' accept='image/*' capture='environment' hidden onChange={e => { picked(e.target.files); e.target.value = '' }} />
      <input ref={galleryRef} type='file' accept='image/*' multiple hidden onChange={e => { picked(e.target.files); e.target.value = '' }} />
      <input ref={filesRef} type='file' accept={ACCEPT} multiple hidden onChange={e => { picked(e.target.files); e.target.value = '' }} />
    </>
  )
}
