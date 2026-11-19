/** Order & Collect menu and cart — app parity: utils/orderCollectMenu.js + OrderCollectScreen.jsx. */
export type OrderItem = {
  id: string
  name: string
  price: number
  category: string
  image: string | null
  /** every photo of the item (image_urls), first = image */
  images: string[]
  description: string
  isVeg: boolean
  isBestseller: boolean
}
export type OrderLine = OrderItem & { qty: number }
export type OrderCart = Record<string, number>
export type OrderSort = 'recommended' | 'price_low' | 'price_high'

/** sessionStorage — the cart while it's being filled, per restaurant (shared by the menu and product pages) */
export const orderDraftKey = (restaurantId: string) => `pp_order_draft:${restaurantId}`

/** A saved draft cart, keeping only ids that are still on the menu with a positive quantity. */
export function parseDraft(raw: string | null, items: OrderItem[]): OrderCart {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const ids = new Set(items.map(i => i.id))
    const cart: OrderCart = {}
    for (const [id, qty] of Object.entries(parsed ?? {})) {
      const n = Math.floor(Number(qty))
      if (ids.has(id) && n > 0) cart[id] = n
    }
    return cart
  } catch {
    return {}
  }
}

/** sessionStorage — the cart while it goes through Pay bill */
export const ORDER_CART_KEY = 'pp_order_cart'
export type PendingOrder = { restaurantId: string; lines: OrderLine[] }

type MenuJson = {
  sections?: {
    name?: unknown
    items?: {
      id?: unknown
      name?: unknown
      price?: unknown
      description?: unknown
      image_urls?: unknown
      is_veg?: unknown
      is_bestseller?: unknown
      is_available?: unknown
    }[]
  }[]
} | null | undefined

export function orderableItems(menu: MenuJson): OrderItem[] {
  const sections = Array.isArray(menu?.sections) ? menu.sections : []
  return sections.flatMap(section =>
    (Array.isArray(section?.items) ? section.items : [])
      .filter(item => item && item.is_available !== false && Number(item.price) > 0 && String(item.name ?? '').trim())
      .map(item => ({
        id: String(item.id),
        name: String(item.name).trim(),
        price: Number(item.price),
        category: String(section.name ?? '').trim() || 'Menu',
        image: Array.isArray(item.image_urls) ? (item.image_urls.find(Boolean) as string | undefined) ?? null : null,
        images: Array.isArray(item.image_urls) ? (item.image_urls.filter(u => typeof u === 'string' && u) as string[]) : [],
        description: String(item.description ?? '').trim(),
        isVeg: item.is_veg === true,
        isBestseller: item.is_bestseller === true,
      })),
  )
}

export function visibleItems(items: OrderItem[], query: string, category: string, sort: OrderSort) {
  const q = query.trim().toLowerCase()
  const list = items.filter(item => (!q || item.name.toLowerCase().includes(q)) && (category === 'All' || item.category === category))
  if (sort === 'price_low') return [...list].sort((a, b) => a.price - b.price)
  if (sort === 'price_high') return [...list].sort((a, b) => b.price - a.price)
  return list
}

export function changeQty(cart: OrderCart, id: string, delta: number): OrderCart {
  const qty = (cart[id] ?? 0) + delta
  const next = { ...cart }
  if (qty <= 0) delete next[id]
  else next[id] = qty
  return next
}

export function cartLines(items: OrderItem[], cart: OrderCart): OrderLine[] {
  return items.filter(item => cart[item.id] > 0).map(item => ({ ...item, qty: cart[item.id] }))
}

export function cartTotal(lines: OrderLine[]) {
  return lines.reduce((sum, line) => sum + line.price * line.qty, 0)
}

/** Only a saved cart that matches this bill goes along with the payment. */
export function matchingOrder(order: PendingOrder | null, restaurantId: string, amount: number) {
  return order && order.restaurantId === restaurantId && order.lines.length > 0 && cartTotal(order.lines) === amount ? order.lines : null
}
