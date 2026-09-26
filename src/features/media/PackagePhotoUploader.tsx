import { useRef } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ImagePlus, LoaderCircle, RefreshCw, Trash2 } from 'lucide-react';
import { PACKAGE_IMAGE_MAX_BYTES, PACKAGE_IMAGE_TYPES, removePackagePhoto, uploadPackagePhoto } from '../../services/shipmentWorkflowService';
import type { PackagePhoto } from '../../services/shipmentWorkflowService';
import { useI18n } from '../../i18n';

type Props = {
  photos: PackagePhoto[];
  onChange: (photos: PackagePhoto[]) => void;
  onError: (message: string) => void;
  /** Storage namespace: shipments/<draftId>/… for admins, requests/<draftId>/… publicly. */
  scope: 'shipments' | 'requests';
  draftId: string;
  max?: number;
};

/**
 * 1–3 package photos. Each image is uploaded to Supabase Storage as soon as it
 * is chosen, so the form can be refreshed without losing it and a storage
 * problem is reported on this step instead of at submit. Every tile shows
 * whether it is uploading, stored or failed, and a failure can be retried
 * without disturbing the images that already succeeded.
 */
export function PackagePhotoUploader({ photos, onChange, onError, scope, draftId, max = 3 }: Props) {
  const { t } = useI18n();
  const addInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replacing = useRef<number | null>(null);
  // onChange sees the latest list even when several uploads finish together.
  const latest = useRef(photos);
  latest.current = photos;

  const apply = (update: (current: PackagePhoto[]) => PackagePhoto[]) => {
    const next = update(latest.current);
    latest.current = next;
    onChange(next);
  };

  const validate = (file: File): string => {
    if (!PACKAGE_IMAGE_TYPES.includes(file.type)) return 'Use JPEG, PNG or WebP photos.';
    if (file.size > PACKAGE_IMAGE_MAX_BYTES) return `“${file.name}” is larger than 10 MB.`;
    return '';
  };

  const start = (photo: PackagePhoto) => {
    void uploadPackagePhoto(photo, scope, draftId).then(result => {
      apply(current => current.map(item => (item.id === photo.id ? { ...result, url: result.url || item.url } : item)));
      if (result.status === 'failed') onError(result.error || t('couldNotUpload'));
    });
  };

  const add = (files: FileList | null) => {
    const room = max - latest.current.length;
    const chosen = Array.from(files || []);
    if (chosen.length > room) onError(`You can add up to ${max} photos.`);
    const accepted: PackagePhoto[] = [];
    for (const file of chosen.slice(0, Math.max(0, room))) {
      const issue = validate(file);
      if (issue) { onError(issue); continue; }
      accepted.push({ id: crypto.randomUUID(), url: URL.createObjectURL(file), name: file.name, file, status: 'uploading' });
    }
    if (!accepted.length) return;
    apply(current => [...current, ...accepted]);
    accepted.forEach(start);
  };

  const replace = (files: FileList | null) => {
    const position = replacing.current;
    const file = Array.from(files || [])[0];
    replacing.current = null;
    if (position === null || !file) return;
    const issue = validate(file);
    if (issue) { onError(issue); return; }
    const previous = latest.current[position];
    const next: PackagePhoto = { id: crypto.randomUUID(), url: URL.createObjectURL(file), name: file.name, file, status: 'uploading' };
    apply(current => current.map((photo, index) => (index === position ? next : photo)));
    void removePackagePhoto(previous);
    start(next);
  };

  const remove = (index: number) => {
    const photo = latest.current[index];
    apply(current => current.filter((_, position) => position !== index));
    if (photo.url.startsWith('blob:')) URL.revokeObjectURL(photo.url);
    void removePackagePhoto(photo);
  };

  const retry = (index: number) => {
    const photo = latest.current[index];
    if (!photo.file) { onError('Re-add this image: the original file is no longer available after a refresh.'); return; }
    apply(current => current.map((item, position) => (position === index ? { ...item, status: 'uploading', error: undefined } : item)));
    start({ ...photo, status: 'uploading' });
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= latest.current.length) return;
    apply(current => { const next = [...current]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next; });
  };

  const label = (photo: PackagePhoto) => photo.status === 'uploading' ? t('uploading') : photo.status === 'failed' ? t('uploadFailed') : t('uploaded');

  return <div className="dhl-photo-uploader">
    <input ref={addInput} type="file" accept={PACKAGE_IMAGE_TYPES.join(',')} multiple hidden onChange={event => { add(event.target.files); event.target.value = ''; }} />
    <input ref={replaceInput} type="file" accept={PACKAGE_IMAGE_TYPES.join(',')} hidden onChange={event => { replace(event.target.files); event.target.value = ''; }} />
    {photos.length < max && <button type="button" className="dhl-photo-drop" onClick={() => addInput.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); add(event.dataTransfer.files); }}>
      <ImagePlus size={26} />
      <strong>Add Package Photos</strong>
      <small>Upload 1–{max} images of the consignment · JPEG, PNG or WebP · up to 10 MB</small>
    </button>}
    {photos.length > 0 && <ol className="dhl-photo-list">
      {photos.map((photo, index) => <li key={photo.id} className={`is-${photo.status || 'uploaded'}`}>
        <img src={photo.url} alt={`Package photo ${index + 1}`} />
        <span className="dhl-photo-order">{index + 1}{index === 0 && <em>Cover</em>}</span>
        <span className={`dhl-photo-state ${photo.status || 'uploaded'}`} role="status" aria-live="polite">
          {photo.status === 'uploading' ? <LoaderCircle size={13} className="dhl-photo-spin" aria-hidden="true" /> : photo.status === 'failed' ? <AlertTriangle size={13} aria-hidden="true" /> : <Check size={13} aria-hidden="true" />}
          {label(photo)}
        </span>
        <div className="dhl-photo-actions">
          <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} aria-label={`Move photo ${index + 1} earlier`}><ArrowLeft size={15} /></button>
          <button type="button" onClick={() => move(index, index + 1)} disabled={index === photos.length - 1} aria-label={`Move photo ${index + 1} later`}><ArrowRight size={15} /></button>
          {photo.status === 'failed'
            ? <button type="button" onClick={() => retry(index)} aria-label={`${t('retryUpload')} ${index + 1}`}><RefreshCw size={15} /></button>
            : <button type="button" onClick={() => { replacing.current = index; replaceInput.current?.click(); }} disabled={photo.status === 'uploading'} aria-label={`Replace photo ${index + 1}`}><RefreshCw size={15} /></button>}
          <button type="button" onClick={() => remove(index)} aria-label={`Remove photo ${index + 1}`}><Trash2 size={15} /></button>
        </div>
      </li>)}
    </ol>}
  </div>;
}
