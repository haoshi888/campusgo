import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { AuthPage } from './pages/AuthPage'
import { ChatPage } from './pages/ChatPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { ProfilePage } from './pages/ProfilePage'
import { PublishPage } from './pages/PublishPage'
import { SearchPage } from './pages/SearchPage'
import { TradeSuccessPage } from './pages/TradeSuccessPage'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="product/:id" element={<ProductDetailPage />} />
            <Route path="publish" element={<PublishPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="chat/:id" element={<ChatPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="dashboard" element={<AnalyticsPage />} />
            <Route path="trade/:id/success" element={<TradeSuccessPage />} />
            <Route path="404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
