import { Link } from 'react-router-dom';
import { CheckCircle2, ExternalLink, FileText, Gauge, Printer, X } from 'lucide-react';
import { CopyButton } from '../clipboard/CopyButton';
import { formatCurrency } from '../../data/currencies';
import { formatTrackingNumber } from '../../services/trackingService';
import { deriveLifecycleState, lifecycleLabels } from './lifecycle';
import { paymentLabels } from './types';
import { useI18n } from '../../i18n';
import type { PaymentChoice } from './types';
import type { Shipment } from '../../types/database';

/**
 * Post-publication credential and receipt.
 *
 * Both read the canonical shipment record that came back from the database
 * after publishing, never form state and never translated text. Interface
 * labels follow the interface language; names, addresses, phone numbers,
 * emails, amounts, currency codes and the tracking number are shown exactly
 * as they were stored, so a receipt means the same thing in every language.
 */

const NOT_PROVIDED = '—';
const text = (value?: string | null) => (value && String(value).trim()) || NOT_PROVIDED;

const money = (shipment: Shipment, value?: number | null, locale?: string) => {
  if (value == null) return NOT_PROVIDED;
  const currency = shipment.currency || 'USD';
  // The amount and its ISO code are canonical; only grouping follows the locale.
  try { return formatCurrency(Number(value), currency, locale); } catch { return `${currency} ${Number(value).toFixed(2)}`; }
};

