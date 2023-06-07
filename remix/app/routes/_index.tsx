import { useEffect, useState } from 'react'

import { useLoaderData, Form, useSubmit } from '@remix-run/react'
import imageUrlBuilder from '@sanity/image-url'

import { v4 as uuidv4 } from 'uuid'

import { client, projectId, dataset } from '../lib/sanity'

import type { LoaderArgs } from '@remix-run/node'
import type { V2_MetaFunction } from '@remix-run/node'

const builder = imageUrlBuilder({ projectId, dataset })

type Course = {
  title: string
  image: any
  description: string
  price: number
  stockQuantity: number
  _id: string
}

type Cart = string[]

interface orderOption {
  value: string
  label: string
}

const orderOptions: orderOption[] = [
  { value: 'title asc', label: 'A-Z' },
  { value: 'title desc', label: 'Z-A' },
  { value: 'price asc', label: 'Price Ascending' },
  { value: 'price desc', label: 'Price Descending' }
]

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url)
  const params = new URLSearchParams(url.search)
  const order = params.get('order')
  const search = params.get('search')

  // Note, searching with groq is not very robust. Would be better to move to something more powerful.

  // Check if the order query param is a value of `orderOptions`
  const orderIsValid =
    order !== null && orderOptions.map((current) => current.value).includes(order)

  // encodeURI is used to prevent XSS attacks for search queries
  const query =
    `*[_type == 'course'` +
    (search ? ` && (title match $search || description match $search)]` : ' ]') +
    (orderIsValid ? ` | order(${order})` : '')

  const courses = await client.fetch(query, {
    search: search + '*'
  })

  return { courses, supabaseKey: process.env.SUPABASE_SECRET_KEY }
}

export const meta: V2_MetaFunction = () => {
  return [
    { title: 'Ninja Training for Cats' },
    {
      name: 'description',
      content:
        "Unleash your feline warrior's inner ninja! Join our whimsical e-commerce app for 'Ninja Training for Cats' and watch your furry friends master the art of stealth and agility, one adorable paw at a time."
    }
  ]
}

