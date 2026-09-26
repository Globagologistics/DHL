import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Anchor, Bike, Check, ChevronLeft, ChevronRight, CloudUpload, FileText, MapPinned, Package, Plane, Trash2, Truck, UserRound } from 'lucide-react';
import { PackagePhotoUploader } from '../media/PackagePhotoUploader';
import { RoutePicker } from '../map/RoutePicker';
import { RouteMap } from '../map/RouteMap';
import { RouteLocationField } from '../map/LocationFields';
import { formatDistance, pathLengthKm } from '../map/geo';
import { carrierRoles, defaultCarrierRole, emptyShipmentDraft, paymentLabels, transportMethods } from '../shipments/types';
import { currencies, formatCurrency, isSupportedCurrency } from '../../data/currencies';
import { useI18n } from '../../i18n';
import type { PaymentChoice, ShipmentDraft, TransportMethod } from '../shipments/types';
import { removePackagePhoto } from '../../services/shipmentWorkflowService';
import type { PackagePhoto } from '../../services/shipmentWorkflowService';
import { clearDraft, loadDraft, saveDraft } from './draftStore';
import { supabase } from '../../lib/supabase';

export type { ShipmentDraft };

/**
 * Guided shipment form, written for someone with no logistics background.
 *
 *   admin:  Sender · Receiver · Consignment · Carrier & Delivery · Review
 *   public: Sender · Receiver · Package · Review
 *
 * Progress is autosaved to IndexedDB (src/features/shipment-form/draftStore.ts)
 * under the signed-in admin's id: every field, the current step, the route
 * pins and the Storage references of images already uploaded. A refresh, a
 * closed tab or a flat battery therefore costs nothing. The draft is cleared
 * only once the caller confirms the shipment was really created.
 */

