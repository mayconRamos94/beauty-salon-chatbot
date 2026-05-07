import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Scissors, MessageSquare, Settings } from 'lucide-react';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/agenda', icon: Calendar, label: 'Agenda' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/servicos', icon: Scissors, label: 'Serviços' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
];

export default function Sidebar({ whatsappStatus }) {
  const isOnline = whatsappStatus === 'open';

  const linkStyle = active => ({
    display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px',
    borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: 500,
    textDecoration: 'none', transition: 'all .15s',
    color: active ? 'var(--blue)' : 'var(--muted)',
    background: active ? 'var(--blue-bg)' : 'transparent',
    borderLeft: `2px solid ${active ? 'var(--blue)' : 'transparent'}`,
  });

  return (
    <aside style={{
      width: 220, flexShrink: 0, background: 'var(--white)',
      borderRight: '1px solid var(--border)', display: 'flex',
      flexDirection: 'column', height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 18px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--wa-bg)', border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            💇‍♀️
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Salão Chatbot</div>
            <div style={{ fontSize: 11, color: 'var(--muted-light)' }}>Painel de controle</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => linkStyle(isActive)}>
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* WhatsApp status */}
      <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
          borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 500,
          background: isOnline ? 'var(--wa-bg)' : 'var(--red-bg)',
          color: isOnline ? 'var(--wa)' : 'var(--red)',
          border: `1px solid ${isOnline ? '#bbf7d0' : 'var(--red-border)'}`,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: isOnline ? 'var(--wa)' : 'var(--red)', flexShrink: 0, ...(isOnline ? { boxShadow: '0 0 0 2px rgba(37,211,102,.2)', animation: 'pulse 2s infinite' } : {}) }} />
          WhatsApp {isOnline ? 'conectado' : 'desconectado'}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      </div>
    </aside>
  );
}
