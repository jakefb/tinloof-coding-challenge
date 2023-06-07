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

  const { product_id, cart_session_id } = await request.json()

  const supabase = initializeSupabase({ supabaseKey: process.env.SUPABASE_SECRET_KEY || '' })

  return await supabase
    .from('cart_items')
    .delete()
    .eq('product_id', product_id)
    .eq('cart_session_id', cart_session_id)
}
