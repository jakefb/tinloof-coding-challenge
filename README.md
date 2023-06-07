# Tinloof coding challenge

An e-commerce demo app built with Remix, Sanity.io, and Supabase. The app is a simple booking system for courses. The courses are stored within Sanity.io, and Supabase is used for persisting the checkout cart state and submitting the cart.

The app is coded in TypeScript and styled with Tailwind.

You can view the live application here https://ninja-cats.netlify.app

## Getting started

### Install and run Sanity

```sh
cd sanity
cp .env.example .env # create a .env file, configure as necessary
npm install
npm run dev
```

This will start the Sanity Studio dev server at http://localhost:3333

### Install and run the Remix app

For the Remix app you will need to set the `SUPABASE_SECRET_KEY` environment variable to the `service_role` secret key found in the Supabase UI under `Settings > API > Project API keys`. This key should never be exposed to the front-end or shared.

```sh
cd remix
cp .env.example .env # create a .env file, configure as necessary (specifically the SUPABASE_SECRET_KEY variable)
npm install
npm run dev
```

This will start the Remix dev server at http://localhost:3000

## Application architecture

The application is divided into three seperate parts, the Remix app, Sanity and Supabase.

- The Remix app handles the front-end of the app, and also provides the API routes for retrieving the checkout cart state from Supabase. The reason this approach is taken rather than the app calling the Supabase API directly, is to ensure that the secret API key is not exposed to the front-end, and also to limit what data and how much data can be retrieved from the API.
- Sanity provides the content for the courses, which is the single source of truth. There is no duplication of content between Sanity and Supabase. Supabase and the React app state use the `_id` keys provided by Sanity, to reference the corresponding course document in Sanity. This means that if the content of a course were to be updated in Sanity, a saved checkout cart state will still retrieve the up to date content.
- In terms of future development, on thing to consider is - if the application delt with real payments, it would be a good idea to attach some payment information in the `orders` table, such as a stripe reference and order total. And possibly have an `amount` field on the `cart_items` table, which populates when the order is made.
- Here is a link to the Supabase schema structure https://dbdiagram.io/d/648013ad722eb774948767af
