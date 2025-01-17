import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Quiz from './pages/Quiz';
import AdminPanel from './pages/AdminPanel';
import ResetPassword from './pages/ResetPassword';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-white">
          <Routes>
            <Route path="/" element={<Quiz />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-panel" element={<AdminPanel />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
          <Toaster position="top-center" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}