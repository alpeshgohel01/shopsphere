# ShopSphere

Premium full-stack e-commerce storefront for modern sneakers and streetwear.

Next.js App Router (JavaScript) + Better Auth + MongoDB + Stripe (test mode) + Zustand + Tailwind.

## Demo credentials

| Role  | Email                 | Password     |
|-------|-----------------------|--------------|
| Admin | admin@shopsphere.app  | Admin@12345  |
| Demo  | demo@shopsphere.app   | Demo@12345   |

**Stripe is in test mode.** Use card `4242 4242 4242 4242`, any future expiry, any CVC.

## Features

- Storefront: hero, featured products, category tiles, search/filter/sort/pagination
- Product detail with gallery, variants, reviews, related products, SEO metadata
- Cart (Zustand persist) + wishlist + free-shipping progress ($100+)
- Checkout with server-side price validation and Stripe Checkout
- Auth: email/password, Google/GitHub OAuth, verification, reset password (Better Auth)
- Account: orders, addresses, profile
- Admin: dashboard stats/chart, product CRUD, order status, users list
- Dark mode, toasts, loading/empty/error states

## Stack

- Next.js 16 (App Router), React 19, Tailwind CSS 4
- Better Auth + MongoDB (native driver)
- Stripe Checkout + webhooks
- Cloudinary (optional image uploads)
- Zustand, Zod, Recharts, Framer Motion, Sonner

## Setup

```bash
cp .env.example .env
# Fill MONGODB_URI, BETTER_AUTH_SECRET, BETTER_AUTH_URL, NEXT_PUBLIC_APP_URL
# Optional: Google/GitHub OAuth, Resend, Stripe, Cloudinary

npm install --legacy-peer-deps
npm run db:indexes
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Environment

See `.env.example`. Required for local:

- `MONGODB_URI`
- `BETTER_AUTH_SECRET` (>= 32 chars)
- `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` (`http://localhost:3000`)

Optional: Stripe, Cloudinary, OAuth, Resend.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production |
| `npm run db:seed` | Idempotent demo catalog + users |
| `npm run db:indexes` | Auth + shop indexes |
| `npm test` | Vitest |
| `npm run test:e2e` | Playwright |

## Design

**Lumen Atelier** — cool mist canvas, deep pine ink, acid-lime signals. Syne + Manrope. Editorial, product-first storefront (not a generic purple/orange kit).

## Business rules

- Money stored as integer cents
- Free shipping over $100, else $7.99
- Flat 8% tax on subtotal (demo)
- Prices/totals always computed server-side from DB
- Stock decrements on Stripe `checkout.session.completed`
- Reviews only for purchasers of paid/shipped/delivered orders

## Deploy (Vercel)

1. Import repo, set production env vars (never leave localhost auth URLs on Vercel)
2. Add Google/GitHub callback URLs for the live domain
3. Stripe Dashboard → webhook `https://YOUR_DOMAIN/api/webhooks/stripe` for `checkout.session.completed`
4. MongoDB Atlas network access for Vercel
5. Run `npm run db:seed` once against production if you want demo data
