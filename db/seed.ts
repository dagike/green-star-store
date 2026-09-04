// Deterministic seed data for Green Star Store.
// Run with: npm run db:setup
// Drops and recreates the schema, then inserts ~60 products, images, reviews and promo codes.

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { Client } from 'pg'

interface Category {
  key: string
  brands: string[]
  types: string[]
  images: string[]
  basePriceCents: number
  priceSpanCents: number
}

const CATEGORIES: Category[] = [
  {
    key: 'electronics',
    brands: ['Voltix', 'Aetherio', 'Nimbus', 'Corex', 'Pulseon'],
    types: [
      'Wireless Headphones',
      'Bluetooth Speaker',
      'Smart Watch',
      'Noise-Cancelling Earbuds',
      '4K Action Camera',
      'Portable Charger',
      'Mechanical Keyboard',
      'Wireless Mouse',
      'Smart Home Hub',
      'Fitness Tracker',
      'Tablet Stand',
      'USB-C Hub',
      'HD Webcam',
      'Laptop Sleeve',
      'LED Desk Lamp',
    ],
    images: [
      '1523275335684-37898b6baf30',
      '1583394838336-acd977736f90',
      '1524758631624-e2822e304c36',
      '1496181133206-80ce9b88a853',
      '1585386959984-a4155224a1ad',
      '1546435770-a3e426bf472b',
      '1502920917128-1aa500764cbd',
      '1595950653106-6c9ebd614d3a',
      '1441986300917-64674bd600d8',
      '1524592094714-0f0654e20314',
      '1511707171634-5f897ff02aa9',
      '1608231387042-66d1773070a5',
    ],
    basePriceCents: 2999,
    priceSpanCents: 22000,
  },
  {
    key: 'apparel',
    brands: ['Northfield', 'Loomwear', 'Driftline', 'Cascade Co', 'Solstice'],
    types: [
      'Cotton T-Shirt',
      'Denim Jacket',
      'Running Shoes',
      'Wool Sweater',
      'Slim Fit Chinos',
      'Rain Jacket',
      'Graphic Hoodie',
      'Canvas Sneakers',
      'Athletic Shorts',
      'Flannel Shirt',
      'Puffer Vest',
      'Leather Belt',
      'Beanie Hat',
      'Ankle Socks (3-Pack)',
      'Track Jacket',
    ],
    images: [
      '1542291026-7eec264c27ff',
      '1523381210434-271e8be1f52b',
      '1560343090-f0409e92791a',
      '1560243563-062bfc001d68',
      '1521572163474-6864f9cf17ab',
      '1576566588028-4147f3842f27',
      '1491553895911-0055eca6402d',
      '1562157873-818bc0726f68',
      '1548036328-c9fa89d128fa',
      '1484704849700-f032a568e944',
    ],
    basePriceCents: 1999,
    priceSpanCents: 11000,
  },
  {
    key: 'home',
    brands: ['Hearth & Co', 'Meadowlane', 'Urban Nest', 'Willow Grove', 'Copper Kettle'],
    types: [
      'Ceramic Mug Set',
      'Throw Blanket',
      'Table Lamp',
      'Succulent Planter',
      'Scented Candle',
      'Cutting Board',
      'Wall Clock',
      'Storage Baskets',
      'Area Rug',
      'Wine Glass Set',
      'Cast Iron Skillet',
      'Bath Towel Set',
      'Picture Frame Set',
      'Bookshelf Speaker Stand',
      'Reed Diffuser',
    ],
    images: [
      '1571945153237-4929e783af4a',
      '1586023492125-27b2c045efd7',
      '1513506003901-1e6a229e2d15',
      '1519710164239-da123dc03ef4',
    ],
    basePriceCents: 1499,
    priceSpanCents: 8500,
  },
  {
    key: 'accessories',
    brands: ['Satchel & Sons', 'Northline', 'Glint', 'Pathfinder', 'Aura'],
    types: [
      'Leather Wallet',
      'Canvas Backpack',
      'Aviator Sunglasses',
      'Silk Scarf',
      'Crossbody Bag',
      'Travel Duffel',
      'Phone Case',
      'Card Holder',
      'Wide Brim Hat',
      'Analog Watch',
      'Tote Bag',
      'Keychain Multi-tool',
      'Compact Umbrella',
      'Laptop Bag',
      'Sunglasses Case',
    ],
    images: [
      '1517336714731-489689fd1ca8',
      '1526170375885-4d8ecf77b99f',
      '1572635196237-14b3f281503f',
      '1508296695146-257a814070b4',
      '1553062407-98eeb64c6a62',
    ],
    basePriceCents: 1999,
    priceSpanCents: 13000,
  },
]

const REVIEW_AUTHORS = [
  'Jordan M.',
  'Casey L.',
  'Riley P.',
  'Morgan T.',
  'Avery S.',
  'Quinn R.',
  'Drew K.',
  'Sam W.',
  'Taylor B.',
  'Jamie C.',
]

