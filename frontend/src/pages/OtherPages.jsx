import { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, StatCard } from '../components/ui';
import toast from 'react-hot-toast';

// ── CLIENTES ──────────────────────────────────────
export function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  const load = async (s = '') => {
    try {
      const { data } = await api.get(`/api/customers${s ? `?search=${s}` : ''}`);
      setCustomers(data);
    } catch { toast.error('Erro ao carregar clientes'); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Clientes</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>{customers.length} clientes cadastrados via WhatsApp</p>
      </div>

      <Card style={{ marginBottom: 16 }} padding="10px 14px">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..."
            style={{ width: '100%', padding: '7px 10px 7px 30px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontFamily: 'inherit', fontSize: 13, outline: 'none', background: 'var(--bg)' }} />
        </div>
      </Card>

      <Card padding="0">
        {customers.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
            <div style={{ fontWeight: 600 }}>Nenhum cliente encontrado</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Cliente', 'WhatsApp', 'Total de visitas', 'Última visita'].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--blue)', flexShrink: 0 }}>
                        {(c.name || c.phone)?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{c.name || '—'}</div>
                        {!c.name && <div style={{ fontSize: 11, color: 'var(--muted)' }}>Nome não informado</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--muted)' }}>💬 {c.phone}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: c.totalAppointments > 5 ? 'var(--green)' : 'var(--text)' }}>
                      {c.totalAppointments}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>visita{c.totalAppointments !== 1 ? 's' : ''}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>
                    {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString('pt-BR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ── SERVIÇOS ─────────────────────────────────────
export function Services() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    api.get('/api/services').then(r => setServices(r.data)).catch(() => toast.error('Erro ao carregar serviços'));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Serviços</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Catálogo enviado automaticamente pelo bot quando o cliente pergunta preços</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {services.map(s => (
          <Card key={s.id} padding="18px 20px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{s.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 3 }}>{s.name}</div>
                {s.description && <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{s.description}</div>}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)', flexShrink: 0 }}>Ativo</span>
            </div>
            <div style={{ display: 'flex', gap: 16, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Duração</div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>⏱️ {s.durationMinutes} min</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Preço</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--green)' }}>R$ {Number(s.price).toFixed(2)}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── CONFIGURAÇÕES ─────────────────────────────────
export function Settings() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api.get('/api/whatsapp/status').then(r => setStatus(r.data)).catch(() => {});
    const t = setInterval(() => {
      api.get('/api/whatsapp/status').then(r => setStatus(r.data)).catch(() => {});
    }, 10000);
    return () => clearInterval(t);
  }, []);

  const isOnline = status?.state === 'open';

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Configurações</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* WhatsApp status */}
        <Card>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            💬 Conexão WhatsApp
          </div>

          <div style={{
            padding: '20px', borderRadius: 'var(--r)', textAlign: 'center', marginBottom: 16,
            background: isOnline ? 'var(--green-bg)' : 'var(--red-bg)',
            border: `1px solid ${isOnline ? 'var(--green-border)' : 'var(--red-border)'}`,
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{isOnline ? '✅' : '❌'}</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: isOnline ? 'var(--green)' : 'var(--red)', marginBottom: 4 }}>
              {isOnline ? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {isOnline ? 'Bot ativo e recebendo mensagens' : 'Escaneie o QR Code para conectar'}
            </div>
          </div>

          {!isOnline && (
            <div style={{ padding: '14px', background: 'var(--blue-bg)', borderRadius: 'var(--r-sm)', border: '1px solid var(--blue-border)', fontSize: 13, color: 'var(--blue)', lineHeight: 1.6 }}>
              <strong>Como conectar:</strong><br />
              1. Abra o WhatsApp no celular<br />
              2. Toque em <strong>Dispositivos conectados</strong><br />
              3. Toque em <strong>Conectar dispositivo</strong><br />
              4. Escaneie o QR Code na Evolution API
            </div>
          )}
        </Card>

        {/* Info */}
        <Card>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>🤖 Como o bot funciona</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { emoji: '1️⃣', title: 'Cliente manda "oi"', desc: 'Bot responde com o menu de opções automaticamente' },
              { emoji: '2️⃣', title: 'Escolha guiada', desc: 'Serviço → Profissional → Data → Horário disponível' },
              { emoji: '3️⃣', title: 'IA responde dúvidas', desc: 'Perguntas sobre preços, endereço e horários são respondidas por IA' },
              { emoji: '4️⃣', title: 'Confirmação automática', desc: 'Agendamento salvo e confirmação enviada para o cliente' },
              { emoji: '5️⃣', title: 'Painel atualiza', desc: 'Você vê o agendamento aqui em tempo real com badge "WhatsApp"' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>{item.emoji}</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 1 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
