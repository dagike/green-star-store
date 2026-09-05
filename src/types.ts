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

export type PromoKind = 'percent' | 'fixed' | 'free_shipping'

export interface PromoApplyResponse {
  code: string
  kind: PromoKind
  value: number
}

export interface CartItem {
  productId: number
  slug: string
  name: string
  brand: string
  thumbnail: string | null
  priceCents: number
  compareAtCents: number | null
  stock: number
  quantity: number
}

export interface WishlistItem {
  productId: number
  slug: string
  name: string
  brand: string
  thumbnail: string | null
  priceCents: number
  compareAtCents: number | null
  stock: number
}

export interface OrderAddress {
  fullName: string
  address1: string
  address2: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
}

export interface OrderItem {
  productId: number
  slug: string
  name: string
  thumbnail: string | null
  priceCents: number
  quantity: number
}

export interface Order {
  orderNumber: string
  email: string
  items: OrderItem[]
  address: OrderAddress
  subtotalCents: number
  discountCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  status: string
  estimatedDelivery: string
  createdAt: string
}

export interface CreateOrderRequest {
  email: string
  address: OrderAddress
  items: { productId: number; quantity: number }[]
  promoCode?: string | null
}
