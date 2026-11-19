'use client'

import { useState } from 'react'
import { Heart, type LucideProps } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A save heart that pops when it's switched on — app parity:
 * AnimatedSaveHeart (1.4× in 150ms, then a spring back). Only a change to
 * saved pops it, not a heart that was already saved when the page opened.
 */
export function PopHeart({ saved, className, style, ...props }: LucideProps & { saved: boolean }) {
  const [prev, setPrev] = useState(saved)
  const [pop, setPop] = useState(0)
  // the previous value, tracked during render (React's pattern for reacting to a prop change)
  if (saved !== prev) {
    setPrev(saved)
    if (saved) setPop(n => n + 1)
  }
  return (
    <Heart
      key={pop}
      {...props}
      className={cn('pp-motion', className)}
      style={{ ...style, animation: pop ? 'pp-heart-pop 450ms ease-out' : style?.animation }}
    />
  )
}
