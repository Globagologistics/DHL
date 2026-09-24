import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Anchor, Bike, Check, ChevronLeft, ChevronRight, FileText, MapPinned, Package, Plane, Truck, UserRound } from 'lucide-react';
import { PackagePhotoUploader } from '../media/PackagePhotoUploader';
import { RoutePicker } from '../map/RoutePicker';
import { RouteMap } from '../map/RouteMap';
import { RouteLocationField } from '../map/LocationFields';
import { formatDistance, pathLengthKm } from '../map/geo';
import { carrierRoles, currencies, defaultCarrierRole, emptyShipmentDraft, paymentLabels, transportMethods } from '../shipments/types';
import type { PaymentChoice, ShipmentDraft, TransportMethod } from '../shipments/types';
import type { PackagePhoto } from '../../services/shipmentWorkflowService';

export type { ShipmentDraft };

/**
 * Guided shipment form, written for someone with no logistics background.
 *
 *   admin:  Sender · Receiver · Consignment · Carrier & Delivery · Review
 *   public: Sender · Receiver · Package · Review
 *
 * Moving between steps never clears anything; text fields are also kept for
 * the browser session (photos stay in memory until submit).
 */

type Mode = 'admin' | 'public';
type Props = {
  mode: Mode;
  initial?: ShipmentDraft;
  initialPhotos?: PackagePhoto[];
  submitLabel: string;
  onSubmit: (draft: ShipmentDraft, photos: PackagePhoto[]) => Promise<void>;
  submitting: boolean;
  submitError: string;
  /** sessionStorage key for draft persistence; omit to disable. */
  draftKey?: string;
  /** Extra content under the review cards (for example the reject panel). */
  reviewFooter?: ReactNode;
  /** Start on a later step (for example Review when editing). */
  startStep?: number;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[+\d][\d\s().-]{5,}$/;
const transportIcons: Record<TransportMethod, typeof Plane> = { 'Air Freight': Plane, 'Sea Freight': Anchor, Truck, 'Courier / Dispatcher': UserRound, Motorcycle: Bike };

function readDraft(key?: string): ShipmentDraft | null {
  if (!key) return null;
  try { const stored = sessionStorage.getItem(key); return stored ? { ...emptyShipmentDraft, ...JSON.parse(stored), images: [] } : null; } catch { return null; }
}

export default function ShipmentWizard({ mode, initial, initialPhotos = [], submitLabel, onSubmit, submitting, submitError, draftKey, reviewFooter, startStep = 0 }: Props) {
  const isAdmin = mode === 'admin';
  const steps = isAdmin
    ? [{ title: 'Sender', intro: 'Who is sending this shipment?' }, { title: 'Receiver', intro: 'Who will receive it, and where?' }, { title: 'Consignment', intro: 'What is being shipped?' }, { title: 'Carrier & Delivery', intro: 'How it travels and when it should arrive.' }, { title: 'Review', intro: 'Check everything before creating the shipment.' }]
    : [{ title: 'Sender', intro: 'Who is sending this shipment?' }, { title: 'Receiver', intro: 'Who will receive it, and where?' }, { title: 'Package', intro: 'Tell us what you are sending.' }, { title: 'Review', intro: 'Check your details before submitting.' }];
  const last = steps.length - 1;
  const [step, setStep] = useState(startStep);
  const [draft, setDraft] = useState<ShipmentDraft>(() => initial || readDraft(draftKey) || emptyShipmentDraft);
  const [photos, setPhotos] = useState<PackagePhoto[]>(initialPhotos);
  const [error, setError] = useState('');
  const [routeOpen, setRouteOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  // Release photo preview URLs only when the whole wizard goes away.
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach(photo => { if (photo.url.startsWith('blob:')) URL.revokeObjectURL(photo.url); }), []);

  useEffect(() => {
    if (!draftKey) return;
    try { const { images: _images, ...text } = draft; sessionStorage.setItem(draftKey, JSON.stringify(text)); } catch { /* storage unavailable */ }
  }, [draft, draftKey]);

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
      if (isAdmin && draft.paymentStatus === 'pending' && draft.outstandingAmount.trim() && !(Number(draft.outstandingAmount) > 0)) return 'Outstanding amount must be more than 0.';
      if (photos.length < 1) return 'Upload at least one package image.';
      if (photos.length > 3) return 'Use no more than 3 package images.';
    }
    if (index === 3 && isAdmin) {
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
    await onSubmit(draft, photos);
    if (draftKey) { try { sessionStorage.removeItem(draftKey); } catch { /* ignore */ } }
  };

  const text = (label: string, key: keyof ShipmentDraft, options: { required?: boolean; optional?: boolean; type?: string; placeholder?: string; inputMode?: 'tel' | 'email' | 'decimal'; autoComplete?: string; multiline?: boolean; wide?: boolean } = {}) =>
    <label className={`dhl-admin-form-field${options.wide || options.multiline ? ' wide' : ''}`}>
      <span>{label}{options.required && <i> *</i>}{options.optional && <em> (Optional)</em>}</span>
      {options.multiline
        ? <textarea rows={2} value={String(draft[key] ?? '')} onChange={event => set(key, event.target.value as never)} placeholder={options.placeholder} autoComplete={options.autoComplete || 'off'} />
        : <input type={options.type || 'text'} value={String(draft[key] ?? '')} onChange={event => set(key, event.target.value as never)} placeholder={options.placeholder} inputMode={options.inputMode} autoComplete={options.autoComplete || 'off'} />}
    </label>;

  const reviewCard = (title: string, index: number, body: ReactNode) => <section><div><h3>{title}</h3><button type="button" onClick={() => goTo(index)}>Edit</button></div><div className="dhl-admin-review-body">{body}</div></section>;
  const money = (value: string) => value.trim() ? `${draft.currency} ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Not provided';
  const eta = draft.estimatedDelivery ? new Date(draft.estimatedDelivery).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Not set';
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
        {isAdmin && <RouteLocationField label="Pickup location on the map" address={draft.pickupLocation} value={draft.route.origin} onChange={origin => setDraft(current => ({ ...current, route: { ...current.route, origin } }))} />}
      </div>}

      {step === 1 && <div className="dhl-admin-form-grid single">
        {text('Receiver Name', 'receiverName', { required: true, placeholder: 'Full name' })}
        {text('Receiver Phone', 'receiverPhone', { required: true, type: 'tel', inputMode: 'tel', placeholder: '+1 555 000 0000' })}
        {text('Receiver Email', 'receiverEmail', { required: true, type: 'email', inputMode: 'email', placeholder: 'name@example.com' })}
        {text('Drop-off Address', 'deliveryAddress', { required: true, multiline: true, placeholder: '1200 Wilshire Blvd, Los Angeles, CA, United States' })}
        {isAdmin && <RouteLocationField label="Drop-off location on the map" address={draft.deliveryAddress} value={draft.route.destination} onChange={destination => setDraft(current => ({ ...current, route: { ...current.route, destination } }))} />}
      </div>}

      {step === packageStep && <>
        <div className="dhl-admin-form-grid single">
          {text('What is being shipped?', 'packageName', { required: true, placeholder: 'e.g. Personal documents, electronics, artwork' })}
          <div className="dhl-admin-form-field wide"><span>Package Value <em>(Optional)</em></span><div className="dhl-admin-money"><select value={draft.currency} onChange={event => set('currency', event.target.value)} aria-label="Currency">{currencies.map(code => <option key={code}>{code}</option>)}</select><input type="number" inputMode="decimal" min="0" value={draft.packageValue} onChange={event => set('packageValue', event.target.value)} placeholder="0.00" aria-label="Package value" /></div></div>
        </div>
        {isAdmin && <>
          <h3 className="dhl-admin-step-subhead">Payment Status</h3>
          <div className="dhl-admin-choice-grid payment" role="radiogroup" aria-label="Payment status">{(Object.keys(paymentLabels) as PaymentChoice[]).map(value => <button key={value} type="button" role="radio" aria-checked={draft.paymentStatus === value} className={draft.paymentStatus === value ? 'selected' : ''} onClick={() => set('paymentStatus', value)}><strong>{paymentLabels[value]}</strong></button>)}</div>
          {draft.paymentStatus === 'pending' && <div className="dhl-admin-form-grid single">{text('Outstanding Amount', 'outstandingAmount', { optional: true, type: 'number', inputMode: 'decimal', placeholder: '0.00' })}</div>}
        </>}
        <h3 className="dhl-admin-step-subhead">Package Photos <small>At least 1, up to 3.</small></h3>
        <PackagePhotoUploader photos={photos} onChange={next => { setPhotos(next); setError(''); }} onError={setError} />
      </>}

      {isAdmin && step === carrierStep && <>
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
        {reviewCard(isAdmin ? 'Consignment' : 'Package', packageStep, <><strong>{draft.packageName}</strong><span>Value: {money(draft.packageValue)}</span>{isAdmin && <span>Payment: {paymentLabels[draft.paymentStatus]}{draft.paymentStatus === 'pending' && draft.outstandingAmount ? ` · ${money(draft.outstandingAmount)} outstanding` : ''}</span>}{photos.length > 0 && <div className="dhl-admin-review-photos">{photos.map((photo, index) => <img key={photo.id} src={photo.url} alt={`Package photo ${index + 1}`} />)}</div>}</>)}
        {isAdmin && reviewCard('Carrier & Delivery', carrierStep, <><strong>{draft.transportation}</strong><span>{draft.carrierRole}{draft.carrierName ? ` · ${draft.carrierName}` : ''}</span><span>Estimated delivery: {eta}</span></>)}
        {isAdmin && <section className="dhl-admin-review-route">
          <div><h3><MapPinned size={16} /> Route</h3><button type="button" onClick={() => goTo(0)}>Edit</button></div>
          {draft.route.origin && draft.route.destination
            ? <><RouteMap stops={[draft.route.origin, draft.route.destination]} transport={draft.transportation} height={220} ariaLabel="Route preview" /><div className="dhl-admin-review-body"><span>{draft.route.origin.detail || draft.route.origin.label} → {draft.route.destination.detail || draft.route.destination.label} · approx. {formatDistance(pathLengthKm([draft.route.origin, draft.route.destination])).km}</span></div></>
            : <div className="dhl-admin-review-body"><span>{draft.route.origin || draft.route.destination ? 'Only one route location is set.' : 'No route locations yet.'} Confirm the pickup and drop-off locations in steps 1 and 2 to show the map.</span></div>}
          <button type="button" className="dhl-admin-text-action" onClick={() => setRouteOpen(open => !open)}>{routeOpen ? 'Hide manual placement' : 'Advanced: place pins manually'}</button>
          {routeOpen && <RoutePicker route={draft.route} onChange={route => set('route', route)} />}
        </section>}
        <div className="dhl-admin-review-note"><FileText size={18} /><span>{isAdmin ? 'Creating the shipment does not start it. You will publish it (tracking number) and start it from the control panel.' : 'Submitting sends your details for review. The shipment is not active until our team approves it.'}</span></div>
        {reviewFooter}
      </div>}

      <div className="dhl-admin-wizard-footer">
        <button type="button" className="dhl-admin-button" onClick={() => goTo(Math.max(0, step - 1))} disabled={step === 0}><ChevronLeft size={16} /> Back</button>
        {step < last
          ? <button type="submit" className="dhl-admin-button primary">Next <ChevronRight size={16} /></button>
          : <button type="submit" className="dhl-admin-button primary" disabled={submitting}>{submitting ? 'Working…' : submitLabel} {!submitting && <Package size={16} />}</button>}
      </div>
    </div></form>
  </div>;
}