export default function Index() {
  const { courses = [] } = useLoaderData<{
    courses: Course[]
  }>()

  const [cart, setCart] = useState<Cart>([])
  const [cartIsVisible, setCartIsVisible] = useState(false)
  const [cartIsSubmitted, setCartIsSubmitted] = useState(false)
  const [successDialogIsVisible, setSuccessDialogIsVisible] = useState(false)

  // Persist cart
  // Store session id in react state, as a work around to avoid using session ids on the server side...
  // ...and also to persist it between component re-renders
  const [cartSessionId, setCartSessionId] = useState<string | null>(null)

  const submit = useSubmit()
  function handleRemixFormChange(event: React.FormEvent<HTMLFormElement>): void {
    submit(event.currentTarget, { replace: true })
  }

  useEffect(() => {
    const isSaved = window.localStorage.getItem('cartSessionId') !== null
    const id = window.localStorage.getItem('cartSessionId') || uuidv4()

    if (isSaved === false) {
      // Persist in local storage
      window.localStorage.setItem('cartSessionId', id)
      ;(async () => {
        // Persist in supabase
        const response = await fetch('/create-cart-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id
          })
        })

        const { error, status, statusText } = await response.json()

        // If error log it
        if (error) {
          console.error(error)
        }

        // 201 = created
        if (status === 201) {
          console.log('Cart session successfully saved')
        } else {
          console.warn(`Adding cart item returned the following status: ${statusText} (${status})`)
        }
      })()
    } else {
      ;(async () => {
        const response = await fetch('/get-cart-items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id
          })
        })

        const { cartItems } = await response.json()

        if (cartItems) {
          setCart(cartItems)
        }
      })()
    }

    // Update react state
    setCartSessionId(id)
  }, [])

  const addToCartHandler = (id: string): void => {
    // Check that the course id is valid
    const courseId = courses.find(({ _id }) => _id === id)?._id

    if (courseId !== undefined) {
      // Add item to supabase
      ;(async () => {
        // Persist in supabase
        const response = await fetch('/add-cart-item', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            product_id: id,
            cart_session_id: cartSessionId
          })
        })

        const { error, status, statusText } = await response.json()

        // If error log it
        if (error) {
          console.error(error)
        }

        // 201 = created
        if (status === 201) {
          console.log('Cart item sucessfully saved')
        } else {
          console.warn(`Adding cart item returned the following status: ${statusText} (${status})`)
        }
      })()

      setCart([...cart, courseId])
    }
  }

  const removeFromCartHandler = (id: string): void => {
    ;(async () => {
      const response = await fetch('/remove-cart-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: id,
          cart_session_id: cartSessionId
        })
      })

      const { error, status, statusText } = await response.json()

      // If error log it
      if (error) {
        console.error(error)
      }

      // 204 = no content / request succeeded
      if (status === 204) {
        console.log('Cart item sucessfully deleted')
      } else {
        console.warn(`Deleting cart item returned the following status: ${statusText} (${status})`)
      }
    })()
    setCart(cart.filter((currentId) => currentId !== id))
  }

  // Gets corresponding products from sanity.io for the cart items
  const getCartItems = (cart: Cart): Course[] => {
    return cart
      .map((currentCourseId) => {
        const course = courses.find(({ _id }) => _id === currentCourseId)
        return course
      })
      .filter((course): course is Course => course !== undefined)
  }

  const toggleCartVisibility = (): void => {
    setCartIsVisible(!cartIsVisible)
  }

  const handleCheckOut = (): void => {
    // Add code for submitting cart here

    ;(async () => {
      const response = await fetch('/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cart_session_id: cartSessionId
        })
      })

      const { error, status, statusText } = await response.json()

      // If error log it
      if (error) {
        console.error(error)
      }

      // 201 = created
      if (status === 201) {
        console.log('Order sucessfully created')
      } else {
        console.warn(`Creating order returned the following status: ${statusText} (${status})`)
      }
    })()

    setCartIsSubmitted(true)
  }

  useEffect(() => {
    if (cartIsSubmitted) {
      setSuccessDialogIsVisible(true)
      const timeout = setTimeout(
        () => {
          setCartIsSubmitted(false)
          setSuccessDialogIsVisible(false)
        },
        5000 // Hide success dialog after 5 seconds
      )

      return () => clearTimeout(timeout)
    }
  }, [cartIsSubmitted])

  return (
    <>
      <div className="font-sans leading-8 mx-8 my-32 sm:mx-32">
        <h1 className="text-4xl">Ninja Training for Cats</h1>
        <Form className="flex flex-col" method="get" onChange={handleRemixFormChange}>
          <label htmlFor="orderEl" className="text-lg mt-8">
            Order
          </label>
          <select
            id="orderEl"
            className="p-3 rounded mt-1 mr-auto"
            name="order"
            defaultValue={orderOptions[0].value}
          >
            {orderOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <label htmlFor="searchEl" className="text-lg mt-4">
            Search
          </label>
          <input
            id="searchEl"
            className="py-1 px-2 border-2 border-gray-400 rounded mt-1 mr-auto"
            name="search"
            defaultValue=""
          />
        </Form>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-auto gap-x-8 gap-y-12">
          {courses.map(({ title, image, description, price, _id, stockQuantity }) => (
            <div key={_id}>
              <h2 className="text-2xl">{title}</h2>
              <div className="mt-4 flex justify-center bg-gray-200">
                <img
                  className="w-full max-w-xs"
                  src={builder.image(image).width(300).height(300).quality(80).url()}
                  width={300}
                  height={300}
                />
              </div>
              <p className="mt-4">{description}</p>
              {stockQuantity > 0 ? (
                <>
                  <p className="mt-4 text-xl">${price}</p>
                  <button
                    className={
                      'mt-4 text-white font-bold py-2 px-4 rounded' +
                      (!cart.includes(_id)
                        ? ` bg-blue-500 hover:bg-blue-700`
                        : ` bg-green-500 hover:bg-green-700`)
                    }
                    onClick={() =>
                      !cart.includes(_id) ? addToCartHandler(_id) : setCartIsVisible(true)
                    }
                  >
                    {!cart.includes(_id) ? 'Add to cart' : 'View cart'}
                  </button>
                </>
              ) : (
                <p className="mt-4 text-xl text-red-500">Out of stock</p>
              )}
            </div>
          ))}
        </div>
      </div>
      {cart.length >= 1 && (
        <div className="font-sans fixed bottom-0 right-0 mb-8 mr-8 flex flex-col">
          {cartIsVisible && (
            <div className="tooltip-content bg-white border-gray-200 border-2 rounded p-4">
              <h4 className="text-lg">Cart items</h4>
              {getCartItems(cart).map(({ _id, title, price }) => (
                <div key={_id}>
                  <h5 className="mt-4 text-md">{title}</h5>
                  <p className="text-gray-500">${price}</p>
                  <button
                    onClick={() => removeFromCartHandler(_id)}
                    className="mt-1 text-xs bg-gray-500 hover:bg-gray-700 text-white  py-2 px-4 rounded"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="mt-4 ml-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleCheckOut}
              >
                Check out
              </button>
            </div>
          )}
          <button
            className="mt-4 ml-auto bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            onClick={toggleCartVisibility}
          >
            Cart
          </button>
        </div>
      )}
      <div
        className={
          'fixed top-0 bottom-0 left-0 right-0 w-full h-screen bg-green-700 flex justify-center items-center p-8' +
          (successDialogIsVisible ? ' fade-to-visible' : ' fade-to-hidden')
        }
      >
        <h2 className="text-white text-2xl text-center">
          Congrats, you are on your way to training your own ninja cats!
        </h2>
      </div>
    </>
  )
}
