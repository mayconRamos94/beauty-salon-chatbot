// ── STATUS BADGE ──────────────────────────────────
const STATUS_MAP = {
  scheduled:  { label: 'Agendado',   color: 'var(--blue)',   bg: 'var(--blue-bg)',   border: 'var(--blue-border)' },
  confirmed:  { label: 'Confirmado', color: 'var(--green)',  bg: 'var(--green-bg)',  border: 'var(--green-border)' },
  completed:  { label: 'Concluído',  color: 'var(--muted)',  bg: 'var(--bg)',        border: 'var(--border)' },
  cancelled:  { label: 'Cancelado',  color: 'var(--red)',    bg: 'var(--red-bg)',    border: 'var(--red-border)' },
  no_show:    { label: 'Não veio',   color: 'var(--amber)',  bg: 'var(--amber-bg)',  border: 'var(--amber-border)' },
};

export function StatusBadge({ status, size = 'md' }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.scheduled;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: size === 'sm' ? '2px 8px' : '4px 10px',
      borderRadius: 100, fontSize: size === 'sm' ? 11 : 12,
      fontWeight: 600, color: cfg.color,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

// ── SOURCE BADGE ─────────────────────────────────
export function SourceBadge({ source }) {
  if (source === 'whatsapp') return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: 'var(--wa-bg)', color: 'var(--wa)', border: '1px solid #bbf7d0', whiteSpace: 'nowrap' }}>
      💬 WhatsApp
    </span>
  );
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
      📋 Painel
    </span>
  );
}

// ── CARD ─────────────────────────────────────────
export function Card({ children, style = {}, padding = '20px', onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--white)', border: '1px solid var(--border)',
      borderRadius: 'var(--r)', boxShadow: 'var(--shadow)',
      padding, cursor: onClick ? 'pointer' : undefined,
      transition: onClick ? 'box-shadow .15s' : undefined, ...style,
    }}
      onMouseEnter={onClick ? e => e.currentTarget.style.boxShadow = 'var(--shadow-md)' : undefined}
      onMouseLeave={onClick ? e => e.currentTarget.style.boxShadow = 'var(--shadow)' : undefined}
    >
      {children}
    </div>
  );
}

// ── BUTTON ────────────────────────────────────────
export function Button({ children, onClick, type = 'button', variant = 'primary',
  size = 'md', disabled, loading, style = {}, fullWidth }) {
  const sizes = {
    sm: { padding: '5px 12px', fontSize: 12 },
    md: { padding: '8px 16px', fontSize: 13 },
    lg: { padding: '11px 22px', fontSize: 14 },
  };
  const variants = {
    primary: { background: 'var(--blue)', color: '#fff', border: 'none' },
    ghost:   { background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)' },
    danger:  { background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)' },
    success: { background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)' },
    whatsapp:{ background: 'var(--wa)', color: '#fff', border: 'none' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 6, borderRadius: 'var(--r-sm)', fontFamily: 'inherit', fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1, transition: 'all .15s',
        width: fullWidth ? '100%' : undefined,
        ...sizes[size], ...variants[variant], ...style,
      }}>
      {loading ? '...' : children}
    </button>
  );
}

// ── INPUT ─────────────────────────────────────────
export function Input({ label, value, onChange, type = 'text', placeholder,
  required, error, name, disabled, as = 'input', rows = 3, options = [], style = {} }) {
  const inputStyle = {
    width: '100%', padding: '8px 11px',
    border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)', fontFamily: 'inherit', fontSize: 13,
    color: 'var(--text)', background: disabled ? 'var(--bg)' : 'var(--white)',
    outline: 'none', transition: 'border-color .15s',
  };
  const Tag = as === 'textarea' ? 'textarea' : as === 'select' ? 'select' : 'input';
  return (
    <div style={{ marginBottom: 12, ...style }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 4 }}>
          {label}{required && <span style={{ color: 'var(--blue)', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <Tag name={name} type={type} value={value} onChange={onChange}
        placeholder={placeholder} required={required} disabled={disabled} rows={rows}
        style={{ ...inputStyle, ...(as === 'textarea' ? { resize: 'vertical', minHeight: 72 } : {}) }}
        onFocus={e => e.target.style.borderColor = 'var(--blue)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--red)' : 'var(--border)'}>
        {as === 'select' && options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Tag>
      {error && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{error}</p>}
    </div>
  );
}

// ── STAT CARD ─────────────────────────────────────
export function StatCard({ icon, label, value, color = 'var(--blue)', bg = 'var(--blue-bg)', sub }) {
  return (
    <Card style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1, marginBottom: 3 }}>{value ?? '—'}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--muted-light)' }}>{sub}</div>}
      </div>
    </Card>
  );
}
