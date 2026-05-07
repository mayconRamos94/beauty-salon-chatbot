import { useState, useEffect, useCallback } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { Card, StatusBadge, SourceBadge, Button } from '../components/ui';
import toast from 'react-hot-toast';

const STATUS_NEXT = { scheduled: 'confirmed', confirmed: 'completed' };
const STATUS_NEXT_LABEL = { scheduled: 'Confirmar', confirmed: 'Concluir' };
const STATUS_ALL = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'];

export default function Agenda() {
  const [date, setDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const dateStr = format(date, 'yyyy-MM-dd');
  const weekday = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { date: dateStr };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/api/appointments', { params });
      setAppointments(data);
    } catch { toast.error('Erro ao carregar agenda'); }
    finally { setLoading(false); }
  }, [dateStr, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/appointments/${id}/status`, { status });
      toast.success('Status atualizado!');
      load();
    } catch { toast.error('Erro ao atualizar'); }
  };

  const fmtTime = t => t?.slice(0, 5);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Agenda</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'capitalize' }}>{weekday}</p>
      </div>

      {/* Controls */}
      <Card style={{ marginBottom: 16 }} padding="12px 16px">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setDate(d => subDays(d, 1))}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={15} color="var(--muted)" />
          </button>

          <input type="date" value={dateStr} onChange={e => setDate(new Date(e.target.value + 'T12:00:00'))}
            style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontFamily: 'inherit', fontSize: 13, outline: 'none', cursor: 'pointer' }} />

          <button onClick={() => setDate(d => addDays(d, 1))}
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={15} color="var(--muted)" />
          </button>

          <button onClick={() => setDate(new Date())}
            style={{ fontSize: 12, fontWeight: 500, color: 'var(--blue)', background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', padding: '5px 12px', borderRadius: 100, cursor: 'pointer', fontFamily: 'inherit' }}>
            Hoje
          </button>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 'auto' }}>
            {[{ value: '', label: 'Todos' }, ...STATUS_ALL.map(s => ({ value: s, label: s }))].map(opt => (
              <button key={opt.value} onClick={() => setStatusFilter(opt.value)}
                style={{
                  padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
                  background: statusFilter === opt.value ? 'var(--blue)' : 'transparent',
                  color: statusFilter === opt.value ? '#fff' : 'var(--muted)',
                  border: `1px solid ${statusFilter === opt.value ? 'var(--blue)' : 'var(--border)'}`,
                }}>
                {opt.label || 'Todos'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Appointments */}
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)' }}>Carregando...</div>
      ) : appointments.length === 0 ? (
        <Card>
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Nenhum agendamento neste dia</div>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {appointments.map(a => (
            <Card key={a.id} padding="16px 20px">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

                {/* Time */}
                <div style={{ textAlign: 'center', minWidth: 52, flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{fmtTime(a.startTime)}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-light)' }}>{fmtTime(a.endTime)}</div>
                </div>

                <div style={{ width: 1, height: 40, background: 'var(--border)', flexShrink: 0 }} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{a.customer?.name || a.customer?.phone}</span>
                    <StatusBadge status={a.status} size="sm" />
                    <SourceBadge source={a.bookedVia} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {a.service?.emoji} {a.service?.name} · {a.professional?.avatarEmoji} {a.professional?.name}
                    {a.service?.price && ` · R$ ${Number(a.service.price).toFixed(2)}`}
                  </div>
                  {a.customer?.phone && <div style={{ fontSize: 11, color: 'var(--muted-light)', marginTop: 2 }}>📱 {a.customer.phone}</div>}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                  {STATUS_NEXT[a.status] && (
                    <Button variant="success" size="sm" onClick={() => updateStatus(a.id, STATUS_NEXT[a.status])}>
                      ✓ {STATUS_NEXT_LABEL[a.status]}
                    </Button>
                  )}
                  {a.status !== 'cancelled' && a.status !== 'completed' && (
                    <Button variant="danger" size="sm" onClick={() => {
                      if (confirm('Cancelar este agendamento?')) updateStatus(a.id, 'cancelled');
                    }}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
