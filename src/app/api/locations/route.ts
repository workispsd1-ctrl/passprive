import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { locationIdentity, type NewSavedLocation, type SavedLocationRow } from '@/lib/savedLocations'

const FIELDS = 'id, label, label_type, building_floor, landmark, address_text, city, area, pincode, latitude, longitude, place_id, is_default, is_recent'

/** The signed-in member's saved addresses, newest first. Guests keep theirs in this browser. */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ locations: null })
  const { data } = await supabase.from('user_saved_locations').select(FIELDS).eq('user_id', user.id).order('updated_at', { ascending: false })
  return NextResponse.json({ locations: data ?? [] })
}

/** Saves an address as the default, reusing the row for one already saved — app parity: SavedLocations.jsx. */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in to continue.' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as NewSavedLocation | null
  const address = String(body?.address_text ?? '').trim()
  if (!body || !address) return NextResponse.json({ error: 'Choose an address first.' }, { status: 400 })

  const now = new Date().toISOString()
  const row = {
    label: body.label ?? null,
    label_type: body.label_type ?? null,
    building_floor: body.building_floor ?? null,
    landmark: body.landmark ?? null,
    address_text: address,
    city: body.city ?? null,
    area: body.area ?? null,
    pincode: body.pincode ?? null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    place_id: body.place_id ?? null,
    is_default: true,
    is_recent: true,
    updated_at: now,
  }

  await supabase.from('users').update({
    default_address: address,
    default_lat: row.latitude,
    default_lng: row.longitude,
    updated_at: now,
  }).eq('id', user.id)
  await supabase.from('user_saved_locations').update({ is_default: false }).eq('user_id', user.id)

  const { data: existing } = await supabase.from('user_saved_locations').select('id, address_text, place_id').eq('user_id', user.id)
  const match = ((existing ?? []) as SavedLocationRow[]).find(r => locationIdentity(r) === locationIdentity(row))
  const { data, error } = match
    ? await supabase.from('user_saved_locations').update(row).eq('id', match.id).eq('user_id', user.id).select(FIELDS).single()
    : await supabase.from('user_saved_locations').insert({ ...row, user_id: user.id }).select(FIELDS).single()
  if (error) return NextResponse.json({ error: 'Could not save this address.' }, { status: 500 })
  return NextResponse.json({ location: data })
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in to continue.' }, { status: 401 })
  const { error } = await supabase.from('user_saved_locations').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: 'Could not delete this address.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
