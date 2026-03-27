import React, { useState, useEffect, useRef, useCallback } from 'react';

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface AutoSaveConfig {
  delay?: number;
  onSave: () => Promise<void>;
  onSaveStart?: () => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export function useAutoSave(data: unknown, config: AutoSaveConfig) {
  const { delay = 2000, onSave, onSaveStart, onSaveSuccess, onSaveError } = config;
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRef = useRef(true);
  const dataRef = useRef(data);
  const savingRef = useRef(false);

  // Keep callbacks in refs to avoid dependency cycles
  const onSaveRef = useRef(onSave);
  const onSaveStartRef = useRef(onSaveStart);
  const onSaveSuccessRef = useRef(onSaveSuccess);
  const onSaveErrorRef = useRef(onSaveError);
  useEffect(() => {
    onSaveRef.current = onSave;
    onSaveStartRef.current = onSaveStart;
    onSaveSuccessRef.current = onSaveSuccess;
    onSaveErrorRef.current = onSaveError;
  });

  const cancelPendingSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const triggerSave = useCallback(async () => {
    if (savingRef.current) return;
    cancelPendingSave();
    savingRef.current = true;
    setSaveStatus('saving');
    onSaveStartRef.current?.();
    try {
      await onSaveRef.current();
      setSaveStatus('saved');
      setLastSaved(new Date());
      onSaveSuccessRef.current?.();
      setTimeout(() => setSaveStatus(prev => (prev === 'saved' ? 'idle' : prev)), 3000);
    } catch (err) {
      setSaveStatus('error');
      onSaveErrorRef.current?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      savingRef.current = false;
    }
  }, [cancelPendingSave]);

  // Debounced auto-save on data change
  useEffect(() => {
    if (initialRef.current) {
      initialRef.current = false;
      dataRef.current = data;
      return;
    }
    if (JSON.stringify(dataRef.current) === JSON.stringify(data)) return;
    dataRef.current = data;

    setSaveStatus('pending');
    cancelPendingSave();
    timerRef.current = setTimeout(() => {
      triggerSave();
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, delay, triggerSave, cancelPendingSave]);

  return { saveStatus, lastSaved, triggerSave, cancelPendingSave };
}

export function SaveStatusIndicator({ status, lastSaved }: { status: SaveStatus; lastSaved: Date | null }): React.ReactElement | null {
  const getDisplay = () => {
    switch (status) {
      case 'pending': return { text: '● Unsaved changes…', color: '#eab308' };
      case 'saving': return { text: '⟳ Saving…', color: '#3b82f6' };
      case 'saved': {
        const ago = lastSaved ? formatTimeAgo(lastSaved) : '';
        return { text: `✓ Saved${ago ? ` (${ago})` : ''}`, color: '#22c55e' };
      }
      case 'error': return { text: '✕ Save failed', color: '#ef4444' };
      default: return { text: '', color: 'transparent' };
    }
  };

  const { text, color } = getDisplay();
  if (!text) return null;

  return (
    <span style={{ fontSize: '0.75rem', fontWeight: 500, color, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
      {text}
    </span>
  );
}

function formatTimeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 10) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}
