import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Delivery = {
  id: string;
  tracking_id: string;
  recipient_email: string;
  recipient_type: string;
  notification_type: string;
  delivery_status: string;
  attempt_count: number;
  sent_at: string | null;
  error_summary: string | null;
  created_at: string;
};

const maskEmail = (email: string) => {
  const [name, domain] = email.split('@');
  return domain ? `${name.slice(0, 2)}${name.length > 2 ? '***' : ''}@${domain}` : 'Unavailable';
};

export default function AdminNotifications() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notification_deliveries')
      .select('id, tracking_id, recipient_email, recipient_type, notification_type, delivery_status, attempt_count, sent_at, error_summary, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) setMessage('Unable to load notification delivery records.');
    else setDeliveries((data || []) as Delivery[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const retry = async (id: string) => {
    setMessage(null);
    const { data, error } = await supabase.rpc('retry_notification_delivery', { p_delivery_id: id });
    if (error || !data) setMessage('This delivery could not be queued for retry.');
    else {
      setMessage('Retry queued. The scheduled notification worker will perform the send.');
      void load();
    }
  };

  return <div className="min-h-screen bg-gray-50 p-6"><div className="mx-auto max-w-6xl">
    <div className="mb-6 flex items-center justify-between gap-4"><div><h1 className="text-2xl font-bold text-gray-900">Notification Deliveries</h1><p className="text-sm text-gray-600">Latest 100 outbox delivery attempts. Recipient addresses are masked.</p></div><button onClick={() => void load()} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Refresh</button></div>
    {message && <div className="mb-4 rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</div>}
    <div className="overflow-x-auto rounded-lg bg-white shadow"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100 text-slate-700"><tr><th className="p-3">Tracking</th><th className="p-3">Type</th><th className="p-3">Recipient</th><th className="p-3">State</th><th className="p-3">Attempts</th><th className="p-3">Sent</th><th className="p-3">Error</th><th className="p-3" /></tr></thead><tbody>{loading ? <tr><td className="p-4" colSpan={8}>Loading…</td></tr> : deliveries.map((delivery) => <tr key={delivery.id} className="border-t"><td className="p-3 font-mono text-xs">{delivery.tracking_id}</td><td className="p-3">{delivery.notification_type.replace(/_/g, ' ')}</td><td className="p-3">{delivery.recipient_type} · {maskEmail(delivery.recipient_email)}</td><td className="p-3">{delivery.delivery_status}</td><td className="p-3">{delivery.attempt_count}</td><td className="p-3">{delivery.sent_at ? new Date(delivery.sent_at).toLocaleString() : '—'}</td><td className="p-3 text-red-700">{delivery.error_summary || '—'}</td><td className="p-3">{delivery.delivery_status === 'failed' && <button onClick={() => void retry(delivery.id)} className="rounded bg-amber-600 px-3 py-1 text-xs font-semibold text-white">Retry Email</button>}</td></tr>)}</tbody></table></div>
  </div></div>;
}
