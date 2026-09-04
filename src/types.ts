// Shared types mirroring the /api response shapes (see api/products/*, api/categories.ts,
// api/suggest.ts). Kept in sync by hand since the client and API live in the same repo.

export type ProductSort = 'price_asc' | 'price_desc' | 'newest' | 'top_rated'

export interface ProductSummary {
  id: number
  slug: string
  name: string
  brand: string
  category: string
  priceCents: number
  compareAtCents: number | null
  stock: number
  avgRating: number
  reviewCount: number
  thumbnail: string | null
}

export interface ProductImage {
  url: string
  alt: string
  position: number
}

export interface Review {
  id: number
  author: string
  rating: number
  title: string
  body: string
  createdAt: string
}

export interface RelatedProduct {
  slug: string
  name: string
  brand: string
  priceCents: number
  compareAtCents: number | null
  avgRating: number
  thumbnail: string | null
}

export interface ProductDetail {
  id: number
  slug: string
  name: string
  brand: string
  description: string
  category: string
  priceCents: number
  compareAtCents: number | null
  stock: number
  avgRating: number
  reviewCount: number
  createdAt: string
}

export interface ProductDetailResponse {
  product: ProductDetail
  images: ProductImage[]
  reviews: Review[]
  related: RelatedProduct[]
}

export interface ProductListResponse {
  items: ProductSummary[]
  nextCursor: string | null
}

export interface ProductListParams {
  q?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  inStock?: boolean
  sort?: ProductSort
  cursor?: string | null
  limit?: number
}

export interface CategoryFacet {
  category: string
  count: number
}

export interface CategoriesResponse {
  categories: CategoryFacet[]
  priceRange: { min: number; max: number }
}

export interface Suggestion {
  slug: string
  name: string
  brand: string
  category: string
}

export interface SuggestResponse {
  items: Suggestion[]
}
