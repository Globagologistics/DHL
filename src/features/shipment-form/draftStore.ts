import type { PackagePhoto } from '../../services/shipmentWorkflowService';
import type { ShipmentDraft } from '../shipments/types';

/**
 * Autosaved shipment-form drafts.
 *
 * IndexedDB holds the structured draft (every field, the current step, the
 * route pins and the Storage references of uploaded images) so an admin can
 * refresh, lose the tab or lose the device and carry on where they stopped.
 *
 * Two rules keep this safe:
 *   • File objects are never persisted. Images are uploaded to Supabase
 *     Storage as they are chosen, and only their canonical path/URL is stored.
 *   • Every record is namespaced by the authenticated admin's UID, so one
 *     account never sees another's draft. Nothing secret is written here.
 */

export type StoredPhoto = Omit<PackagePhoto, 'file'>;

export type ShipmentDraftRecord = {
  key: string;
  draftId: string;
  ownerId: string;
  formKey: string;
  step: number;
  draft: ShipmentDraft;
  photos: StoredPhoto[];
  updatedAt: number;
};

const DB_NAME = 'dhl-shipment-drafts';
const STORE = 'drafts';
const VERSION = 1;

export const draftScopeKey = (formKey: string, ownerId: string) => `shipment-draft:${ownerId}:${formKey}`;

let handle: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (handle) return handle;
  handle = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB unavailable')); return; }
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'key' }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB could not be opened'));
  });
  handle.catch(() => { handle = null; });
  return handle;
}

async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = work(transaction.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Draft storage failed'));
  });
}

/**
 * Never persist a File, and never persist a preview that dies with the tab.
 * Only images that really reached storage (a Storage path, or a data URL in
 * the development store) can be restored, so anything still uploading or
 * failed is left out rather than coming back as a broken tile.
 */
const withoutFiles = (photos: PackagePhoto[]): StoredPhoto[] =>
  photos
    .filter(photo => photo.path || /^(https?:|data:)/i.test(photo.url))
    .map(({ file: _file, ...rest }) => ({ ...rest, status: 'uploaded' as const, error: undefined })); // eslint-disable-line @typescript-eslint/no-unused-vars

export async function saveDraft(record: Omit<ShipmentDraftRecord, 'key' | 'updatedAt'> & { photos: PackagePhoto[] }): Promise<void> {
  const payload: ShipmentDraftRecord = {
    key: draftScopeKey(record.formKey, record.ownerId),
    draftId: record.draftId,
    ownerId: record.ownerId,
    formKey: record.formKey,
    step: record.step,
    draft: { ...record.draft },
    photos: withoutFiles(record.photos),
    updatedAt: Date.now(),
  };
  try { await run('readwrite', store => store.put(payload)); } catch { /* private mode or blocked storage */ }
}

export async function loadDraft(formKey: string, ownerId: string): Promise<ShipmentDraftRecord | null> {
  try {
    const record = await run<ShipmentDraftRecord | undefined>('readonly', store => store.get(draftScopeKey(formKey, ownerId)));
    // A record written for a different account is never restored.
    return record && record.ownerId === ownerId ? record : null;
  } catch { return null; }
}

export async function clearDraft(formKey: string, ownerId: string): Promise<void> {
  try { await run('readwrite', store => store.delete(draftScopeKey(formKey, ownerId))); } catch { /* nothing to clear */ }
}
