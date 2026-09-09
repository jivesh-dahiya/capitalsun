import SignaturePad from './SignaturePad';
import { CloseIcon } from '../../components/icons';

export default function SignJobModal({ job, onClose, onSign }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Sign off — {job.first_name} {job.last_name}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><CloseIcon /></button>
        </div>

        <SignaturePad
          label="Customer signature"
          existingDataUrl={job.customer_signature}
          onSave={(dataUrl) => onSign('customer_signature', 'customer_signed_at', dataUrl)}
        />
        <SignaturePad
          label="Installer signature"
          existingDataUrl={job.installer_signature}
          onSave={(dataUrl) => onSign('installer_signature', 'installer_signed_at', dataUrl)}
        />
        <SignaturePad
          label="Designer signature"
          existingDataUrl={job.designer_signature}
          onSave={(dataUrl) => onSign('designer_signature', 'designer_signed_at', dataUrl)}
        />

        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
