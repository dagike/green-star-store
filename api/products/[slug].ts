import { getSql } from '../_db.js'
import { param } from '../_params.js'
import type { ApiRequest, ApiResponse } from '../_types.js'

interface ProductRow {
  id: number
  slug: string
  name: string
  brand: string
  description: string
  category: string
  price_cents: number
  compare_at_cents: number | null
  stock: number
  avg_rating: string
  review_count: number
  created_at: string
}

interface ImageRow {
  url: string
  alt: string
  position: number
}

interface ReviewRow {
  id: number
  author: string
  rating: number
  title: string
  body: string
  created_at: string
}

interface RelatedRow {
  slug: string
  name: string
  brand: string
  price_cents: number
  compare_at_cents: number | null
  avg_rating: string
  thumbnail: string | null
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const slug = param(req.query, 'slug')
  if (!slug) {
    res.status(400).json({ error: 'Missing product slug' })
    return
  }

  try {
    const sql = getSql()

    const products = (await sql.query(
      `select id, slug, name, brand, description, category, price_cents, compare_at_cents,
              stock, avg_rating, review_count, created_at
       from products
       where slug = $1`,
      [slug],
    )) as ProductRow[]

    const product = products[0]
    if (!product) {
      res.status(404).json({ error: 'Product not found' })
      return
    }

    const images = (await sql.query(
      `select url, alt, position from product_images where product_id = $1 order by position`,
      [product.id],
    )) as ImageRow[]

    const reviews = (await sql.query(
      `select id, author, rating, title, body, created_at
       from reviews
       where product_id = $1
       order by created_at desc`,
      [product.id],
    )) as ReviewRow[]

    const related = (await sql.query(
      `select
         p.slug, p.name, p.brand, p.price_cents, p.compare_at_cents, p.avg_rating,
         (select url from product_images pi where pi.product_id = p.id
           order by position limit 1) as thumbnail
       from products p
       where p.category = $1 and p.id != $2
       order by p.avg_rating desc, p.id
       limit 4`,
      [product.category, product.id],
    )) as RelatedRow[]

    res.status(200).json({
      product: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        description: product.description,
        category: product.category,
        priceCents: product.price_cents,
        compareAtCents: product.compare_at_cents,
        stock: product.stock,
        avgRating: Number(product.avg_rating),
        reviewCount: product.review_count,
        createdAt: product.created_at,
      },
      images: images.map((image) => ({
        url: image.url,
        alt: image.alt,
        position: image.position,
      })),
      reviews: reviews.map((review) => ({
        id: review.id,
        author: review.author,
        rating: review.rating,
        title: review.title,
        body: review.body,
        createdAt: review.created_at,
      })),
      related: related.map((item) => ({
        slug: item.slug,
        name: item.name,
        brand: item.brand,
        priceCents: item.price_cents,
        compareAtCents: item.compare_at_cents,
        avgRating: Number(item.avg_rating),
        thumbnail: item.thumbnail,
      })),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to load product' })
  }
}
