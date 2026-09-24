import { timingSafeEqual } from 'node:crypto';
import type { Handler, HandlerEvent } from '@netlify/functions';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { companyLogoContent } from './assets/company-logo.js';

const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 20;
const COMPANY_LOGO_FILENAME = 'buske-logistics-logo.jpg';
const COMPANY_LOGO_CID = 'company-logo';

type EventType =
  | 'shipment_published'
  | 'shipment_status_changed'
  | 'on_hold'
  | 'released'
  | 'delayed'
  | 'cancelled'
  | 'payment_pending'
  | 'payment_confirmed'
  | 'delivered'
  | 'terminated'
  | 'chat_customer_message'
  | 'chat_admin_reply';

type NotificationEvent = {
  id: string;
  shipment_id: string;
  event_type: EventType;
  event_payload: Record<string, unknown>;
  attempt_count: number;
  claim_token: string;
};

type Shipment = {
  id: string;
  sender_name: string;
  sender_email: string | null;
  receiver_name: string;
  receiver_email: string | null;
  pickup_location: string | null;
  delivery_address: string;
  package_name: string | null;
  transportation: string;
  status: string;
  stopped: boolean;
  paused: boolean;
  terminated: boolean;
  paid: boolean;
  payment_status: 'unpaid' | 'pending' | 'paid';
  payment_responsibility: 'sender' | 'receiver' | 'company';
  currency: string;
  cost: number | null;
  estimated_delivery_at: string | null;
  published_at: string | null;
};

type Recipient = { email: string; role: 'admin' | 'sender' | 'receiver'; name: string };

const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
};

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const humanizeStatus = (shipment: Shipment) => {
  if (shipment.terminated) return 'Terminated';
  if (shipment.status === 'delivered') return 'Delivered';
  if (shipment.status === 'cancelled') return 'Cancelled';
  if (shipment.stopped || shipment.paused) return 'On hold';
  return shipment.status.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
};

const eventCopy = (eventType: EventType) => {
  switch (eventType) {
    case 'shipment_published':
      return { heading: 'Your consignment has been registered', subject: 'Your Consignment Has Been Registered' };
    case 'on_hold':
      return { heading: 'Your consignment is currently on hold', subject: 'Your Consignment Is Currently On Hold' };
    case 'released':
      return { heading: 'Your consignment has been released', subject: 'Your Consignment Has Been Released' };
    case 'delayed':
      return { heading: 'Your consignment has been delayed', subject: 'Shipment Delay Update' };
    case 'cancelled':
      return { heading: 'Your consignment has been cancelled', subject: 'Consignment Cancelled' };
    case 'payment_pending':
      return { heading: 'Payment is required for your consignment', subject: 'Payment Pending' };
    case 'payment_confirmed':
      return { heading: 'Payment confirmed for your consignment', subject: 'Payment Confirmed' };
    case 'delivered':
      return { heading: 'Your consignment has been delivered', subject: 'Shipment Delivered' };
    case 'terminated':
      return { heading: 'Important consignment update', subject: 'Important Shipment Update' };
    case 'chat_customer_message':
      return { heading: 'You have a new consignment message', subject: 'New Consignment Message' };
    case 'chat_admin_reply':
      return { heading: 'You have a new response regarding your consignment', subject: 'New Message About Your Consignment' };
    default:
      return { heading: 'Your consignment has been updated', subject: 'Shipment Update' };
  }
};

