import React, { useState, useEffect, useRef } from 'react';
import { usePDF } from '../../context/PDFContext';
import { 
  Lock, 
  KeyRound, 
  ShieldAlert, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  RotateCcw,
  ShieldCheck,
  Trash2
} from 'lucide-react';

const MASTER_PASSWORD_KEY = 'ultimate_pdf_master_password';

export const getStoredMasterPassword = (): string | null => {
  return localStorage.getItem(MASTER_PASSWORD_KEY);
};

export const setStoredMasterPassword = (pw: string) => {
  localStorage.setItem(MASTER_PASSWORD_KEY, pw);
};

export const SecurityDeleteModal: React.FC = () => {
  const { 
    securityAction, 
    closeSecurityModal 
  } = usePDF();

  const [mode, setMode] = useState<'SETUP' | 'VERIFY' | 'RESET'>('VERIFY');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (securityAction) {
      setPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setShowPassword(false);
      
      const stored = getStoredMasterPassword();
      if (securityAction.isResetOnly) {
        setMode('RESET');
      } else if (!stored) {
        setMode('SETUP');
      } else {
        setMode('VERIFY');
      }

      const timer = setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [securityAction]);

  if (!securityAction) return null;

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setShake(true);
    setTimeout(() => setShake(false), 400);
    passwordInputRef.current?.focus();
  };

  const handleConfirm = () => {
    if (mode === 'SETUP' || mode === 'RESET') {
      if (!password.trim()) {
        triggerError('Please enter a valid password');
        return;
      }
      if (password !== confirmPassword) {
        triggerError('Passwords do not match. Please re-type.');
        return;
      }

      setStoredMasterPassword(password);
      
      if (securityAction.isResetOnly) {
        closeSecurityModal();
        return;
      }

      // Execute protected deletion
      securityAction.onConfirm();
      closeSecurityModal();
    } else if (mode === 'VERIFY') {
      const stored = getStoredMasterPassword();
      if (password === stored) {
        securityAction.onConfirm();
        closeSecurityModal();
      } else {
        triggerError('Incorrect password! Try again or click "Reset Password" below.');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeSecurityModal();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSecurityModal();
      }}
    >
      <div className={`bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col transition-all ${
        shake ? 'animate-bounce ring-2 ring-red-500/60' : ''
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              mode === 'SETUP'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : mode === 'RESET'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {mode === 'SETUP' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : mode === 'RESET' ? (
                <RotateCcw className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">
                {mode === 'SETUP'
                  ? 'Set Master Delete Password'
                  : mode === 'RESET'
                  ? 'Reset Master Password'
                  : (securityAction.title || 'Password Required')}
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'SETUP'
                  ? 'Create a 1-time master password to protect deletions'
                  : mode === 'RESET'
                  ? 'Set a new master password without old password'
                  : 'Security authorization check'}
              </p>
            </div>
          </div>

          <button 
            onClick={closeSecurityModal}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Target Item Description in verify mode */}
          {mode === 'VERIFY' && securityAction.itemDescription && (
            <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-xl flex items-start gap-2.5 text-xs text-red-200 leading-relaxed">
              <Trash2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-white">{securityAction.itemDescription}</span>
                <p className="text-[11px] text-red-300/80 mt-0.5">Please enter your master password to authorize this deletion.</p>
              </div>
            </div>
          )}

          {mode === 'SETUP' && (
            <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl flex items-start gap-2.5 text-xs text-blue-200 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p>
                First-time setup: Choose a password to protect your drawings, stamps, notes, and documents from accidental deletion.
              </p>
            </div>
          )}

          {/* Password Input Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                {mode === 'VERIFY' ? 'Master Password' : 'New Master Password'}
              </label>
              <div className="relative">
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'VERIFY' ? 'Enter password...' : 'Enter new password...'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {(mode === 'SETUP' || mode === 'RESET') && (
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Confirm Master Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter password to confirm..."
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-2.5 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-center gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Reset password link without requiring old password */}
          {mode === 'VERIFY' && (
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-500 text-[11px]">Forgot password?</span>
              <button
                type="button"
                onClick={() => {
                  setPassword('');
                  setConfirmPassword('');
                  setErrorMsg('');
                  setMode('RESET');
                }}
                className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Password (No Old Password Needed)
              </button>
            </div>
          )}

          {mode === 'RESET' && !securityAction.isResetOnly && (
            <div className="flex items-center justify-end pt-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setPassword('');
                  setConfirmPassword('');
                  setErrorMsg('');
                  setMode('VERIFY');
                }}
                className="text-slate-400 hover:text-slate-200 hover:underline cursor-pointer"
              >
                ← Back to Password Verification
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/95">
          <button
            type="button"
            onClick={closeSecurityModal}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
              mode === 'SETUP'
                ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                : mode === 'RESET'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                : 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
            }`}
          >
            {mode === 'SETUP' ? (
              <>
                <Check className="w-4 h-4" /> Save Password & Continue
              </>
            ) : mode === 'RESET' ? (
              <>
                <KeyRound className="w-4 h-4" /> Update Password
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" /> Confirm & Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
