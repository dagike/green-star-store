// Deterministic seed data for Green Star Store.
// Run with: npm run db:setup
// Drops and recreates the schema, then inserts ~60 products, images, reviews and promo codes.

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { Client } from 'pg'

interface ProductType {
  name: string
  // Unsplash photo ids, specific to this product type (not a shared category pool) -
  // each type shows real, matching photos rather than a generic per-category grab-bag.
  images: string[]
}

interface Category {
  key: string
  brands: string[]
  types: ProductType[]
  basePriceCents: number
  priceSpanCents: number
}

const CATEGORIES: Category[] = [
  {
    key: 'electronics',
    brands: ['Voltix', 'Aetherio', 'Nimbus', 'Corex', 'Pulseon'],
    types: [
      {
        name: 'Wireless Headphones',
        images: ['1505740420928-5e560c06d30e', '1618366712010-f4ae9c647dcb'],
      },
      {
        name: 'Bluetooth Speaker',
        images: ['1608043152269-423dbba4e7e1', '1589256469067-ea99122bbdc4'],
      },
      { name: 'Smart Watch', images: ['1579586337278-3befd40fd17a', '1546868871-7041f2a55e12'] },
      {
        name: 'Noise-Cancelling Earbuds',
        images: ['1572569511254-d8f925fe2cbb', '1590658268037-6bf12165a8df'],
      },
      {
        name: '4K Action Camera',
        images: ['1484506399805-c273b8e91dce', '1562878671-b3efe27953b9'],
      },
      {
        name: 'Portable Charger',
        images: ['1585995603413-eb35b5f4a50b', '1566554738544-d962991c3fee'],
      },
      {
        name: 'Mechanical Keyboard',
        images: ['1618384887929-16ec33fab9ef', '1547394765-185e1e68f34e'],
      },
      {
        name: 'Wireless Mouse',
        images: ['1527864550417-7fd91fc51a46', '1615663245857-ac93bb7c39e7'],
      },
      {
        name: 'Smart Home Hub',
        images: ['1650682009477-52fd77302b78', '1571251455684-2eb131fdb294'],
      },
      {
        name: 'Fitness Tracker',
        images: ['1576243345690-4e4b79b63288', '1620213391117-0d169a917221'],
      },
      {
        name: 'Tablet Stand',
        images: ['1679759799183-8899c0d67b43', '1652863299050-15c836e15ae4'],
      },
      { name: 'USB-C Hub', images: ['1616578273461-3a99ce422de6', '1616578273577-5d54546f4dec'] },
      { name: 'HD Webcam', images: ['1623949556303-b0d17d198863', '1726127461372-547b9ffa4236'] },
      {
        name: 'Laptop Sleeve',
        images: ['1689757855413-9e366c2011f1', '1675668409245-955188b96bf6'],
      },
      { name: 'LED Desk Lamp', images: ['1570974802254-4b0ad1a755f5', '1543512214-4f76e81f8bfc'] },
    ],
    basePriceCents: 2999,
    priceSpanCents: 22000,
  },
  {
    key: 'apparel',
    brands: ['Northfield', 'Loomwear', 'Driftline', 'Cascade Co', 'Solstice'],
    types: [
      {
        name: 'Cotton T-Shirt',
        images: ['1529374255404-311a2a4f1fd9', '1693443687750-611ad77f3aba'],
      },
      { name: 'Denim Jacket', images: ['1611312449408-fcece27cdbb7', '1543076447-215ad9ba6923'] },
      { name: 'Running Shoes', images: ['1542291026-7eec264c27ff', '1606107557195-0e29a4b5b4aa'] },
      {
        name: 'Wool Sweater',
        images: ['1574201635302-388dd92a4c3f', '1601379327928-bedfaf9da2d0'],
      },
      {
        name: 'Slim Fit Chinos',
        images: ['1624378441864-6eda7eac51cb', '1584865288642-42078afe6942'],
      },
      { name: 'Rain Jacket', images: ['1521223890158-f9f7c3d5d504', '1548883354-94bcfe321cbb'] },
      {
        name: 'Graphic Hoodie',
        images: ['1620799140188-3b2a02fd9a77', '1680292783974-a9a336c10366'],
      },
      {
        name: 'Canvas Sneakers',
        images: ['1562105962-2fbaaf107fe3', '1676379760823-ebf91f45de0b'],
      },
      {
        name: 'Athletic Shorts',
        images: ['1691315909393-c5c91e22760f', '1640943136566-3edeb13e3d3b'],
      },
      {
        name: 'Flannel Shirt',
        images: ['1698857494817-d244cb4231a8', '1611312449412-6cefac5dc3e4'],
      },
      { name: 'Puffer Vest', images: ['1636529109797-0749811c4916', '1780969393713-6742133843b5'] },
      {
        name: 'Leather Belt',
        images: ['1664286074176-5206ee5dc878', '1664285612706-b32633c95820'],
      },
      { name: 'Beanie Hat', images: ['1576871337632-b9aef4c17ab9', '1633964124833-f4f3928c55bb'] },
      {
        name: 'Ankle Socks (3-Pack)',
        images: ['1585499583264-491df5142e83', '1640026199235-c24aa417b552'],
      },
      {
        name: 'Track Jacket',
        images: ['1768983953826-231e8ef0b6dc', '1586360727847-108cbb274ad1'],
      },
    ],
    basePriceCents: 1999,
    priceSpanCents: 11000,
  },
  {
    key: 'home',
    brands: ['Hearth & Co', 'Meadowlane', 'Urban Nest', 'Willow Grove', 'Copper Kettle'],
    types: [
      {
        name: 'Ceramic Mug Set',
        images: ['1616241673111-508b4662c707', '1666445844615-0a3930270f13'],
      },
      {
        name: 'Throw Blanket',
        images: ['1600369672770-985fd30004eb', '1602891867080-1d56348202a3'],
      },
      { name: 'Table Lamp', images: ['1517991104123-1d56a6e81ed9', '1585128719715-46776b56a0d1'] },
      {
        name: 'Succulent Planter',
        images: ['1536069221282-d877868cad6b', '1595313269158-e5beea1a7cc0'],
      },
      { name: 'Scented Candle', images: ['1561212856-44e9bae482aa', '1601922046210-41e129a3e64a'] },
      {
        name: 'Cutting Board',
        images: ['1666013942797-9daa4b8b3b4f', '1617695615794-a5abcece0f48'],
      },
      { name: 'Wall Clock', images: ['1563861826100-9cb868fdbe1c', '1533090161767-e6ffed986c88'] },
      {
        name: 'Storage Baskets',
        images: ['1601330862030-1e08c703ac04', '1760182200277-fae00dfb149f'],
      },
      { name: 'Area Rug', images: ['1572123979839-3749e9973aba', '1698936061086-2bf99c7b9fc5'] },
      { name: 'Wine Glass Set', images: ['1510812431401-41d2bd2722f3', '1547595628-c61a29f496f0'] },
      {
        name: 'Cast Iron Skillet',
        images: ['1579805625996-db7b60587362', '1637739699971-7d4d5194e75c'],
      },
      {
        name: 'Bath Towel Set',
        images: ['1620626011761-996317b8d101', '1629079447777-1e605162dc8d'],
      },
      {
        name: 'Picture Frame Set',
        images: ['1543487945-139a97f387d5', '1626846116799-ad61f874f99d'],
      },
      {
        name: 'Bookshelf Speaker Stand',
        images: ['1767808569398-0103583e49e5', '1767808569406-cfcf06dcb441'],
      },
      {
        name: 'Reed Diffuser',
        images: ['1750433101196-604c1741a012', '1750433101188-8284e112d250'],
      },
    ],
    basePriceCents: 1499,
    priceSpanCents: 8500,
  },
  {
    key: 'accessories',
    brands: ['Satchel & Sons', 'Northline', 'Glint', 'Pathfinder', 'Aura'],
    types: [
      {
        name: 'Leather Wallet',
        images: ['1627123424574-724758594e93', '1601592996763-f05c9c80a7f1'],
      },
      {
        name: 'Canvas Backpack',
        images: ['1602845860431-35374f24f48d', '1491637639811-60e2756cc1c7'],
      },
      {
        name: 'Aviator Sunglasses',
        images: ['1567473810954-507d59716c25', '1562548726-43b650c82f8e'],
      },
      { name: 'Silk Scarf', images: ['1606259458027-54d2a728b6ab', '1517472292914-9570a594783b'] },
      {
        name: 'Crossbody Bag',
        images: ['1605733513597-a8f8341084e6', '1620786514684-ff35b5aae55e'],
      },
      {
        name: 'Travel Duffel',
        images: ['1448582649076-3981753123b5', '1525103504173-8dc1582c7430'],
      },
      { name: 'Phone Case', images: ['1535157412991-2ef801c1748b', '1623393945964-8f5d573f9358'] },
      { name: 'Card Holder', images: ['1560472355-536de3962603', '1637262448017-0fbbec87a898'] },
      {
        name: 'Wide Brim Hat',
        images: ['1593476087123-36d1de271f08', '1612965292639-cd322db5ff9e'],
      },
      { name: 'Analog Watch', images: ['1542496658-e33a6d0d50f6', '1695345272166-4efd76dd7a21'] },
      { name: 'Tote Bag', images: ['1574365569389-a10d488ca3fb', '1544816155-12df9643f363'] },
      {
        name: 'Keychain Multi-tool',
        images: ['1575908539614-ff89490f4a78', '1677951570313-b0750351c461'],
      },
      {
        name: 'Compact Umbrella',
        images: ['1499678450342-29ebee16d1ab', '1519692933481-e162a57d6721'],
      },
      { name: 'Laptop Bag', images: ['1643033998438-38b4211fa2d5', '1554412664-6e7b242f969d'] },
      {
        name: 'Sunglasses Case',
        images: ['1509695507497-903c140c43b0', '1556306535-38febf6782e7'],
      },
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
      const name = `${brand} ${type.name}`
      const slug = `${category.key}-${slugify(brand)}-${slugify(type.name)}`

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

      const images = type.images.map(imageUrl)

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
