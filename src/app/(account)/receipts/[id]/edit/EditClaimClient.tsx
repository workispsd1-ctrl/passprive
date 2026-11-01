'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ImageIcon, Info, Loader2 } from 'lucide-react'
import { RECEIPT_ACCEPT, RECEIPT_MAX_BYTES, type ReceiptClaim, type ReceiptMerchant } from '@/lib/receipts'

function todayIso() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Indian/Mauritius' })
}

/**
 * Correct a claim under review — app parity: EditClaimScreen.jsx. The
 * merchant is fixed; a purchase date already on the claim stays locked
 * unless the photo is replaced.
 */
export function EditClaimClient({
  claim,
  merchant,
  photoUrl,
}: {
  claim: ReceiptClaim
  merchant: ReceiptMerchant | null
  photoUrl: string
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [amount, setAmount] = useState(claim.bill_amount != null ? String(Number(claim.bill_amount)) : '')
  const [purchaseDate, setPurchaseDate] = useState(claim.purchase_date ?? '')
  const [replacement, setReplacement] = useState<File | null>(null)
  const [preview, setPreview] = useState(photoUrl)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview) }, [preview])

  function replace(file: File | undefined) {
    if (!file) return
    if (file.size > RECEIPT_MAX_BYTES) { setError('This photo is too large. Please upload a photo under 10 MB.'); return }
    setError('')
    setReplacement(file)
    setPreview(URL.createObjectURL(file))
    setPurchaseDate('')
  }

  async function save() {
    if (busy) return
    setBusy(true)
    setError('')
    const form = new FormData()
    if (amount) form.set('billAmount', amount)
    if (purchaseDate) form.set('purchaseDate', purchaseDate)
    if (replacement) form.set('file', replacement)
    const res = await fetch(`/api/receipts/${claim.id}`, { method: 'PATCH', body: form }).catch(() => null)
    const data = (await res?.json().catch(() => null)) as { error?: string } | null
    setBusy(false)
    if (!res?.ok) { setError(data?.error ?? 'Could not save your changes. Please try again.'); return }
    router.replace(`/receipts/${claim.id}?saved=1`)
  }

  const dateLocked = !!claim.purchase_date && !replacement

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 pt-6 pb-12 font-(family-name:--font-dm-sans)">
      <div className="rounded-[18px] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-4">
          <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-[#D3D3D3]">
            {merchant?.cover_image && <Image src={merchant.cover_image} alt="" fill className="object-cover" sizes="56px" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[17px] font-bold text-[#2C2D32]">{merchant?.name ?? 'Merchant'}</span>
            <span className="block truncate text-[13px] text-[#6B7280]">{(merchant?.cuisines ?? []).slice(0, 2).join(', ')}</span>
          </span>
        </div>
        <p className="mt-3 flex items-center gap-2 text-[12px] text-[#5B5A5A]">
          <Info className="size-4" /> Merchant can not be changed.
        </p>
      </div>

      <label className="mt-6 text-[14px] font-semibold text-[#2C2D32]" htmlFor="claim-amount">Bill amount</label>
      <span className="mt-2 flex h-12 items-center overflow-hidden rounded-xl border border-[#E2E1E1] focus-within:border-brand">
        <span className="flex h-full items-center bg-[#F6F6F6] px-3 text-[13px] font-semibold text-[#5B5A5A]">MUR</span>
        <input
          id="claim-amount"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
          className="h-full min-w-0 flex-1 px-3 text-[15px] outline-none"
        />
      </span>

      <label className="mt-5 text-[14px] font-semibold text-[#2C2D32]" htmlFor="claim-date">Date of purchase</label>
      <input
        id="claim-date"
        type="date"
        max={todayIso()}
        value={purchaseDate}
        disabled={dateLocked}
        onChange={e => setPurchaseDate(e.target.value)}
        className="mt-2 h-12 rounded-xl border border-[#E2E1E1] px-3 text-[14px] outline-none focus:border-brand disabled:bg-[#F6F6F6] disabled:text-[#8E8E93]"
      />

      <p className="mt-5 text-[14px] font-semibold text-[#2C2D32]">Receipt photo</p>
      <div className="mt-2 rounded-xl border border-[#E2E1E1] p-3">
        <div className="relative h-60 w-full overflow-hidden rounded-lg bg-[#F8F8F8]">
          {preview && <Image src={preview} alt="Receipt photo" fill unoptimized className="object-contain" />}
        </div>
        <input ref={fileRef} type="file" accept={RECEIPT_ACCEPT} hidden onChange={e => { replace(e.target.files?.[0]); e.target.value = '' }} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-3 flex w-full items-center justify-center gap-2.5 text-[15px] font-semibold text-brand"
        >
          <ImageIcon className="size-5" /> Replace photo
        </button>
        <p className="mt-2 text-center text-[12px] text-[#6B7280]">
          Make sure the details are clear and shows the merchant name, date and total amount clearly.
        </p>
      </div>
      {error && <p role="alert" className="mt-3 text-center text-[13px] font-semibold text-[#E5484D]">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="mt-8 flex h-12 items-center justify-center rounded-full bg-brand text-[16px] font-semibold text-white hover:bg-brand-dark disabled:opacity-85"
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : 'Save changes'}
      </button>
      <button type="button" onClick={() => router.back()} className="mt-5 text-[14px] font-semibold text-[#6B7280] underline">
        Cancel
      </button>
    </div>
  )
}
