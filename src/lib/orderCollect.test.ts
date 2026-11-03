import { describe, expect, it } from 'vitest'
import { cartLines, cartTotal, changeQty, matchingOrder, orderableItems, visibleItems } from './orderCollect'

const menu = {
  sections: [
    {
      name: 'Burgers',
      items: [
        { id: 1, name: ' Classic ', price: 300, image_urls: [null, 'a.jpg'], is_veg: true },
        { id: 2, name: 'Sold out', price: 300, is_available: false },
        { id: 3, name: 'Free', price: 0 },
        { id: 4, name: '', price: 100 },
      ],
    },
    { name: '', items: [{ id: 5, name: 'Cola', price: 80 }] },
  ],
}
const items = orderableItems(menu)

describe('orderableItems', () => {
  it('keeps only named, priced, available items', () => {
    expect(items.map(i => i.id)).toEqual(['1', '5'])
    expect(items[0]).toMatchObject({ name: 'Classic', image: 'a.jpg', isVeg: true, category: 'Burgers' })
    expect(items[1].category).toBe('Menu')
  })
  it('copes with no menu', () => {
    expect(orderableItems(null)).toEqual([])
  })
})

describe('visibleItems', () => {
  it('filters by name and category, and sorts by price', () => {
    expect(visibleItems(items, 'col', 'All', 'recommended').map(i => i.id)).toEqual(['5'])
    expect(visibleItems(items, '', 'Burgers', 'recommended').map(i => i.id)).toEqual(['1'])
    expect(visibleItems(items, '', 'All', 'price_low').map(i => i.id)).toEqual(['5', '1'])
    expect(visibleItems(items, '', 'All', 'price_high').map(i => i.id)).toEqual(['1', '5'])
  })
})

describe('cart', () => {
  it('adds, removes and totals', () => {
    let cart = changeQty({}, '1', 1)
    cart = changeQty(cart, '1', 1)
    cart = changeQty(cart, '5', 1)
    expect(cartTotal(cartLines(items, cart))).toBe(680)
    cart = changeQty(cart, '5', -1)
    expect(cart).toEqual({ 1: 2 })
  })
  it('only carries a saved cart that matches the bill', () => {
    const lines = cartLines(items, { 1: 1 })
    const order = { restaurantId: 'r', lines }
    expect(matchingOrder(order, 'r', 300)).toEqual(lines)
    expect(matchingOrder(order, 'r', 301)).toBeNull()
    expect(matchingOrder(order, 'other', 300)).toBeNull()
    expect(matchingOrder(null, 'r', 300)).toBeNull()
  })
})