type Mode = 'admin' | 'public';
type Props = {
  mode: Mode;
  initial?: ShipmentDraft;
  initialPhotos?: PackagePhoto[];
  submitLabel: string;
  /**
   * `meta.draftId` is the id the images were stored under; pass it as the new
   * shipment's id. Call `meta.completed()` once the backend has confirmed the
   * record, and only then, so a failure keeps the draft recoverable.
   */
  onSubmit: (draft: ShipmentDraft, photos: PackagePhoto[], meta: { draftId: string; completed: () => Promise<void> }) => Promise<void>;
  submitting: boolean;
  submitError: string;
  /** Draft namespace for autosave; omit to disable persistence. */
  draftKey?: string;
  /** Existing record id, so images edited later stay in that record's folder. */
  draftId?: string;
  /** Extra content under the review cards (for example the reject panel). */
  reviewFooter?: ReactNode;
  /** Start on a later step (for example Review when editing). */
  startStep?: number;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[+\d][\d\s().-]{5,}$/;
const AUTOSAVE_DEBOUNCE_MS = 500;
const SAVED_BADGE_MS = 2200;
const transportIcons: Record<TransportMethod, typeof Plane> = { 'Air Freight': Plane, 'Sea Freight': Anchor, Truck, 'Courier / Dispatcher': UserRound, Motorcycle: Bike };

type SaveState = 'idle' | 'saving' | 'saved' | 'restored';

export default function ShipmentWizard({ mode, initial, initialPhotos = [], submitLabel, onSubmit, submitting, submitError, draftKey, draftId: fixedDraftId, reviewFooter, startStep = 0 }: Props) {
  const { locale, t } = useI18n();
  const isAdmin = mode === 'admin';
  const steps = [{ title: 'Sender', intro: 'Who is sending this shipment?' }, { title: 'Receiver', intro: 'Who will receive it, and where?' }, { title: 'Consignment', intro: 'What is being shipped?' }, { title: 'Carrier & Delivery', intro: 'How it travels and when it should arrive.' }, { title: 'Review', intro: isAdmin ? 'Check everything before creating the shipment.' : 'Check everything before submitting your request.' }];
  const last = steps.length - 1;
  const [step, setStep] = useState(startStep);
  const [draft, setDraft] = useState<ShipmentDraft>(() => initial || emptyShipmentDraft);
  const [photos, setPhotos] = useState<PackagePhoto[]>(initialPhotos);
  const [error, setError] = useState('');
  const [routeOpen, setRouteOpen] = useState(false);
  // The draft id is also the Supabase Storage folder and, for an admin, the
  // id of the shipment that is created, so uploaded images need no move.
  const [draftId, setDraftId] = useState<string>(() => fixedDraftId || crypto.randomUUID());
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [ready, setReady] = useState(!draftKey);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [discarding, setDiscarding] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach(photo => { if (photo.url.startsWith('blob:')) URL.revokeObjectURL(photo.url); }), []);

  /**
   * Restore, but only once the session is known: a draft belongs to one
   * account and must never be handed to another.
   */
  useEffect(() => {
    if (!draftKey) return;
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const owner = data?.user?.id || 'anonymous';
      if (!active) return;
      setOwnerId(owner);
      const record = initial ? null : await loadDraft(draftKey, owner);
      if (!active) return;
      if (record) {
        setDraft({ ...emptyShipmentDraft, ...record.draft });
        setPhotos(record.photos.map(photo => ({ ...photo, status: 'uploaded' as const })));
        setDraftId(record.draftId);
        setStep(Math.min(Math.max(record.step, 0), 4));
        setSaveState('restored');
        window.setTimeout(() => setSaveState(current => (current === 'restored' ? 'idle' : current)), 4000);
      }
      setReady(true);
    })();
    return () => { active = false; };
  }, [draftKey, initial]);

  /** Debounced autosave: quiet, frequent, and never interrupts typing. */
  useEffect(() => {
    if (!draftKey || !ready || !ownerId) return;
    setSaveState('saving');
    const timer = window.setTimeout(() => {
      void saveDraft({ draftId, ownerId, formKey: draftKey, step, draft, photos }).then(() => {
        setSaveState('saved');
        window.setTimeout(() => setSaveState(current => (current === 'saved' ? 'idle' : current)), SAVED_BADGE_MS);
      });
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [draft, photos, step, draftId, ownerId, draftKey, ready]);

  const discard = useCallback(async () => {
    const significant = Boolean(draft.senderName || draft.receiverName || draft.packageName || photosRef.current.length);
    if (significant && !window.confirm(t('discardDraftConfirm'))) return;
    setDiscarding(true);
    await Promise.all(photosRef.current.map(removePackagePhoto));
    if (draftKey && ownerId) await clearDraft(draftKey, ownerId);
    photosRef.current.forEach(photo => { if (photo.url.startsWith('blob:')) URL.revokeObjectURL(photo.url); });
    setDraft(emptyShipmentDraft);
    setPhotos([]);
    setDraftId(crypto.randomUUID());
    setStep(0);
    setError('');
    setRouteOpen(false);
    setSaveState('idle');
    setDiscarding(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [draft.senderName, draft.receiverName, draft.packageName, draftKey, ownerId, t]);

  const set = <K extends keyof ShipmentDraft>(key: K, value: ShipmentDraft[K]) => { setDraft(current => ({ ...current, [key]: value })); setError(''); };
  const setTransport = (transportation: TransportMethod) => setDraft(current => ({ ...current, transportation, carrierRole: !current.carrierRole || Object.values(defaultCarrierRole).includes(current.carrierRole) ? defaultCarrierRole[transportation] : current.carrierRole }));

  const problem = (index: number): string => {
    if (index === 0) {
      if (!draft.senderName.trim()) return 'Enter sender name.';
      if (draft.senderPhone.trim() && !PHONE.test(draft.senderPhone.trim())) return 'Enter a valid sender phone number, or leave it empty.';
      if (!draft.pickupLocation.trim()) return 'Enter pickup address.';
    }
    if (index === 1) {
      if (!draft.receiverName.trim()) return 'Enter receiver name.';
      if (!PHONE.test(draft.receiverPhone.trim())) return 'Enter receiver phone number.';
      if (!EMAIL.test(draft.receiverEmail.trim())) return 'Enter receiver email.';
      if (!draft.deliveryAddress.trim()) return 'Enter drop-off address.';
    }
    if (index === 2) {
      if (!draft.packageName.trim()) return 'Enter what is being shipped.';
      if (draft.packageValue.trim() && !(Number(draft.packageValue) >= 0)) return 'Package value must be a number.';
      if (!isSupportedCurrency(draft.currency)) return 'Choose a valid ISO currency.';
      if (draft.paymentStatus === 'pending' && !(Number(draft.outstandingAmount) > 0)) return 'Outstanding amount must be more than 0.';
      if (photos.length < 1) return 'Upload at least one package image.';
      if (photos.length > 3) return 'Use no more than 3 package images.';
      if (photos.some(photo => photo.status === 'uploading')) return t('waitForUploads');
      if (photos.some(photo => photo.status === 'failed')) return t('fixFailedUploads');
    }
    if (index === 3) {
      const eta = draft.estimatedDelivery ? new Date(draft.estimatedDelivery).getTime() : NaN;
      if (!Number.isFinite(eta)) return 'Set the estimated delivery date and time.';
      if (eta <= Date.now()) return 'The estimated delivery must be in the future.';
      if (!draft.carrierRole.trim()) return 'Choose the carrier role.';
    }
    return '';
  };

  const goTo = (index: number) => { setStep(index); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); window.setTimeout(() => heading.current?.focus(), 250); };
  const next = () => { const issue = problem(step); if (issue) { setError(issue); return; } goTo(Math.min(step + 1, last)); };
  const finish = async (event: FormEvent) => {
    event.preventDefault();
    if (step < last) { next(); return; }
    for (let index = 0; index < last; index++) { const issue = problem(index); if (issue) { setStep(index); setError(issue); return; } }
    // The draft is deliberately NOT cleared here. onSubmit resolves before the
    // backend result is confirmed by the caller, which clears it via
    // completeShipmentDraft() only after the record really exists.
    await onSubmit(draft, photos, {
      draftId,
      completed: async () => { if (draftKey && ownerId) await clearDraft(draftKey, ownerId); },
    });
  };

  const text = (label: string, key: keyof ShipmentDraft, options: { required?: boolean; optional?: boolean; type?: string; placeholder?: string; inputMode?: 'tel' | 'email' | 'decimal'; autoComplete?: string; multiline?: boolean; wide?: boolean } = {}) =>
    <label className={`dhl-admin-form-field${options.wide || options.multiline ? ' wide' : ''}`}>
      <span>{label}{options.required && <i> *</i>}{options.optional && <em> (Optional)</em>}</span>
      {options.multiline
        ? <textarea rows={2} value={String(draft[key] ?? '')} onChange={event => set(key, event.target.value as never)} placeholder={options.placeholder} autoComplete={options.autoComplete || 'off'} />
        : <input type={options.type || 'text'} value={String(draft[key] ?? '')} onChange={event => set(key, event.target.value as never)} placeholder={options.placeholder} inputMode={options.inputMode} autoComplete={options.autoComplete || 'off'} />}
    </label>;

  const reviewCard = (title: string, index: number, body: ReactNode) => <section><div><h3>{title}</h3><button type="button" onClick={() => goTo(index)}>Edit</button></div><div className="dhl-admin-review-body">{body}</div></section>;
  const money = (value: string) => value.trim() ? formatCurrency(Number(value), draft.currency, locale) : 'Not provided';
  const eta = draft.estimatedDelivery ? new Date(draft.estimatedDelivery).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : 'Not set';
  const packageStep = 2;
  const carrierStep = 3;

  return <div className={`dhl-admin-wizard ${mode}`}>
    <ol className="dhl-admin-wizard-stepper" aria-label="Form progress">{steps.map((item, index) => <li key={item.title}><button type="button" onClick={() => { if (index < step) goTo(index); }} className={index === step ? 'active' : index < step ? 'done' : ''} aria-current={index === step ? 'step' : undefined} disabled={index > step}><span>{index < step ? <Check size={14} /> : index + 1}</span><strong>{item.title}</strong></button></li>)}</ol>
    <form onSubmit={finish} noValidate><div className="dhl-admin-wizard-panel">
      <div className="dhl-admin-wizard-heading"><span>STEP {step + 1} OF {steps.length}</span><h2 ref={heading} tabIndex={-1}>{steps[step].title}</h2><p>{steps[step].intro}</p></div>
      {error && <p className="dhl-admin-banner error" role="alert">{error}</p>}
      {submitError && <p className="dhl-admin-banner error" role="alert">{submitError}</p>}

      {step === 0 && <div className="dhl-admin-form-grid single">
        {text('Sender Name', 'senderName', { required: true, placeholder: 'Full name', autoComplete: 'name' })}
        {text('Sender Phone', 'senderPhone', { optional: true, type: 'tel', inputMode: 'tel', placeholder: '+1 555 000 0000', autoComplete: 'tel' })}
        {text('Pickup Address', 'pickupLocation', { required: true, multiline: true, placeholder: '123 Business Avenue, New York, NY, United States', autoComplete: 'street-address' })}
        <RouteLocationField label="Pickup location on the map" address={draft.pickupLocation} value={draft.route.origin} onChange={origin => setDraft(current => ({ ...current, route: { ...current.route, origin } }))} />
      </div>}

      {step === 1 && <div className="dhl-admin-form-grid single">
        {text('Receiver Name', 'receiverName', { required: true, placeholder: 'Full name' })}
        {text('Receiver Phone', 'receiverPhone', { required: true, type: 'tel', inputMode: 'tel', placeholder: '+1 555 000 0000' })}
        {text('Receiver Email', 'receiverEmail', { required: true, type: 'email', inputMode: 'email', placeholder: 'name@example.com' })}
        {text('Drop-off Address', 'deliveryAddress', { required: true, multiline: true, placeholder: '1200 Wilshire Blvd, Los Angeles, CA, United States' })}
        <RouteLocationField label="Drop-off location on the map" address={draft.deliveryAddress} value={draft.route.destination} onChange={destination => setDraft(current => ({ ...current, route: { ...current.route, destination } }))} />
      </div>}

      {step === packageStep && <>
        <div className="dhl-admin-form-grid single">
          {text('What is being shipped?', 'packageName', { required: true, placeholder: 'e.g. Personal documents, electronics, artwork' })}
          <div className="dhl-admin-form-field wide"><span>Package Value <em>(Optional)</em></span><div className="dhl-admin-money"><select value={draft.currency} onChange={event => set('currency', event.target.value)} aria-label="Currency">{currencies.map(currency => <option key={currency.code} value={currency.code}>{currency.code} — {currency.name}{currency.symbol ? ` — ${currency.symbol}` : ''}</option>)}</select><input type="number" inputMode="decimal" min="0" value={draft.packageValue} onChange={event => set('packageValue', event.target.value)} placeholder="0.00" aria-label="Package value" /></div></div>
        </div>
        <>
          <h3 className="dhl-admin-step-subhead">Payment Status</h3>
          <div className="dhl-admin-choice-grid payment" role="radiogroup" aria-label="Payment status">{(Object.keys(paymentLabels) as PaymentChoice[]).map(value => <button key={value} type="button" role="radio" aria-checked={draft.paymentStatus === value} className={draft.paymentStatus === value ? 'selected' : ''} onClick={() => set('paymentStatus', value)}><strong>{paymentLabels[value]}</strong></button>)}</div>
          {draft.paymentStatus === 'pending' && <div className="dhl-admin-form-grid single">{text('Outstanding Amount', 'outstandingAmount', { optional: true, type: 'number', inputMode: 'decimal', placeholder: '0.00' })}</div>}
        </>
        <h3 className="dhl-admin-step-subhead">Package Photos <small>At least 1, up to 3.</small></h3>
        <PackagePhotoUploader photos={photos} onChange={next => { setPhotos(next); setError(''); }} onError={setError} scope={isAdmin ? 'shipments' : 'requests'} draftId={draftId} />
      </>}

      {step === carrierStep && <>
        <div className="dhl-admin-form-grid single">
          <label className="dhl-admin-form-field"><span>Estimated Delivery<i> *</i></span><input type="datetime-local" value={draft.estimatedDelivery} onChange={event => set('estimatedDelivery', event.target.value)} /></label>
        </div>
        <p className="dhl-settings-hint">The start time is recorded automatically when you press Start Shipment later.</p>
        <h3 className="dhl-admin-step-subhead">Transport Method</h3>
        <div className="dhl-admin-choice-grid transport" role="radiogroup" aria-label="Transport method">{transportMethods.map(method => { const Icon = transportIcons[method]; return <button key={method} type="button" role="radio" aria-checked={draft.transportation === method} className={draft.transportation === method ? 'selected' : ''} onClick={() => setTransport(method)}><Icon size={20} /><strong>{method}</strong></button>; })}</div>
        <div className="dhl-admin-form-grid">
          <label className="dhl-admin-form-field"><span>Carrier Role<i> *</i></span><select value={draft.carrierRole} onChange={event => set('carrierRole', event.target.value)}>{[...new Set([draft.carrierRole, ...carrierRoles].filter(Boolean))].map(role => <option key={role}>{role}</option>)}</select></label>
          {text('Carrier Name', 'carrierName', { optional: true, placeholder: `${draft.carrierRole || 'Carrier'}’s name` })}
        </div>
      </>}

      {step === last && <div className="dhl-admin-review">
        {reviewCard('Sender', 0, <><strong>{draft.senderName}</strong>{draft.senderPhone && <span>{draft.senderPhone}</span>}<span>{draft.pickupLocation}</span></>)}
        {reviewCard('Receiver', 1, <><strong>{draft.receiverName}</strong><span>{draft.receiverPhone} · {draft.receiverEmail}</span><span>{draft.deliveryAddress}</span></>)}
        {reviewCard('Consignment', packageStep, <><strong>{draft.packageName}</strong><span>Value: {money(draft.packageValue)}</span><span>Payment: {paymentLabels[draft.paymentStatus]}{draft.paymentStatus === 'pending' && draft.outstandingAmount ? ` · ${money(draft.outstandingAmount)} outstanding` : ''}</span>{photos.length > 0 && <div className="dhl-admin-review-photos">{photos.map((photo, index) => <img key={photo.id} src={photo.url} alt={`Package photo ${index + 1}`} />)}</div>}</>)}
        {reviewCard('Carrier & Delivery', carrierStep, <><strong>{draft.transportation}</strong><span>{draft.carrierRole}{draft.carrierName ? ` · ${draft.carrierName}` : ''}</span><span>Estimated delivery: {eta}</span></>)}
        <section className="dhl-admin-review-route">
          <div><h3><MapPinned size={16} /> Route</h3><button type="button" onClick={() => goTo(0)}>Edit</button></div>
          {draft.route.origin && draft.route.destination
            ? <><RouteMap stops={[draft.route.origin, draft.route.destination]} transport={draft.transportation} height={220} ariaLabel="Route preview" /><div className="dhl-admin-review-body"><span>{draft.route.origin.detail || draft.route.origin.label} → {draft.route.destination.detail || draft.route.destination.label} · approx. {formatDistance(pathLengthKm([draft.route.origin, draft.route.destination])).km}</span></div></>
            : <div className="dhl-admin-review-body"><span>{draft.route.origin || draft.route.destination ? 'Only one route location is set.' : 'No route locations yet.'} Confirm the pickup and drop-off locations in steps 1 and 2 to show the map.</span></div>}
          <button type="button" className="dhl-admin-text-action" onClick={() => setRouteOpen(open => !open)}>{routeOpen ? 'Hide manual placement' : 'Advanced: place pins manually'}</button>
          {routeOpen && <RoutePicker route={draft.route} onChange={route => set('route', route)} />}
        </section>
        <div className="dhl-admin-review-note"><FileText size={18} /><span>{isAdmin ? 'Creating the shipment does not start it. You will publish it (tracking number) and start it from the control panel.' : 'Submitting sends your details for review. The shipment is not active until our team approves it.'}</span></div>
        {reviewFooter}
      </div>}

      <div className="dhl-admin-wizard-footer">
        <button type="button" className="dhl-admin-button" onClick={() => goTo(Math.max(0, step - 1))} disabled={step === 0}><ChevronLeft size={16} /> Back</button>
        {draftKey && <span className={`dhl-admin-draft-state ${saveState}`} role="status" aria-live="polite">{saveState === 'saving' ? <><CloudUpload size={14} /> {t('savingDraft')}</> : saveState === 'saved' ? <><Check size={14} /> {t('draftSaved')}</> : saveState === 'restored' ? <><Check size={14} /> {t('draftRestored')}</> : ''}</span>}
        {draftKey && <button type="button" className="dhl-admin-button dhl-admin-discard-draft" onClick={() => void discard()} disabled={discarding || submitting}><Trash2 size={15} /> {t('discardDraft')}</button>}
        {step < last
          ? <button type="submit" className="dhl-admin-button primary">Next <ChevronRight size={16} /></button>
          : <button type="submit" className="dhl-admin-button primary" disabled={submitting}>{submitting ? 'Working…' : submitLabel} {!submitting && <Package size={16} />}</button>}
      </div>
    </div></form>
  </div>;
}
