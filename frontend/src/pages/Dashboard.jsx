import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../services/api';
import { Card, StatCard, StatusBadge, SourceBadge, Button } from '../components/ui';
import toast from 'react-hot-toast';

const STATUS_NEXT = { scheduled: 'confirmed', confirmed: 'completed' };
const STATUS_NEXT_LABEL = { scheduled: '✓ Confirmar', confirmed: '✓ Concluir' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data: d } = await api.get('/api/dashboard');
      setData(d);
    } catch { toast.error('Erro ao carregar dashboard'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const advance = async (id, status) => {
    try {
      await api.patch(`/api/appointments/${id}/status`, { status: STATUS_NEXT[status] });
      toast.success('Status atualizado!');
      load();
    } catch { toast.error('Erro ao atualizar'); }
  };

  const fmtTime = t => t?.slice(0, 5);
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)' }}>Carregando...</div>;

  const { stats = {}, todayAppointments = [], whatsappStatus } = data || {};

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'capitalize' }}>{today}</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard icon="📅" label="Consultas hoje" value={stats.todayCount} color="var(--blue)" bg="var(--blue-bg)" />
        <StatCard icon="📆" label="Agendamentos futuros" value={stats.scheduledTotal} color="var(--amber)" bg="var(--amber-bg)" />
        <StatCard icon="👥" label="Clientes" value={stats.totalCustomers} color="var(--purple)" bg="var(--purple-bg)" />
        <StatCard icon="💬" label="Via WhatsApp hoje" value={stats.viaWhatsapp} color="var(--wa)" bg="var(--wa-bg)" sub="Agendamentos automáticos" />
      </div>

      {/* Today's schedule */}
      <Card padding="0">
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>📅 Agenda de hoje</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{todayAppointments.length} agendamento{todayAppointments.length !== 1 ? 's' : ''}</span>
        </div>

        {todayAppointments.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
            <div style={{ fontWeight: 600 }}>Sem agendamentos hoje</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>O dia está livre ou os agendamentos ainda não chegaram</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Horário', 'Cliente', 'Serviço', 'Profissional', 'Origem', 'Status', 'Ação'].map(h => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {todayAppointments.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 13 }}>
                      {fmtTime(a.startTime)}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted-light)', marginLeft: 4 }}>→ {fmtTime(a.endTime)}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{a.customer?.name || a.customer?.phone}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.customer?.phone}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>
                    {a.service?.emoji} {a.service?.name}
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.service?.durationMinutes}min · R$ {Number(a.service?.price || 0).toFixed(2)}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text2)' }}>{a.professional?.avatarEmoji} {a.professional?.name}</td>
                  <td style={{ padding: '12px 16px' }}><SourceBadge source={a.bookedVia} /></td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={a.status} size="sm" /></td>
                  <td style={{ padding: '12px 16px' }}>
                    {STATUS_NEXT[a.status] && (
                      <Button variant="success" size="sm" onClick={() => advance(a.id, a.status)}>
                        {STATUS_NEXT_LABEL[a.status]}
                      </Button>
                    )}
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
