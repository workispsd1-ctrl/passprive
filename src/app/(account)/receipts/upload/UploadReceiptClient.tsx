'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Camera, CloudUpload, ImageIcon, Info, Loader2, RefreshCw, X } from 'lucide-react'
import { RECEIPT_ACCEPT, RECEIPT_MAX_BYTES, type ReceiptClaim } from '@/lib/receipts'
import { cn } from '@/lib/utils'

type Merchant = { id: string; name: string; kind: 'restaurant' | 'store' }

function todayIso() {
  // en-CA formats as YYYY-MM-DD; Mauritius is the merchant's calendar
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Indian/Mauritius' })
}

/** The printed-bill tip — app parity: the upload / review screens' yellow note. */
export function ReceiptTip({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-3 rounded-xl bg-[#FFF1CF] px-4.5 py-3 text-[12px] leading-4 font-medium text-[#252525]">
      <Info className="mt-px size-4 shrink-0 text-[#C08A00]" />
      <span>{children}</span>
    </p>
  )
}

/**
 * Pick → review → submit. The app reads the total off the photo on-device;
 * the browser has no OCR, so the member types the total and date, which the
 * reviewer checks against the photo.
 */
export function UploadReceiptClient({
  merchant,
  backHref,
  dealId,
}: {
  merchant: Merchant
  backHref: string
  dealId: string | null
}) {
  const router = useRouter()
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [previewFailed, setPreviewFailed] = useState(false)
  const [amount, setAmount] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [rejection, setRejection] = useState('')
  const [dragging, setDragging] = useState(false)

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  function choose(next: File | null | undefined) {
    if (!next) return
    if (!next.type.startsWith('image/') && !/\.(heic|heif)$/i.test(next.name)) {
      setError('This file type is not supported. Please upload a JPG, PNG or HEIC photo of your receipt.')
      return
    }
    if (next.size > RECEIPT_MAX_BYTES) {
      setError('This photo is too large. Please upload a photo under 10 MB.')
      return
    }
    setError('')
    setRejection('')
    setPreviewFailed(false)
    setFile(next)
    setPreview(URL.createObjectURL(next))
  }

  function retake() {
    setFile(null)
    setPreview('')
    setRejection('')
    setError('')
    cameraRef.current?.click()
  }

  async function submit() {
    if (!file || busy || rejection) return
    setBusy(true)
    setError('')
    const form = new FormData()
    form.set('file', file)
    form.set(merchant.kind === 'store' ? 'storeId' : 'restaurantId', merchant.id)
    if (dealId) form.set('dealId', dealId)
    if (amount) form.set('billAmount', amount)
    if (purchaseDate) form.set('purchaseDate', purchaseDate)
    const res = await fetch('/api/receipts', { method: 'POST', body: form }).catch(() => null)
    const data = (await res?.json().catch(() => null)) as { claim?: ReceiptClaim; rejection?: string; error?: string } | null
    setBusy(false)
    if (data?.rejection) { setRejection(data.rejection); return }
    if (!res?.ok || !data?.claim) {
      setError(data?.error ?? 'No internet connection. Please check your connection and try again.')
      return
    }
    router.replace(`/receipts/${data.claim.id}?submitted=1`)
  }

  const inputs = (
    <>
      <input ref={cameraRef} type="file" accept={RECEIPT_ACCEPT} capture="environment" hidden onChange={e => { choose(e.target.files?.[0]); e.target.value = '' }} />
      <input ref={galleryRef} type="file" accept={RECEIPT_ACCEPT} hidden onChange={e => { choose(e.target.files?.[0]); e.target.value = '' }} />
    </>
  )

  if (!file) {
    return (
      <div className="mx-auto flex max-w-md flex-col px-4 pt-6 pb-10 font-(family-name:--font-dm-sans)">
        {inputs}
        <p className="text-center text-[14px] font-medium text-[#6B7280]">
          Receipt from <span className="font-bold text-[#2C2D32]">{merchant.name}</span>
        </p>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); choose(e.dataTransfer.files?.[0]) }}
          className={cn(
            'mx-auto mt-6 flex h-84 w-full max-w-79 flex-col items-center justify-center gap-6 rounded-[20px] border-[1.5px] border-dashed bg-[#F8F8F8] transition-colors',
            dragging ? 'border-brand bg-brand-tint' : 'border-[#929292] hover:border-brand',
          )}
        >
          <CloudUpload className="size-20 text-[#9CA3AF]" strokeWidth={1.2} />
          <span className="text-[16px] font-medium tracking-[-0.32px] text-[#6B7280]">Upload your receipt</span>
        </button>

        <div className="mt-8">
          <ReceiptTip>
            Upload the printed receipt. It must show the merchant name, date and total. Handwritten bills are not accepted.
          </ReceiptTip>
        </div>
        {error && <p role="alert" className="mt-3 text-center text-[13px] font-semibold text-[#E5484D]">{error}</p>}

        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex h-12 items-center justify-center gap-2.5 rounded-full bg-brand text-[16px] font-semibold text-white hover:bg-brand-dark"
          >
            <Camera className="size-5" /> Take a photo
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="flex h-12 items-center justify-center gap-2.5 rounded-full border border-brand text-[16px] font-semibold text-brand hover:bg-brand-tint"
          >
            <ImageIcon className="size-5" /> Choose from gallery
          </button>
        </div>
        <Link href={backHref} className="mt-6 text-center text-[14px] font-semibold text-[#6B7280] underline">
          Skip for now
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 pt-6 pb-10 font-(family-name:--font-dm-sans)">
      {inputs}
      <div className="relative mx-auto h-84 w-full max-w-72">
        {previewFailed ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl bg-[#F8F8F8] px-4 text-center">
            <ImageIcon className="size-10 text-[#9CA3AF]" />
            <span className="text-[13px] font-medium break-all text-[#6B7280]">{file.name}</span>
          </div>
        ) : (
          <Image
            src={preview}
            alt="Your receipt"
            fill
            unoptimized
            onError={() => setPreviewFailed(true)}
            className="rounded-xl bg-[#F8F8F8] object-contain"
          />
        )}
        <button
          type="button"
          onClick={retake}
          aria-label="Remove photo"
          className="absolute -top-1.5 -right-3 flex size-8 items-center justify-center rounded-full bg-white shadow"
        >
          <X className="size-5 text-[#2C2D32]" />
        </button>
      </div>

      <h2 className="mt-6 text-center text-[28px] font-bold tracking-[-0.5px] text-[#2C2D32]">
        {rejection ? 'Wrong image' : 'Looks good?'}
      </h2>
      <p className={cn('mx-auto mt-2 max-w-68 text-center text-[14px] leading-5 font-medium', rejection ? 'text-[#E5484D]' : 'text-[#6B7280]')}>
        {rejection || 'Add the bill total and date so we can check your receipt faster.'}
      </p>

      {!rejection && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-[#2C2D32]">Bill total</span>
            <span className="flex h-12 items-center overflow-hidden rounded-xl border border-[#E2E1E1] focus-within:border-brand">
              <span className="flex h-full items-center bg-[#F6F6F6] px-3 text-[13px] font-semibold text-[#5B5A5A]">MUR</span>
              <input
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                className="h-full min-w-0 flex-1 px-3 text-[15px] outline-none"
              />
            </span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-[#2C2D32]">Date of purchase</span>
            <input
              type="date"
              max={todayIso()}
              value={purchaseDate}
              onChange={e => setPurchaseDate(e.target.value)}
              className="h-12 rounded-xl border border-[#E2E1E1] px-3 text-[14px] outline-none focus:border-brand"
            />
          </label>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-center text-[13px] font-semibold text-[#E5484D]">{error}</p>}

      <button
        type="button"
        onClick={rejection ? retake : submit}
        disabled={busy}
        className="mt-8 flex h-12 items-center justify-center rounded-full bg-brand text-[16px] font-semibold text-white hover:bg-brand-dark disabled:opacity-85"
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : rejection ? 'Retake photo' : 'Submit receipt'}
      </button>
      <button
        type="button"
        onClick={retake}
        disabled={busy}
        className="mt-6 flex items-center justify-center gap-2.5 text-[16px] font-semibold text-brand"
      >
        <RefreshCw className="size-5" /> Retake photo
      </button>
    </div>
  )
}
