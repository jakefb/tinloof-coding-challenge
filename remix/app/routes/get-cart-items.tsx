import { json } from '@remix-run/node'
import { initializeSupabase } from '../lib/supabase'

export async function action({ request }: { request: Request }) {
  if (request.method !== 'POST') {
    return json(
      {
        status: 405,
        statusText: 'Method Not Allowed',
        error: 'This endpoint requires a POST request.'
      },
      {
        status: 405
      }
    )
  }

  const { id } = await request.json()

  const supabase = initializeSupabase({ supabaseKey: process.env.SUPABASE_SECRET_KEY || '' })

  const { data, error } = await supabase
    .from('cart_sessions')
    .select(`id`)
    // Filter
    .eq('id', id)
    .limit(1)

  // If error log it
  if (error) {
    console.error(error)
  }

  // Extract the first item of result.data
  const cartSession = data && data[0]

  if (cartSession) {
    const { data: cartData } = await supabase
      .from('cart_items')
      .select('product_id')
      .eq('cart_session_id', id)

    const cartItems = cartData?.map((current) => current.product_id)

    if (cartItems) {
      return json({
        // If there are no cartItems, return an empty array
        cartItems: cartItems || []
      })
    }
  }
}
