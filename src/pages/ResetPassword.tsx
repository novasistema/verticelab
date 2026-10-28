import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { supabase } from '../platform/supabase';
import { useAuth } from '../platform/auth';
import { btn, LoadingScreen } from '../platform/ui';
import { AuthShell, Field, Notice } from './Login';

export default function ResetPassword() {
  const { session, loading, clearRecovery } = useAuth();
  const navigate = useNavigate();
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  if (loading) return <LoadingScreen text="Verificando el link…" />;

  if (!session) {
    return (
      <AuthShell title="Link vencido" subtitle="El link para cambiar la contraseña ya no es válido o se usó antes.">
        <Link to="/ingresar" className={btn.gold}>Pedir un link nuevo</Link>
      </AuthShell>
    );
  }

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (pass.length < 8) return setError('La contraseña tiene que tener al menos 8 caracteres.');
    if (pass !== pass2) return setError('Las contraseñas no coinciden.');
    setGuardando(true);
    const { error } = await supabase.auth.updateUser({ password: pass });
    setGuardando(false);
    if (error) return setError('No pudimos guardar la contraseña. Probá con otra distinta.');
    clearRecovery();
    navigate('/mis-apps', { replace: true });
  };

  return (
    <AuthShell title="Nueva contraseña" subtitle={`Para ${session.user.email}`}>
      <form onSubmit={guardar} className="flex flex-col gap-5">
        {error && <Notice kind="error">{error}</Notice>}
        <Field id="p1" label="Nueva contraseña" icon={Lock} type="password" value={pass} onChange={setPass} autoComplete="new-password" />
        <Field id="p2" label="Repetir contraseña" icon={Lock} type="password" value={pass2} onChange={setPass2} autoComplete="new-password" />
        <button type="submit" disabled={guardando} className={btn.gold}>
          {guardando ? 'Guardando…' : 'Guardar y entrar'}
        </button>
      </form>
    </AuthShell>
  );
}
