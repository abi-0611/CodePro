import { useState, type FormEvent } from 'react';

interface SecuritySettingsProps {
  user: {
    username: string;
    created_at: string;
  };
}

function getStrength(pw: string): { level: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels: { label: string; color: string }[] = [
    { label: 'Too short', color: '#ef4444' },
    { label: 'Weak', color: '#ef4444' },
    { label: 'Fair', color: '#eab308' },
    { label: 'Strong', color: '#22c55e' },
    { label: 'Very Strong', color: '#16a34a' },
  ];
  return { level: score, ...levels[score] };
}

export default function SecuritySettings({ user }: SecuritySettingsProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = getStrength(newPassword);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = 'Current password is required';
    if (newPassword.length < 8) errs.newPassword = 'Must be at least 8 characters';
    else if (!/[A-Z]/.test(newPassword)) errs.newPassword = 'Must contain at least 1 uppercase letter';
    else if (!/[0-9]/.test(newPassword)) errs.newPassword = 'Must contain at least 1 number';
    else if (!/[^A-Za-z0-9]/.test(newPassword)) errs.newPassword = 'Must contain at least 1 special character';
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch('/admin/api/proxy/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });

      if (res.ok) {
        setMsg({ type: 'success', text: 'Password changed successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json().catch(() => ({}));
        setMsg({ type: 'error', text: data.detail || 'Failed to change password' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error. Try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await fetch('/admin/api/admin-auth/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch { /* handled by redirect */ }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '640px' }}>
      {/* Change Password */}
      <div className="admin-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>🔐 Change Password</h3>
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.8rem', marginBottom: '0.35rem' }}>
              Current Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="admin-input"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => { setCurrentPassword(e.target.value); if (errors.currentPassword) setErrors(p => { const n = { ...p }; delete n.currentPassword; return n; }); }}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.5 }}>
                {showCurrent ? '🙈' : '👁'}
              </button>
            </div>
            {errors.currentPassword && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>{errors.currentPassword}</div>}
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.8rem', marginBottom: '0.35rem' }}>
              New Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="admin-input"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); if (errors.newPassword) setErrors(p => { const n = { ...p }; delete n.newPassword; return n; }); }}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.5 }}>
                {showNew ? '🙈' : '👁'}
              </button>
            </div>
            {newPassword && (
              <div style={{ marginTop: '0.4rem' }}>
                <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.25rem' }}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{
                      flex: 1, height: '3px', borderRadius: '2px',
                      background: i < strength.level ? strength.color : '#e5e7eb',
                      transition: 'background 0.2s',
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: '0.7rem', color: strength.color, fontWeight: 500 }}>{strength.label}</span>
              </div>
            )}
            {errors.newPassword && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>{errors.newPassword}</div>}
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Min 8 chars, 1 uppercase, 1 number, 1 special character
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.8rem', marginBottom: '0.35rem' }}>
              Confirm Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              className="admin-input"
              type="password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(p => { const n = { ...p }; delete n.confirmPassword; return n; }); }}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.2rem' }}>{errors.confirmPassword}</div>}
          </div>

          {msg && (
            <div style={{
              padding: '0.75rem',
              background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: '8px',
              color: msg.type === 'success' ? '#16a34a' : '#dc2626',
              fontSize: '0.85rem',
            }}>
              {msg.text}
            </div>
          )}

          <button type="submit" className="admin-btn-primary" disabled={saving}
            style={{ alignSelf: 'flex-start', padding: '0.625rem 1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {saving && <span className="admin-spinner" />}
            Change Password
          </button>
        </form>
      </div>

      {/* Active Sessions */}
      <div className="admin-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>📱 Active Sessions</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Session management will be available in a future update.
        </p>
        <button type="button" onClick={handleLogoutAll}
          style={{ padding: '0.5rem 1rem', border: '1px solid #fecaca', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' }}>
          Sign Out All Devices
        </button>
      </div>

      {/* Account Info */}
      <div className="admin-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>👤 Account Info</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, minWidth: '120px', color: 'var(--text-secondary)' }}>Username:</span>
            <span style={{ fontWeight: 600 }}>{user.username}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, minWidth: '120px', color: 'var(--text-secondary)' }}>Created:</span>
            <span>{new Date(user.created_at).toLocaleDateString()}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ fontWeight: 500, minWidth: '120px', color: 'var(--text-secondary)' }}>Last Login:</span>
            <span style={{ color: 'var(--text-secondary)' }}>N/A</span>
          </div>
        </div>
      </div>
    </div>
  );
}
