import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { JOB_TYPES, AU_STATES, STAGES } from './jobConstants';
import EquipmentForm from './EquipmentForm';
import { CloseIcon } from '../../components/icons';
import { geocodeAddress } from '../../lib/geocode';

// Pure read only — no side effects here. useState's lazy initializer runs twice
// under StrictMode in dev, so mutating storage inside it races with itself:
// the first call reads and clears the value, the second finds it already gone.
function readLeadPrefill() {
  try {
    const raw = sessionStorage.getItem('leadPrefill');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const emptyForm = {
  jobType: 'solar_pv_battery',
  customerType: 'Individual',
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  phone: '',
  poNumber: '',
  installerId: '',
  addressLine: '',
  suburb: '',
  state: 'NSW',
  postcode: '',
  systemSizeKw: '',
  customerGstRegistered: false,
  presenceStart: true,
  presenceMiddle: true,
  presenceEnd: true,
};

export default function JobModal({ companyId, installers, installerWorkload, existingJobs, onClose, onCreated, morphName }) {
  const [leadPrefill] = useState(readLeadPrefill);
  const [form, setForm] = useState(() => (leadPrefill ? { ...emptyForm, ...leadPrefill } : emptyForm));

  useEffect(() => {
    sessionStorage.removeItem('leadPrefill');
  }, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [createdJobId, setCreatedJobId] = useState(null);

  const duplicateJob = useMemo(() => {
    const addr = form.addressLine.trim().toLowerCase();
    if (!addr || !existingJobs) return null;
    return existingJobs.find((j) => (j.address_line || '').trim().toLowerCase() === addr) || null;
  }, [form.addressLine, existingJobs]);

  function update(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data: newJob, error: insertError } = await supabase
        .from('jobs')
        .insert({
          company_id: companyId,
          installer_id: form.installerId || null,
          po_number: form.poNumber || null,
          customer_type: form.customerType,
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email || null,
          mobile: form.mobile || null,
          phone: form.phone || null,
          address_line: form.addressLine || null,
          suburb: form.suburb || null,
          state: form.state || null,
          postcode: form.postcode || null,
          job_type: form.jobType,
          job_status: form.installerId ? 'assigned' : 'new',
          system_size_kw: form.systemSizeKw ? Number(form.systemSizeKw) : null,
          customer_gst_registered: form.customerGstRegistered,
          lead_id: leadPrefill?.leadId || null,
          installer_presence_start: form.presenceStart,
          installer_presence_middle: form.presenceMiddle,
          installer_presence_end: form.presenceEnd,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      if (leadPrefill?.leadId) {
        await supabase.from('leads').update({ stage: 'won', converted_job_id: newJob.id }).eq('id', leadPrefill.leadId);
      }
      // Geocode in the background — don't make the user wait on a third-party
      // lookup just to move to the next step.
      geocodeAddress({
        addressLine: form.addressLine,
        suburb: form.suburb,
        state: form.state,
        postcode: form.postcode,
      }).then((coords) => {
        if (coords) supabase.from('jobs').update({ lat: coords.lat, lng: coords.lng }).eq('id', newJob.id).then();
      });
      setCreatedJobId(newJob.id);
    } catch (err) {
      setError(err.message || 'Could not create job.');
    } finally {
      setBusy(false);
    }
  }

  if (createdJobId) {
    return (
      <div className="modal-backdrop" onClick={onCreated}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Add equipment</h2>
            <button type="button" className="icon-btn" aria-label="Close" onClick={onCreated}><CloseIcon /></button>
          </div>
          <p className="muted-label" style={{ marginBottom: 16 }}>
            Optional — record the panels, inverter and battery used for this job. You can also add this later from the job card.
          </p>
          <EquipmentForm jobId={createdJobId} existingEquipment={[]} onDone={onCreated} onSkip={onCreated} />
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal-card"
        style={morphName ? { viewTransitionName: morphName } : undefined}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="modal-header">
          <h2>Customer / Owner Details</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="job-type-grid">
          {JOB_TYPES.map((t) => (
            <button
              type="button"
              key={t.key}
              className={'job-type-card' + (form.jobType === t.key ? ' selected' : '')}
              onClick={() => setForm((f) => ({ ...f, jobType: t.key }))}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="field-row">
          <label>
            Customer type
            <select value={form.customerType} onChange={update('customerType')}>
              <option>Individual</option>
              <option>Company</option>
            </select>
          </label>
          <label>
            PO # (optional)
            <input value={form.poNumber} onChange={update('poNumber')} />
          </label>
        </div>

        <label className="checkbox-row" style={{ marginBottom: 18 }}>
          <input type="checkbox" checked={form.customerGstRegistered} onChange={update('customerGstRegistered')} />
          Customer is GST registered
        </label>

        <div className="field-row">
          <label>
            First name
            <input value={form.firstName} onChange={update('firstName')} required />
          </label>
          <label>
            Last name
            <input value={form.lastName} onChange={update('lastName')} required />
          </label>
        </div>

        <div className="field-row">
          <label>
            Email
            <input type="email" value={form.email} onChange={update('email')} />
          </label>
          <label>
            Mobile
            <input value={form.mobile} onChange={update('mobile')} placeholder="+61 4XX XXX XXX" />
          </label>
        </div>

        <div className="field-row">
          <label>
            Address
            <input value={form.addressLine} onChange={update('addressLine')} />
          </label>
          <label>
            Suburb
            <input value={form.suburb} onChange={update('suburb')} />
          </label>
        </div>

        {duplicateJob && (
          <div className="duplicate-warning">
            A job already exists at this address — {duplicateJob.first_name} {duplicateJob.last_name}
            {' '}({STAGES.find((s) => s.key === duplicateJob.stage)?.label ?? duplicateJob.stage}). You can still continue.
          </div>
        )}

        <div className="field-row">
          <label>
            State
            <select value={form.state} onChange={update('state')}>
              {AU_STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Postcode
            <input value={form.postcode} onChange={update('postcode')} />
          </label>
        </div>

        <div className="field-row">
          <label>
            Assign installer
            <select value={form.installerId} onChange={update('installerId')}>
              <option value="">Unassigned</option>
              {installers.map((i) => {
                const active = installerWorkload?.[i.id] ?? 0;
                return (
                  <option key={i.id} value={i.id}>
                    {i.first_name} {i.last_name} — {active} active job{active === 1 ? '' : 's'}
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            System size (kW)
            <input type="number" step="0.001" value={form.systemSizeKw} onChange={update('systemSizeKw')} />
          </label>
        </div>

        <div className="presence-box">
          <span className="muted-label">Installer presence required</span>
          <div className="presence-checks">
            <label>
              <input type="checkbox" checked={form.presenceStart} onChange={update('presenceStart')} /> Start
            </label>
            <label>
              <input type="checkbox" checked={form.presenceMiddle} onChange={update('presenceMiddle')} /> Middle
            </label>
            <label>
              <input type="checkbox" checked={form.presenceEnd} onChange={update('presenceEnd')} /> End
            </label>
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>Close</button>
          <button type="submit" className="primary-btn" disabled={busy}>
            {busy ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
