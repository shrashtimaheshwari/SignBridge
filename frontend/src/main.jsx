import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './components/LandingPage'
import DashboardPage from './pages/DashboardPage'
import SoloPage from './pages/SoloPage'
import VideoCallPage from './pages/VideoCallPage'
import RoomPage from './pages/RoomPage'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/app" element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="solo" element={<SoloPage />} />
          <Route path="video" element={<VideoCallPage />} />
          <Route path="room/:code" element={<RoomPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  </BrowserRouter>,
)