const REVIEW_TEMPLATES: Record<number, { title: string; body: string }[]> = {
  5: [
    {
      title: 'Exceeded expectations',
      body: 'This has quickly become one of my favorite purchases this year. Quality feels well above the price point and it arrived exactly as described.',
    },
    {
      title: 'Would buy again',
      body: "I was on the fence given the reviews, but this delivered on every promise. Fast shipping and it's held up well with regular use.",
    },
  ],
  4: [
    {
      title: 'Really solid',
      body: 'Does everything I need it to. A couple of small nitpicks keep it from a perfect score, but overall very happy with it.',
    },
    {
      title: 'Good value',
      body: 'For the price this is hard to beat. Build quality is better than I expected and it looks great too.',
    },
  ],
  3: [
    {
      title: 'Does the job',
      body: "It's fine. Nothing about it stands out, but it works as advertised and I have no major complaints.",
    },
    {
      title: 'Average, but usable',
      body: 'Met my basic expectations. Might look around a bit more next time, but not returning this one.',
    },
  ],
  2: [
    {
      title: 'Mixed feelings',
      body: "Some parts of it feel cheaper than I'd like for the price. It works, but I'd think twice before buying again.",
    },
  ],
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function imageUrl(photoId: string): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=80`
}

function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eq = trimmed.indexOf('=')
    if (eq === -1) continue

    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env)) process.env[key] = value
  }
}

interface SeedProduct {
  slug: string
  name: string
  brand: string
  description: string
  category: string
  priceCents: number
  compareAtCents: number | null
  stock: number
  createdAt: Date
  images: string[]
  reviewRatings: number[]
}

function buildProducts(): SeedProduct[] {
  const products: SeedProduct[] = []
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  CATEGORIES.forEach((category, catIndex) => {
    category.types.forEach((type, i) => {
      const brand = category.brands[i % category.brands.length]
      const name = `${brand} ${type}`
      const slug = `${category.key}-${slugify(brand)}-${slugify(type)}`

      const rawPrice =
        category.basePriceCents + ((i * 733 + catIndex * 917) % category.priceSpanCents)
      const priceCents = Math.round(rawPrice / 100) * 100 - 1
      const compareAtCents = i % 3 === 0 ? Math.round((priceCents * 1.25) / 100) * 100 - 1 : null

      let stock: number
      if (i % 7 === 0) {
        stock = 0
      } else if (i % 5 === 0) {
        stock = (i % 4) + 1
      } else {
        stock = 12 + ((i * 17 + catIndex * 5) % 70)
      }

      const createdAt = new Date(now - (i + catIndex * 15) * dayMs)

      const imageCount = 3 + (i % 2)
      const images = Array.from({ length: imageCount }, (_, imgIdx) =>
        imageUrl(category.images[(i + imgIdx) % category.images.length]),
      )

      const reviewCount = 2 + (i % 5)
      const ratingCycle = [5, 4, 5, 3, 4, 5, 2, 4, 5, 3]
      const reviewRatings = Array.from(
        { length: reviewCount },
        (_, r) => ratingCycle[(i + r) % ratingCycle.length],
      )

      products.push({
        slug,
        name,
        brand,
        description: `${name} from ${brand}. A ${category.key} pick built for everyday use, backed by our standard one-year warranty.`,
        category: category.key,
        priceCents,
        compareAtCents,
        stock,
        createdAt,
        images,
        reviewRatings,
      })
    })
  })

  return products
}

async function main() {
  loadEnvLocal()

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is not set. Add it to .env.local before running db:setup.')
    process.exit(1)
  }

  const client = new Client({ connectionString })
  await client.connect()

  try {
    const schemaPath = path.resolve(process.cwd(), 'db/schema.sql')
    const schema = readFileSync(schemaPath, 'utf8')

    console.log('Applying schema...')
    await client.query(schema)

    console.log('Seeding products...')
    await client.query('begin')

    const products = buildProducts()

    for (const product of products) {
      const avgRating =
        product.reviewRatings.length > 0
          ? product.reviewRatings.reduce((sum, r) => sum + r, 0) / product.reviewRatings.length
          : 0

      const { rows } = await client.query<{ id: number }>(
        `insert into products
           (slug, name, brand, description, category, price_cents, compare_at_cents, stock,
            avg_rating, review_count, created_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         returning id`,
        [
          product.slug,
          product.name,
          product.brand,
          product.description,
          product.category,
          product.priceCents,
          product.compareAtCents,
          product.stock,
          avgRating.toFixed(1),
          product.reviewRatings.length,
          product.createdAt,
        ],
      )
      const productId = rows[0].id

      for (const [position, url] of product.images.entries()) {
        await client.query(
          `insert into product_images (product_id, url, alt, position) values ($1, $2, $3, $4)`,
          [productId, url, product.name, position],
        )
      }

      for (const [r, rating] of product.reviewRatings.entries()) {
        const template = REVIEW_TEMPLATES[rating] ?? REVIEW_TEMPLATES[3]
        const pick = template[r % template.length]
        const author = REVIEW_AUTHORS[(r + productId) % REVIEW_AUTHORS.length]

        await client.query(
          `insert into reviews (product_id, author, rating, title, body) values ($1, $2, $3, $4, $5)`,
          [productId, author, rating, pick.title, pick.body],
        )
      }
    }

    console.log('Seeding promo codes...')
    await client.query(
      `insert into promo_codes (code, kind, value, min_subtotal_cents, active) values
         ('GREEN10', 'percent', 10, 0, true),
         ('FREESHIP', 'free_shipping', 0, 5000, true),
         ('EXPIRED', 'percent', 15, 0, false)`,
    )

    await client.query('commit')

    const {
      rows: [productCount],
    } = await client.query('select count(*) from products')
    const {
      rows: [imageCount],
    } = await client.query('select count(*) from product_images')
    const {
      rows: [reviewCount],
    } = await client.query('select count(*) from reviews')
    const {
      rows: [promoCount],
    } = await client.query('select count(*) from promo_codes')

    console.log('Done. Row counts:')
    console.log(`  products:      ${productCount.count}`)
    console.log(`  product_images: ${imageCount.count}`)
    console.log(`  reviews:       ${reviewCount.count}`)
    console.log(`  promo_codes:   ${promoCount.count}`)
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
