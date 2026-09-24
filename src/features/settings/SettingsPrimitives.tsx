import { useEffect, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { CheckCircle2, CircleAlert, CircleDashed, Database, HardDrive, Monitor } from 'lucide-react';
import type { IntegrationState, SettingsSource } from './types';

type Loadable<T> = { value: T; source: SettingsSource; updatedAt: string | null; writable: boolean };

/** Load / edit / save lifecycle shared by every settings section. */
export function useSettingsForm<T>(load: () => Promise<Loadable<T>>, save: (value: T) => Promise<Loadable<T>>) {
  const [record, setRecord] = useState<Loadable<T> | null>(null);
  const [draft, setDraft] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  useEffect(() => {
    let active = true;
    void load().then(result => { if (active) { setRecord(result); setDraft(result.value); } });
    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const update = (patch: Partial<T>) => { setDraft(current => (current ? { ...current, ...patch } : current)); setFeedback(null); };
  const dirty = Boolean(record && draft && JSON.stringify(record.value) !== JSON.stringify(draft));
  const submit = async (successText = 'Changes saved.') => {
    if (!draft) return false;
    setSaving(true); setFeedback(null);
    try {
      const result = await save(draft);
      setRecord(result); setDraft(result.value);
      setFeedback({ tone: 'ok', text: successText });
      return true;
    } catch (error) {
      setFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'Changes could not be saved.' });
      return false;
    } finally { setSaving(false); }
  };
  const reset = () => { if (record) setDraft(record.value); setFeedback(null); };
  return { record, draft, update, dirty, saving, feedback, setFeedback, submit, reset };
}

export type Feedback = { tone: 'ok' | 'error' | 'info'; text: string };

export function SettingsCard({ id, icon: Icon, title, description, badge, tone, children }: { id: string; icon: ComponentType<{ size?: number }>; title: string; description: string; badge?: ReactNode; tone?: 'danger'; children: ReactNode }) {
  return <section id={id} className={`dhl-admin-card dhl-settings-card${tone === 'danger' ? ' danger' : ''}`} aria-labelledby={`${id}-title`}>
    <header className="dhl-settings-card-head">
      <span className="dhl-settings-card-icon" aria-hidden="true"><Icon size={19} /></span>
      <div><h2 id={`${id}-title`}>{title}</h2><p>{description}</p></div>
      {badge && <div className="dhl-settings-card-badge">{badge}</div>}
    </header>
    <div className="dhl-settings-card-body">{children}</div>
  </section>;
}

export function SettingsSwitch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (value: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return <div className={`dhl-settings-switch-row${disabled ? ' disabled' : ''}`}>
    <div><strong>{label}</strong>{description && <small>{description}</small>}</div>
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`dhl-settings-switch${checked ? ' on' : ''}`} onClick={() => onChange(!checked)} disabled={disabled}><span /></button>
  </div>;
}

export function FeedbackLine({ feedback }: { feedback: Feedback | null }) {
  if (!feedback) return null;
  return <p className={`dhl-settings-feedback ${feedback.tone}`} role={feedback.tone === 'error' ? 'alert' : 'status'}>{feedback.tone === 'ok' ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}{feedback.text}</p>;
}

export function SaveBar({ dirty, saving, disabled, disabledReason, onSave, onReset, feedback, label = 'Save changes' }: { dirty: boolean; saving: boolean; disabled?: boolean; disabledReason?: string; onSave: () => void; onReset: () => void; feedback: Feedback | null; label?: string }) {
  return <div className="dhl-settings-savebar">
    <FeedbackLine feedback={feedback} />
    {disabled && disabledReason && !feedback && <p className="dhl-settings-feedback info"><CircleAlert size={15} />{disabledReason}</p>}
    <div className="dhl-settings-savebar-actions">
      <button type="button" className="dhl-admin-button" onClick={onReset} disabled={!dirty || saving}>Discard</button>
      <button type="button" className="dhl-admin-button primary" onClick={onSave} disabled={!dirty || saving || disabled}>{saving ? 'Saving…' : label}</button>
    </div>
  </div>;
}

export function SourceBadge({ record }: { record: { source: SettingsSource; writable: boolean; updatedAt: string | null } | null }) {
  if (!record) return <span className="dhl-settings-pill neutral"><CircleDashed size={13} />Loading</span>;
  if (record.source === 'development') return <span className="dhl-settings-pill warning" title="Saved in this browser only"><Monitor size={13} />Development store</span>;
  if (record.source === 'database') return <span className="dhl-settings-pill ok" title={record.updatedAt ? `Last updated ${new Date(record.updatedAt).toLocaleString()}` : undefined}><Database size={13} />Saved</span>;
  return record.writable
    ? <span className="dhl-settings-pill neutral"><HardDrive size={13} />Defaults</span>
    : <span className="dhl-settings-pill warning"><HardDrive size={13} />Storage not installed</span>;
}

const stateLabels: Record<IntegrationState, string> = { connected: 'Connected', configured: 'Configured', not_configured: 'Not Configured', error: 'Error' };

export function StatePill({ state }: { state: IntegrationState }) {
  const tone = state === 'connected' || state === 'configured' ? 'ok' : state === 'error' ? 'error' : 'neutral';
  const Icon = tone === 'ok' ? CheckCircle2 : tone === 'error' ? CircleAlert : CircleDashed;
  return <span className={`dhl-settings-pill ${tone}`}><Icon size={13} />{stateLabels[state]}</span>;
}

export const formatDateTime = (value: string | null) => value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Never';
