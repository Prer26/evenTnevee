import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleRoute from '@/components/RoleRoute';
import BlockVendorAccess from '@/components/BlockVendorAccess';
import ScrollToTop from './components/ScrollToTop';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Marketplace from '@/pages/Marketplace';
import FinancialTracker from '@/pages/FinancialTracker';
import Dashboard from '@/pages/Dashboard';
import VendorDashboard from '@/pages/VendorDashboard';
import VendorRequests from '@/pages/VendorRequests';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Features from '@/pages/Features';
import Pricing from '@/pages/Pricing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Messages from '@/pages/Messages';
import CustomerServices from '@/pages/CustomerServices';

function App() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (window.matchMedia('(pointer: coarse)').matches || prefersReducedMotion) {
      return undefined;
    }

    const cursor = document.createElement('div');
    cursor.className = 'eventneve-cursor';
    cursor.innerHTML = `
      <span class="eventneve-cursor__ring"></span>
      <span class="eventneve-cursor__dot"></span>
    `;

    const root = document.body;
    root.classList.add('eventneve-cursor-enabled');
    root.appendChild(cursor);

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let currentX = target.x;
    let currentY = target.y;

    const moveHandler = (event) => {
      target.x = event.clientX;
      target.y = event.clientY;
      const interactive = event.target.closest('a, button, input, select, textarea, [role="button"], [data-cursor="hover"]');
      root.classList.toggle('eventneve-cursor-hover', Boolean(interactive));
    };

    const tick = () => {
      currentX += (target.x - currentX) * 0.18;
      currentY += (target.y - currentY) * 0.18;
      cursor.style.left = `${currentX}px`;
      cursor.style.top = `${currentY}px`;
      requestAnimationFrame(tick);
    };

    document.addEventListener('pointermove', moveHandler, { passive: true });
    requestAnimationFrame(tick);

    return () => {
      document.removeEventListener('pointermove', moveHandler);
      root.classList.remove('eventneve-cursor-enabled', 'eventneve-cursor-hover');
      root.removeChild(cursor);
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route element={<BlockVendorAccess />}>
                  <Route path="/marketplace" element={<Marketplace />} />
                  <Route path="/pricing" element={<Pricing />} />
                </Route>
                <Route path="/about" element={<About />} />
                <Route path="/customer-services" element={<CustomerServices />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/features" element={<Features />} />

                <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
                  <Route path="/financial-tracker" element={<FinancialTracker />} />
                  <Route element={<RoleRoute allow="event_planner" />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                  </Route>
                  <Route element={<RoleRoute allow="vendor" />}>
                    <Route path="/vendor-dashboard" element={<VendorDashboard />} />
                    <Route path="/vendor-requests" element={<VendorRequests />} />
                  </Route>
                  <Route path="/messages" element={<Messages />} />
                </Route>
              </Route>

              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
