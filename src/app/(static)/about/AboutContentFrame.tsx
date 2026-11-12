'use client'

import { useRef, useState } from 'react'

// app parity: AboutAppScreen buildHtmlDocument — the CMS HTML in its own styled document
const STYLE = `
  body { margin: 0; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 500; color: rgba(44,45,50,1); font-size: 14px; line-height: 22px; }
  h1,h2,h3,h4,h5,h6 { color: #130E18; line-height: 1.3; }
  li { margin-bottom: 6px; }
  a { color: #FF4800; text-decoration: none; }
  blockquote { margin: 0; padding: 8px 12px; background: #F7F3FC; border-left: 3px solid #FF4800; border-radius: 8px; }
  table { border-collapse: collapse; } th, td { text-align: left; }
  img { max-width: 100%; height: auto; border-radius: 10px; }
`

/**
 * Renders CMS HTML the way the app's WebView does: in a sandboxed frame with
 * scripts disabled, so nothing in the content can run on this site. Same-origin
 * is allowed only so the frame can be sized to its content.
 */
export function AboutContentFrame({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(200)

  return (
    <iframe
      ref={ref}
      title='About PassPrivé'
      sandbox='allow-same-origin allow-popups'
      srcDoc={`<!doctype html><html><head><meta charset="utf-8"><base target="_blank"><style>${STYLE}</style></head><body>${html}</body></html>`}
      onLoad={() => {
        const doc = ref.current?.contentDocument
        if (doc) setHeight(doc.documentElement.scrollHeight)
      }}
      className='block w-full border-0'
      style={{ height }}
    />
  )
}
