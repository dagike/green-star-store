import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AccountOrders } from './routes/AccountOrders'
import { Cart } from './routes/Cart'
import { Catalog } from './routes/Catalog'
import { Checkout } from './routes/Checkout'
import { Home } from './routes/Home'
import { NotFound } from './routes/NotFound'
import { OrderConfirmation } from './routes/OrderConfirmation'
import { ProductDetail } from './routes/ProductDetail'
import { Wishlist } from './routes/Wishlist'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Catalog />} />
        <Route path="products/:slug" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order/:number" element={<OrderConfirmation />} />
        <Route path="wishlist" element={<Wishlist />} />
        <Route path="account/orders" element={<AccountOrders />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