function recipientsFor(event: NotificationEvent, shipment: Shipment, adminEmail: string): Recipient[] {
  const recipients: Recipient[] = [];
  const add = (email: string | null, role: Recipient['role'], name: string) => {
    if (email && /^\S+@\S+\.\S+$/.test(email)) recipients.push({ email: email.trim(), role, name });
  };

  if (event.event_type === 'chat_customer_message') {
    add(adminEmail, 'admin', 'Operations team');
  } else if (event.event_type === 'chat_admin_reply') {
    const participantRole = event.event_payload.participant_role;
    if (participantRole === 'sender') add(shipment.sender_email, 'sender', shipment.sender_name);
    if (participantRole === 'receiver') add(shipment.receiver_email, 'receiver', shipment.receiver_name);
  } else if (event.event_type === 'payment_pending' || event.event_type === 'payment_confirmed') {
    if (shipment.payment_responsibility === 'sender') add(shipment.sender_email, 'sender', shipment.sender_name);
    if (shipment.payment_responsibility === 'receiver') add(shipment.receiver_email, 'receiver', shipment.receiver_name);
    add(adminEmail, 'admin', 'Operations team');
  } else {
    add(shipment.sender_email, 'sender', shipment.sender_name);
    add(shipment.receiver_email, 'receiver', shipment.receiver_name);
    add(adminEmail, 'admin', 'Operations team');
  }

  return [...new Map(recipients.map((recipient) => [recipient.email.toLowerCase(), recipient])).values()];
}