const when = (value?: string | null, locale?: string) =>
  value && Number.isFinite(new Date(value).getTime())
    ? new Date(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
    : NOT_PROVIDED;

export function shipmentPaymentLabel(shipment: Shipment) {
  const key = (shipment.payment_status || (shipment.paid ? 'paid' : 'unpaid')) as PaymentChoice;
  return paymentLabels[key] || key;
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div className="dhl-credential-fact"><dt>{label}</dt><dd className={mono ? 'mono' : undefined}>{value}</dd></div>;
}

/** Shown only after the backend confirms publication and returns the number. */
export function ShipmentCredentialCard({ shipment, onViewReceipt, onDismiss }: { shipment: Shipment; onViewReceipt: () => void; onDismiss?: () => void }) {
  const { t, locale } = useI18n();
  const tracking = shipment.tracking_number || '';
  const state = deriveLifecycleState(shipment);
  return <section className="dhl-admin-card dhl-credential" aria-labelledby="credential-title">
    {onDismiss && <button type="button" className="dhl-credential-dismiss" onClick={onDismiss} aria-label="Dismiss"><X size={16} /></button>}
    <div className="dhl-credential-head">
      <span className="dhl-credential-tick"><CheckCircle2 size={24} /></span>
      <div><h2 id="credential-title">{t('shipmentPublished')}</h2><p>This shipment is now trackable by the customer.</p></div>
    </div>

    <div className="dhl-credential-number">
      <small>{t('trackingId')}</small>
      <strong>{formatTrackingNumber(tracking)}</strong>
      <CopyButton value={tracking} className="dhl-admin-button" label={t('copyTrackingId')} copiedLabel="Tracking ID copied" />
    </div>

    <dl className="dhl-credential-facts">
      <Fact label="Shipment" value={text(shipment.package_name)} />
      <Fact label="Current Status" value={lifecycleLabels[state]} />
      <Fact label="Sender" value={text(shipment.sender_name)} />
      <Fact label="Receiver" value={text(shipment.receiver_name)} />
      <Fact label="Origin / Pickup" value={text(shipment.pickup_location)} />
      <Fact label="Destination" value={text(shipment.delivery_address)} />
      <Fact label="Transport Method" value={text(shipment.transportation)} />
      <Fact label="Estimated Delivery" value={when(shipment.estimated_delivery_at, locale)} />
      <Fact label="Package Value" value={money(shipment, shipment.package_value, locale)} />
      <Fact label="Payment Status" value={shipmentPaymentLabel(shipment)} />
      <Fact label={t('publishedAt')} value={when(shipment.published_at || shipment.updated_at, locale)} />
    </dl>

    <div className="dhl-credential-actions">
      <Link className="dhl-admin-button primary" to={`/admin/shipments/${shipment.id}`}><Gauge size={15} /> {t('openControlPanel')}</Link>
      <button type="button" className="dhl-admin-button" onClick={onViewReceipt}><FileText size={15} /> {t('viewReceipt')}</button>
      <a className="dhl-admin-button" href={`/track/${tracking}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> {t('trackAsCustomer')}</a>
    </div>
  </section>;
}

/**
 * Printable receipt of the shipment as it was recorded. Reconstructed from the
 * database, so it survives a reload and never depends on React state.
 */
export function ShipmentReceipt({ shipment, onClose }: { shipment: Shipment; onClose: () => void }) {
  const { t, locale } = useI18n();
  const tracking = shipment.tracking_number || '';
  const state = deriveLifecycleState(shipment);
  const images = (shipment.images || []).filter(Boolean);
  return <div className="dhl-admin-modal-layer dhl-receipt-layer" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="dhl-receipt" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
      <header className="dhl-receipt-head">
        <div><span className="dhl-admin-eyebrow">DHL Express</span><h2 id="receipt-title">{t('shipmentReceipt')}</h2></div>
        <button type="button" onClick={onClose} aria-label="Close receipt"><X size={18} /></button>
      </header>

      <div className="dhl-receipt-body">
        <div className="dhl-receipt-number">
          <small>{t('trackingId')}</small>
          <strong>{tracking ? formatTrackingNumber(tracking) : 'Not issued yet'}</strong>
          <span>Shipment reference {shipment.id}</span>
        </div>

        <h3>Shipment</h3>
        <dl className="dhl-credential-facts">
          <Fact label="Consignment" value={text(shipment.package_name)} />
          <Fact label="Current Status" value={lifecycleLabels[state]} />
          <Fact label="Package Value" value={money(shipment, shipment.package_value, locale)} />
          <Fact label="Currency" value={text(shipment.currency)} mono />
          <Fact label="Payment Status" value={shipmentPaymentLabel(shipment)} />
          {shipment.outstanding_amount != null && <Fact label="Outstanding Amount" value={money(shipment, shipment.outstanding_amount, locale)} />}
        </dl>

        <h3>Sender</h3>
        <dl className="dhl-credential-facts">
          <Fact label="Sender Name" value={text(shipment.sender_name)} />
          <Fact label="Sender Phone" value={text(shipment.sender_phone)} mono />
          <Fact label="Pickup Address" value={text(shipment.pickup_location)} />
          <Fact label="Origin" value={text(shipment.origin_location_label || shipment.pickup_location)} />
        </dl>

        <h3>Receiver</h3>
        <dl className="dhl-credential-facts">
          <Fact label="Receiver Name" value={text(shipment.receiver_name)} />
          <Fact label="Receiver Phone" value={text(shipment.receiver_phone)} mono />
          <Fact label="Receiver Email" value={text(shipment.receiver_email)} mono />
          <Fact label="Drop-off Address" value={text(shipment.delivery_address)} />
          <Fact label="Destination" value={text(shipment.destination_location_label || shipment.delivery_address)} />
        </dl>

        <h3>Carriage</h3>
        <dl className="dhl-credential-facts">
          <Fact label="Transport Method" value={text(shipment.transportation)} />
          <Fact label="Carrier Role" value={text(shipment.carrier_role)} />
          <Fact label="Carrier Name" value={text(shipment.driver_name)} />
          <Fact label="Estimated Delivery" value={when(shipment.estimated_delivery_at, locale)} />
          <Fact label={t('publishedAt')} value={when(shipment.published_at, locale)} />
          <Fact label="Created" value={when(shipment.created_at, locale)} />
        </dl>

        {images.length > 0 && <>
          <h3>Package Images</h3>
          <div className="dhl-receipt-images">{images.map((url, index) => <img key={url} src={url} alt={`Package image ${index + 1}`} />)}</div>
        </>}
      </div>

      <footer className="dhl-receipt-actions">
        <CopyButton value={tracking} className="dhl-admin-button" label={t('copyTrackingId')} copiedLabel="Tracking ID copied" />
        <button type="button" className="dhl-admin-button primary" onClick={() => window.print()}><Printer size={15} /> {t('printReceipt')}</button>
      </footer>
    </section>
  </div>;
}
