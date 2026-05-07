import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import { Customers, Services, Settings } from './pages/OtherPages';
import api from './services/api';

function Layout({ children, whatsappStatus }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar whatsappStatus={whatsappStatus} />
      <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const [waStatus, setWaStatus] = useState('unknown');

  useEffect(() => {
    const check = () => api.get('/api/whatsapp/status').then(r => setWaStatus(r.data?.state || 'unknown')).catch(() => {});
    check();
    const t = setInterval(check, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'Inter, sans-serif', fontSize: 13, background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a' } }} />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard"    element={<Layout whatsappStatus={waStatus}><Dashboard /></Layout>} />
        <Route path="/agenda"       element={<Layout whatsappStatus={waStatus}><Agenda /></Layout>} />
        <Route path="/clientes"     element={<Layout whatsappStatus={waStatus}><Customers /></Layout>} />
        <Route path="/servicos"     element={<Layout whatsappStatus={waStatus}><Services /></Layout>} />
        <Route path="/configuracoes" element={<Layout whatsappStatus={waStatus}><Settings /></Layout>} />
        <Route path="*"             element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
