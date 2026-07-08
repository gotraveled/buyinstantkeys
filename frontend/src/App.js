import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "sonner";
import { CartProvider } from "@/lib/cart";
import Navbar from "@/components/Layout/Navbar";
import Footer from "@/components/Layout/Footer";
import OfferBanner from "@/components/OfferBanner";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderSuccess from "@/pages/OrderSuccess";
import OrderTrack from "@/pages/OrderTrack";
import FAQ from "@/pages/FAQ";
import Contact from "@/pages/Contact";
import RefundPolicy from "@/pages/RefundPolicy";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Terms from "@/pages/Terms";
import Disclaimer from "@/pages/Disclaimer";
import DigitalDelivery from "@/pages/DigitalDelivery";
import About from "@/pages/About";
import Activation from "@/pages/Activation";
import ActivationThanks from "@/pages/ActivationThanks";
import CategoryPage from "@/pages/CategoryPage";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout({ children, showChrome = true }) {
  return (
    <div className="App flex min-h-screen flex-col">
      {showChrome && <OfferBanner />}
      {showChrome && <Navbar />}
      <main className="flex-1">{children}</main>
      {showChrome && <Footer />}
    </div>
  );
}

function AppShell() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  const hideChrome = isAdmin;
  return (
    <Layout showChrome={!hideChrome}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/track" element={<OrderTrack />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/terms-and-conditions" element={<Terms />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/digital-delivery" element={<DigitalDelivery />} />
        <Route path="/how-it-works" element={<DigitalDelivery />} />
        <Route path="/about" element={<About />} />
        <Route path="/about-us" element={<About />} />
        <Route path="/activation" element={<Activation />} />
        <Route path="/activation/thanks" element={<ActivationThanks />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <HelmetProvider>
      <CartProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AppShell />
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </CartProvider>
    </HelmetProvider>
  );
}

export default App;