function renderEmail({
  event,
  shipment,
  recipient,
  appName,
  appUrl,
  supportUrl,
}: {
  event: NotificationEvent;
  shipment: Shipment;
  recipient: Recipient;
  appName: string;
  appUrl: string;
  supportUrl: string;
}) {
  const copy = eventCopy(event.event_type);
  const trackingUrl = `${appUrl.replace(/\/$/, '')}/track/${encodeURIComponent(shipment.id)}`;
  const isChat = event.event_type === 'chat_customer_message' || event.event_type === 'chat_admin_reply';
  const actionUrl = isChat ? supportUrl : trackingUrl;
  const actionLabel = isChat ? 'Open Consignment Inbox' : 'Track Consignment';
  const reason = typeof event.event_payload.reason === 'string' ? event.event_payload.reason.trim() : '';
  const previousReason = typeof event.event_payload.previous_reason === 'string' ? event.event_payload.previous_reason.trim() : '';
  const estimatedDeliveryAt = typeof event.event_payload.estimated_delivery_at === 'string'
    ? event.event_payload.estimated_delivery_at
    : shipment.estimated_delivery_at;
  const isPaymentEvent = event.event_type === 'payment_pending' || event.event_type === 'payment_confirmed';
  const showPayment = recipient.role === 'admin' || (isPaymentEvent && recipient.role === shipment.payment_responsibility);
  const intro =
    event.event_type === 'shipment_published'
      ? 'Your shipment has been registered and is ready to track.'
      : event.event_type === 'released'
        ? 'Processing or transit has resumed.'
        : event.event_type === 'delivered'
          ? 'We are pleased to confirm delivery.'
          : event.event_type === 'cancelled'
            ? 'Please contact support if you need assistance with next steps.'
          : event.event_type === 'delayed'
            ? 'We are sorry for the delay. Please use tracking for the latest progress.'
          : event.event_type === 'terminated'
            ? 'Please contact support if you need assistance with next steps.'
            : isChat
              ? 'For privacy, this email does not include the message content.'
              : 'You can review the latest shipment information at any time.';
  const adminDetails = recipient.role === 'admin'
    ? `<p style="margin:0 0 8px"><strong>Sender:</strong> ${escapeHtml(shipment.sender_name)}${shipment.sender_email ? ` (${escapeHtml(shipment.sender_email)})` : ''}</p><p style="margin:0"><strong>Receiver:</strong> ${escapeHtml(shipment.receiver_name)}${shipment.receiver_email ? ` (${escapeHtml(shipment.receiver_email)})` : ''}</p>`
    : '';
  const payment = showPayment && shipment.cost !== null
    ? `<p style="margin:16px 0 0;color:#334155"><strong>Payment:</strong> ${escapeHtml(shipment.payment_status.replace(/\b\w/g, (value) => value.toUpperCase()))} · ${escapeHtml(shipment.currency)} ${escapeHtml(shipment.cost)}${recipient.role === 'admin' ? ` · payer: ${escapeHtml(shipment.payment_responsibility)}` : ''}</p>`
    : '';
  const logo = `<img src="cid:${COMPANY_LOGO_CID}" alt="Company Logo" width="180" style="display:block;border:0;width:180px;max-width:100%;height:auto;margin:0 auto 16px" />`;
  const shipmentDetails = [shipment.package_name, shipment.transportation].filter(Boolean).join(' · ');
  const text = `${appName}\n\nHello ${recipient.name || 'there'},\n\n${copy.heading}. ${intro}\n\nTracking ID: ${shipment.id}\nStatus: ${humanizeStatus(shipment)}\nShipment: ${[shipment.package_name, shipment.transportation].filter(Boolean).join(' / ')}\nOrigin: ${shipment.pickup_location || 'Not available'}\nDestination: ${shipment.delivery_address}${reason ? `\nUpdate: ${reason}` : ''}${previousReason ? `\nPrevious hold: ${previousReason}` : ''}${estimatedDeliveryAt ? `\nUpdated ETA: ${new Date(estimatedDeliveryAt).toLocaleString()}` : ''}${showPayment && shipment.cost !== null ? `\nPayment: ${shipment.payment_status} ${shipment.currency} ${shipment.cost}` : ''}\n\n${actionLabel}: ${actionUrl}\n\nNeed help? ${supportUrl}`;
  const html = `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden"><tr><td style="background:#0f3a6d;padding:28px;text-align:center;color:#ffffff">${logo}<div style="font-size:20px;font-weight:700">${escapeHtml(appName)}</div></td></tr><tr><td style="padding:32px"><p style="margin:0 0 16px;font-size:16px">Hello ${escapeHtml(recipient.name || 'there')},</p><h1 style="margin:0 0 14px;font-size:24px;line-height:1.3">${escapeHtml(copy.heading)}</h1><p style="margin:0 0 24px;line-height:1.55;color:#475569">${escapeHtml(intro)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #dbeafe;border-radius:12px;background:#f8fbff"><tr><td style="padding:22px"><div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#475569;text-transform:uppercase">Tracking ID</div><div style="margin:6px 0 18px;font-family:monospace;font-size:22px;font-weight:700;word-break:break-all;color:#0f3a6d">${escapeHtml(shipment.id)}</div><p style="margin:0 0 8px"><strong>Status:</strong> ${escapeHtml(humanizeStatus(shipment))}</p>${shipmentDetails ? `<p style="margin:0 0 8px"><strong>Shipment:</strong> ${escapeHtml(shipmentDetails)}</p>` : ''}<p style="margin:0 0 8px"><strong>Origin:</strong> ${escapeHtml(shipment.pickup_location || 'Not available')}</p><p style="margin:0"><strong>Destination:</strong> ${escapeHtml(shipment.delivery_address)}</p>${reason ? `<p style="margin:16px 0 0;color:#334155"><strong>Update:</strong> ${escapeHtml(reason)}</p>` : ''}${previousReason ? `<p style="margin:16px 0 0;color:#334155"><strong>Previous hold:</strong> ${escapeHtml(previousReason)}</p>` : ''}${estimatedDeliveryAt ? `<p style="margin:16px 0 0;color:#334155"><strong>Updated ETA:</strong> ${escapeHtml(new Date(estimatedDeliveryAt).toLocaleString())}</p>` : ''}${payment}${adminDetails ? `<div style="margin-top:16px;color:#334155">${adminDetails}</div>` : ''}</td></tr></table><table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px auto 8px"><tr><td style="border-radius:8px;background:#2563eb"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-weight:700">${escapeHtml(actionLabel)}</a></td></tr></table><p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#64748b">Need help? <a href="${escapeHtml(supportUrl)}" style="color:#2563eb">Contact support</a>.</p></td></tr><tr><td style="padding:22px 32px;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.5">${escapeHtml(appName)} · <a href="${escapeHtml(appUrl)}" style="color:#2563eb">${escapeHtml(appUrl)}</a><br />This is an automated operational email. Please do not reply to this message.</td></tr></table></td></tr></table></body></html>`;

  return { subject: `${copy.subject} — ${shipment.id}`, html, text };
}

