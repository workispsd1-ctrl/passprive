import { useState } from 'react'

export function useDecimalInput(initialValue?: number) {
  const [value, setValue] = useState(
    initialValue != null && initialValue > 0 ? String(initialValue) : ''
  )

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/[^0-9.]/g, '')
    const parts = v.split('.')
    if (parts.length > 2) return
    if (parts[1] && parts[1].length > 2) return
    setValue(v)
  }

  return {
    value,
    numericValue: parseFloat(value) || 0,
    onChange,
  }
}
