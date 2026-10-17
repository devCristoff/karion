import React, { useState } from 'react';
import { Lock, Mail, User, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { authService } from '../../services/auth';
import { User as UserType } from '../../types';

interface AuthViewProps {
  onAuthSuccess: (user: UserType) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Por favor ingresa tu correo y contraseña.');
      return;
    }

    if (isRegister && !name.trim()) {
      setErrorMessage('Por favor introduce tu nombre completo.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        const res = await authService.register(email, password, name);
        onAuthSuccess(res.user);
      } else {
        const res = await authService.login(email, password);
        onAuthSuccess(res.user);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de autenticación. Intenta de nuevo.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-amber-500/20 selection:text-amber-200">
      {/* Background Subtle Ambience Glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-neutral-950 font-black text-xl shadow-lg shadow-amber-500/20 mb-3">
            K
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Kairon</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs">
            Gestor de productividad personal y retos diarios inspirado en <span className="text-neutral-300 font-medium">Kairós</span>.
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-950/80 rounded-xl mb-6 border border-neutral-800/80">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                !isRegister
                  ? 'bg-neutral-900 text-white shadow-sm border border-neutral-700/60'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                isRegister
                  ? 'bg-neutral-900 text-white shadow-sm border border-neutral-700/60'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
              <span className="flex-1 leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Cristóbal Mota"
                    required={isRegister}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 focus:outline-none p-0.5"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-neutral-950 font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Registrarme y Comenzar' : 'Acceder'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