const safeError = (error: unknown) =>
  String(error instanceof Error ? error.message : error)
    .replace(/(pass(word)?|auth|token)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]')
    .slice(0, 500);

export const processNotificationEvents = async () => {
  try {
    // The project URL is public. Reuse Vite's existing value so the worker
    // does not need a duplicate Netlify setting.
    const supabaseUrl = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim() || required('SUPABASE_URL');
    // Prefer Supabase's current secret-key format.  The legacy service-role
    // name remains supported only for installations that have not migrated.
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || required('SUPABASE_SERVICE_ROLE_KEY');
    const smtpUser = process.env.SMTP_USER?.trim() || 'buskelogistics141@gmail.com';
    const smtpPassword = required('SMTP_APP_PASSWORD');
    const adminEmail = process.env.ADMIN_EMAIL?.trim() || 'buskelogistics141@gmail.com';
    const appName = process.env.APP_NAME?.trim() || 'Buske Logistics';
    // APP_URL always remains the canonical customer site. A test recipient is
    // inert unless an operator explicitly enables server-side test mode.
    const productionAppUrl = process.env.APP_URL?.trim() || 'https://buskelogistics.netlify.app';
    const testModeActive = process.env.EMAIL_TEST_MODE?.trim().toLowerCase() === 'true';
    const configuredTestRecipient = process.env.EMAIL_TEST_RECIPIENT?.trim();
    if (testModeActive && !configuredTestRecipient) {
      throw new Error('EMAIL_TEST_MODE requires EMAIL_TEST_RECIPIENT');
    }
    const testRecipient = testModeActive ? configuredTestRecipient : undefined;
    const localAppUrl = process.env.LOCAL_APP_URL?.trim();
    const appUrl =
      process.env.EMAIL_LINK_BASE_URL?.trim() ||
      (testModeActive && localAppUrl ? localAppUrl : productionAppUrl);
    const supportUrl =
      process.env.SUPPORT_URL?.trim() || `${appUrl.replace(/\/$/, '')}/chat`;
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST?.trim() || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: (process.env.SMTP_SECURE || 'true').toLowerCase() === 'true',
      auth: { user: smtpUser, pass: smtpPassword },
    });

    const { data: events, error: eventsError } = await supabase
      .rpc('claim_notification_events', { p_limit: BATCH_SIZE });
    if (eventsError) throw eventsError;

    let sent = 0;
    let failed = 0;
    for (const event of (events || []) as NotificationEvent[]) {
      const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .select('id, sender_name, sender_email, receiver_name, receiver_email, pickup_location, delivery_address, package_name, transportation, status, stopped, paused, terminated, paid, payment_status, payment_responsibility, currency, cost, estimated_delivery_at, published_at')
        .eq('id', event.shipment_id)
        .single();
      if (shipmentError || !shipment) {
        await supabase.from('notification_events').update({ status: 'failed', attempt_count: event.attempt_count + 1, last_error: 'Shipment record is unavailable', next_attempt_at: new Date(Date.now() + 15 * 60_000).toISOString(), claim_token: null, claimed_at: null }).eq('id', event.id).eq('claim_token', event.claim_token);
        failed += 1;
        continue;
      }

      const recipients = recipientsFor(event, shipment as Shipment, adminEmail);
      if (!recipients.length) {
        await supabase.from('notification_events').update({ status: 'processed', processed_at: new Date().toISOString(), last_error: 'No valid recipient email address', claim_token: null, claimed_at: null }).eq('id', event.id).eq('claim_token', event.claim_token);
        continue;
      }

      const deliveryRows = recipients.map((recipient) => ({
        event_id: event.id,
        shipment_id: event.shipment_id,
        tracking_id: event.shipment_id,
        recipient_email: recipient.email,
        recipient_type: recipient.role,
        notification_type: event.event_type,
        subject: eventCopy(event.event_type).subject,
      }));
      const { error: upsertError } = await supabase.from('notification_deliveries').upsert(deliveryRows, { onConflict: 'event_id,recipient_email', ignoreDuplicates: true });
      if (upsertError) throw upsertError;

      const { data: deliveries, error: deliveriesError } = await supabase
        .from('notification_deliveries')
        .select('id, recipient_email, recipient_type, delivery_status, attempt_count')
        .eq('event_id', event.id)
        .neq('delivery_status', 'sent');
      if (deliveriesError) throw deliveriesError;

      let eventFailed = false;
      for (const delivery of deliveries || []) {
        const recipient = recipients.find((item) => item.email.toLowerCase() === delivery.recipient_email.toLowerCase());
        if (!recipient || delivery.attempt_count >= MAX_ATTEMPTS) continue;
        const message = renderEmail({ event, shipment: shipment as Shipment, recipient, appName, appUrl, supportUrl });
        try {
          const target = testRecipient ?? recipient.email;
          const result = await transporter.sendMail({
            from: `${appName} <${smtpUser}>`,
            to: target,
            subject: testModeActive ? `[TEST] ${message.subject}` : message.subject,
            text: message.text,
            html: message.html,
            attachments: [
              {
                filename: COMPANY_LOGO_FILENAME,
                content: companyLogoContent,
                cid: COMPANY_LOGO_CID,
                contentType: 'image/jpeg',
                contentDisposition: 'inline',
              },
            ],
          });
          await supabase.from('notification_deliveries').update({ delivery_status: 'sent', sent_at: new Date().toISOString(), provider_message_id: result.messageId || null, attempt_count: delivery.attempt_count + 1, error_summary: null }).eq('id', delivery.id);
          sent += 1;
        } catch (error) {
          eventFailed = true;
          failed += 1;
          await supabase.from('notification_deliveries').update({ delivery_status: 'failed', attempt_count: delivery.attempt_count + 1, error_summary: safeError(error) }).eq('id', delivery.id);
        }
      }

      const nextAttempt = event.attempt_count + 1;
      await supabase.from('notification_events').update(eventFailed
        ? { status: 'failed', attempt_count: nextAttempt, last_error: 'One or more delivery attempts failed', next_attempt_at: new Date(Date.now() + Math.min(60, 5 * 2 ** event.attempt_count) * 60_000).toISOString(), claim_token: null, claimed_at: null }
        : { status: 'processed', attempt_count: nextAttempt, processed_at: new Date().toISOString(), last_error: null, claim_token: null, claimed_at: null },
      ).eq('id', event.id).eq('claim_token', event.claim_token);
    }

    await transporter.close();
    return { statusCode: 200, body: JSON.stringify({ processed: (events || []).length, sent, failed }) };
  } catch (error) {
    console.error('Notification dispatch failed:', safeError(error));
    return { statusCode: 500, body: JSON.stringify({ error: 'Notification dispatch failed' }) };
  }
};

const hasValidDispatchSecret = (event: HandlerEvent) => {
  const expected = required('NOTIFICATION_DISPATCH_SECRET');
  const supplied = event.headers['x-notification-dispatch-secret'] || event.headers['X-Notification-Dispatch-Secret'];
  if (!supplied) return false;

  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
};

// This endpoint is for the database webhook only. It deliberately ignores the
// request body: recipients, subject, HTML, and event data are always read from
// the durable outbox after an atomic claim.
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    if (!hasValidDispatchSecret(event)) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
  } catch (error) {
    console.error('Notification dispatch authorization failed:', safeError(error));
    return { statusCode: 500, body: JSON.stringify({ error: 'Notification dispatch is unavailable' }) };
  }

  return processNotificationEvents();
};
