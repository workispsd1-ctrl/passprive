'use client'

import { useCallback, useEffect, useState } from 'react'
import { changeQty, orderDraftKey, parseDraft, type OrderCart, type OrderItem } from '@/lib/orderCollect'

/**
 * The Order & Collect cart for one restaurant, kept in sessionStorage so the
 * menu and a product page share it (app parity: OrderCollectScreen passes the
 * cart to OrderProductDetail and back). Starts empty on the server render and
 * loads the saved cart after mount, so hydration matches.
 */
export function useOrderCart(restaurantId: string, items: OrderItem[]) {
  const [cart, setCart] = useState<OrderCart>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let saved: string | null = null
    try { saved = sessionStorage.getItem(orderDraftKey(restaurantId)) } catch { /* storage blocked */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time load of the saved cart after hydration
    setCart(parseDraft(saved, items))
    setLoaded(true)
  }, [restaurantId, items])

  useEffect(() => {
    if (!loaded) return
    try {
      if (Object.keys(cart).length) sessionStorage.setItem(orderDraftKey(restaurantId), JSON.stringify(cart))
      else sessionStorage.removeItem(orderDraftKey(restaurantId))
    } catch { /* storage blocked — the cart lives for this page only */ }
  }, [cart, loaded, restaurantId])

  const add = useCallback((id: string) => setCart(c => changeQty(c, id, 1)), [])
  const remove = useCallback((id: string) => setCart(c => changeQty(c, id, -1)), [])
  return { cart, add, remove }
}
