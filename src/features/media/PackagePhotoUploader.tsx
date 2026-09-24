import { useRef } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, RefreshCw, Trash2 } from 'lucide-react';
import type { PackagePhoto } from '../../services/shipmentWorkflowService';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;

type Props = { photos: PackagePhoto[]; onChange: (photos: PackagePhoto[]) => void; onError: (message: string) => void; max?: number };

/** 1–3 package photos with thumbnails, replace, remove and reorder before submission. */
export function PackagePhotoUploader({ photos, onChange, onError, max = 3 }: Props) {
  const addInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replacing = useRef<number | null>(null);
  // Preview object URLs outlive this step (Review shows them); the wizard
  // releases them when it unmounts.
  const accept = (files: File[]) => {
    const valid: PackagePhoto[] = [];
    for (const file of files) {
      if (!ACCEPTED.includes(file.type)) { onError('Use JPEG, PNG or WebP photos.'); continue; }
      if (file.size > MAX_BYTES) { onError(`“${file.name}” is larger than 10 MB.`); continue; }
      valid.push({ id: crypto.randomUUID(), url: URL.createObjectURL(file), file });
    }
    return valid;
  };
  const add = (files: FileList | null) => {
    const room = max - photos.length;
    const chosen = Array.from(files || []);
    if (chosen.length > room) onError(`You can add up to ${max} photos.`);
    onChange([...photos, ...accept(chosen.slice(0, room))]);
  };
  const replace = (files: FileList | null) => {
    const position = replacing.current;
    const [next] = accept(Array.from(files || []).slice(0, 1));
    if (position === null || !next) return;
    onChange(photos.map((photo, index) => (index === position ? next : photo)));
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= photos.length) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return <div className="dhl-photo-uploader">
    <input ref={addInput} type="file" accept={ACCEPTED.join(',')} multiple hidden onChange={event => { add(event.target.files); event.target.value = ''; }} />
    <input ref={replaceInput} type="file" accept={ACCEPTED.join(',')} hidden onChange={event => { replace(event.target.files); event.target.value = ''; }} />
    {photos.length < max && <button type="button" className="dhl-photo-drop" onClick={() => addInput.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); add(event.dataTransfer.files); }}>
      <ImagePlus size={26} />
      <strong>Add Package Photos</strong>
      <small>Upload 1–{max} images of the consignment · JPEG, PNG or WebP</small>
    </button>}
    {photos.length > 0 && <ol className="dhl-photo-list">
      {photos.map((photo, index) => <li key={photo.id}>
        <img src={photo.url} alt={`Package photo ${index + 1}`} />
        <span className="dhl-photo-order">{index + 1}{index === 0 && <em>Cover</em>}</span>
        <div className="dhl-photo-actions">
          <button type="button" onClick={() => move(index, index - 1)} disabled={index === 0} aria-label={`Move photo ${index + 1} earlier`}><ArrowLeft size={15} /></button>
          <button type="button" onClick={() => move(index, index + 1)} disabled={index === photos.length - 1} aria-label={`Move photo ${index + 1} later`}><ArrowRight size={15} /></button>
          <button type="button" onClick={() => { replacing.current = index; replaceInput.current?.click(); }} aria-label={`Replace photo ${index + 1}`}><RefreshCw size={15} /></button>
          <button type="button" onClick={() => onChange(photos.filter((_, position) => position !== index))} aria-label={`Remove photo ${index + 1}`}><Trash2 size={15} /></button>
        </div>
      </li>)}
    </ol>}
  </div>;
}
