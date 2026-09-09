import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { STAGES, JOB_STATUSES, JOB_TYPES, AU_STATES } from './jobConstants';
import EquipmentForm from './EquipmentForm';
import SignaturePad from './SignaturePad';
import Section from '../../components/Section';
import { ChevronLeftIcon } from '../../components/icons';

const TABS = [
  { key: 'customer', label: 'Customer Details' },
  { key: 'system', label: 'System Details' },
  { key: 'install', label: 'Install Details' },
  { key: 'documents', label: 'Documents & Photos' },
  { key: 'declaration', label: 'Retailer Declaration' },
  { key: 'notes', label: 'Notes & RFIs' },
];

const GRID_CONNECTION_TYPES = [
  { key: 'no_battery', label: 'Grid connect — no battery' },
  { key: 'with_battery', label: 'Grid connect — with battery' },
  { key: 'off_grid', label: 'Off-grid / stand-alone' },
];

const SYSTEM_TYPES = [
  { key: 'sgu_solar_deemed', label: 'SGU — Solar (deemed STCs)' },
  { key: 'sgu_solar_point_of_sale', label: 'SGU — Solar (point of sale)' },
  { key: 'sgu_hot_water', label: 'SGU — Solar hot water' },
  { key: 'sgu_wind', label: 'SGU — Wind' },
];

const STOREY_TYPES = ['Single', 'Double', 'Triple', 'Other'];
const PROPERTY_TYPES = ['House', 'Townhouse', 'Unit / Apartment', 'Rural / Acreage', 'Commercial', 'Other'];
const MOUNTING_TYPES = ['Roof mounted — pitched', 'Roof mounted — flat', 'Ground mounted', 'Flush mounted', 'Other'];
const DOC_TYPES = [
  { key: 'customer_invoice', label: 'Customer invoice' },
  { key: 'rec_invoice', label: 'REC payment invoice' },
  { key: 'electrical_compliance', label: 'Electrical Works Compliance' },
  { key: 'photo', label: 'Site photo' },
  { key: 'other', label: 'Other' },
];

const emptyForm = {
  job_type: 'solar_pv_battery',
  customer_type: 'Individual',
  po_number: '',
  crm_id: '',
  customer_gst_registered: false,
  first_name: '',
  last_name: '',
  email: '',
  mobile: '',
  phone: '',
  address_line: '',
  suburb: '',
  state: 'NSW',
  postcode: '',
  install_same_as_owner: true,
  install_address_line: '',
  install_suburb: '',
  install_state: 'NSW',
  install_postcode: '',
  installer_id: '',
  customer_signature_method: 'installer_app',
  solar_vic_eligible: false,
  system_size_kw: '',
  grid_connection_type: 'no_battery',
  battery_location: '',
  warranty_years: '',
  warranty_description: '',
  installation_date: '',
  install_ampm: '',
  stc_deeming_period: '',
  system_mounting_type: '',
  system_type: 'sgu_solar_deemed',
  nmi_number: '',
  distributor: '',
  distributor_job_reference: '',
  meter_number: '',
  storey_type: 'Single',
  property_type: '',
  property_name: '',
  ever_installed_before: null,
  installer_presence_start: true,
  installer_presence_middle: true,
  installer_presence_end: true,
  special_instructions_to_installer: '',
  additional_install_comments: '',
  cec_accreditation_statement: true,
  siting_approvals_statement: true,
  electrical_safety_statement: true,
  anz_standards_statement: true,
  job_status: 'new',
  stage: 'site_inspection',
  declaration_installer_relationship: '',
  declaration_performance_basis: '',
  declaration_completion_status: '',
  declaration_grid_status: '',
  declaration_feed_in_info_provided: false,
  declaration_savings_info_provided: false,
  declaration_conflicts_disclosed: false,
  declaration_no_ineligibility: false,
  declaration_accepted: false,
  declaration_signed_by_name: '',
  declaration_position: '',
  declaration_signature: null,
  declaration_signed_at: null,
  declaration_witness_name: '',
  declaration_witness_signature: null,
  declaration_witness_signed_at: null,
};

const EDITABLE_COLUMNS = Object.keys(emptyForm);

export default function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { company, profile } = useAuth();
  const [job, setJob] = useState(null);
  const [installers, setInstallers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('customer');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('other');
  const [noteDraft, setNoteDraft] = useState('');
  const [noteType, setNoteType] = useState('note');
  const dirty = useRef(false);

  async function loadJob() {
    setLoading(true);
    const [{ data: jobRow }, { data: installerRows }, { data: equipmentRows }, { data: documentRows }, { data: noteRows }] =
      await Promise.all([
        supabase.from('jobs').select('*').eq('id', jobId).maybeSingle(),
        supabase.from('installers').select('*').eq('company_id', company.id),
        supabase.from('job_equipment').select('*, manufacturers(name), equipment_models(name)').eq('job_id', jobId),
        supabase.from('job_documents').select('*').eq('job_id', jobId).order('uploaded_at', { ascending: false }),
        supabase.from('job_notes').select('*').eq('job_id', jobId).order('created_at', { ascending: false }),
      ]);
    setJob(jobRow ?? null);
    if (jobRow) {
      const next = { ...emptyForm };
      for (const key of EDITABLE_COLUMNS) {
        if (jobRow[key] !== undefined && jobRow[key] !== null) next[key] = jobRow[key];
      }
      setForm(next);
    }
    setInstallers(installerRows ?? []);
    setEquipment(equipmentRows ?? []);
    setDocuments(documentRows ?? []);
    setNotes(noteRows ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (!company?.id || !jobId) return;
    loadJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id, jobId]);

  function update(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      dirty.current = true;
      setForm((f) => ({ ...f, [field]: value }));
    };
  }

  function setField(field, value) {
    dirty.current = true;
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const payload = { ...form };
    payload.system_size_kw = form.system_size_kw === '' ? null : Number(form.system_size_kw);
    payload.warranty_years = form.warranty_years === '' ? null : Number(form.warranty_years);
    payload.installation_date = form.installation_date || null;
    payload.installer_id = form.installer_id || null;
    const statusLabel = STAGES.find((s) => s.key === form.stage)?.label.toUpperCase();
    payload.status_label = statusLabel;
    const { error } = await supabase.from('jobs').update(payload).eq('id', jobId);
    setSaving(false);
    if (!error) {
      dirty.current = false;
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1600);
      loadJob();
    }
  }

  async function saveDeclarationSignature(field, timestampField, dataUrl) {
    const patch = { [field]: dataUrl, [timestampField]: dataUrl ? new Date().toISOString() : null };
    await supabase.from('jobs').update(patch).eq('id', jobId);
    setForm((f) => ({ ...f, ...patch }));
    setJob((j) => (j ? { ...j, ...patch } : j));
  }

  async function uploadDocument(file) {
    if (!file) return;
    setUploading(true);
    const path = `${company.id}/${jobId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('job-documents').upload(path, file);
    if (!uploadError) {
      await supabase.from('job_documents').insert({
        company_id: company.id,
        job_id: jobId,
        file_name: file.name,
        storage_path: path,
        doc_type: docType,
      });
      const { data } = await supabase.from('job_documents').select('*').eq('job_id', jobId).order('uploaded_at', { ascending: false });
      setDocuments(data ?? []);
    }
    setUploading(false);
  }

  async function downloadDocument(doc) {
    const { data } = await supabase.storage.from('job-documents').createSignedUrl(doc.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  async function deleteDocument(doc) {
    await supabase.storage.from('job-documents').remove([doc.storage_path]);
    await supabase.from('job_documents').delete().eq('id', doc.id);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
  }

  async function addNote() {
    if (!noteDraft.trim()) return;
    const authorName = profile ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() : null;
    const { data, error } = await supabase
      .from('job_notes')
      .insert({ company_id: company.id, job_id: jobId, type: noteType, body: noteDraft.trim(), author_name: authorName || null })
      .select()
      .single();
    if (!error && data) {
      setNotes((prev) => [data, ...prev]);
      setNoteDraft('');
    }
  }

  async function deleteNote(noteId) {
    await supabase.from('job_notes').delete().eq('id', noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  const documentsByType = useMemo(() => {
    const grouped = {};
    for (const doc of documents) (grouped[doc.doc_type ?? 'other'] ??= []).push(doc);
    return grouped;
  }, [documents]);

  if (loading) return <div className="panel empty-state">Loading job…</div>;
  if (!job) return <div className="panel empty-state">Job not found. <Link to="/jobs">Back to Job Pipeline</Link></div>;

  return (
    <div className="detail-page">
      <div className="topbar">
        <div>
          <button type="button" className="ghost-btn back-link" onClick={() => navigate('/jobs')}>
            <ChevronLeftIcon /> Job Pipeline
          </button>
          <h1>{job.first_name} {job.last_name}</h1>
          <div className="muted-label">{job.address_line}, {job.suburb} {job.state} {job.postcode}</div>
        </div>
        <div className="header-actions">
          <select className="stage-select" value={form.stage} onChange={update('stage')}>
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select className="status-select" value={form.job_status} onChange={update('job_status')}>
            {JOB_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="tab-strip">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={'tab-item' + (activeTab === tab.key ? ' active' : '')}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="panel detail-panel">
        {activeTab === 'customer' && (
          <CustomerTab form={form} update={update} setField={setField} installers={installers} />
        )}
        {activeTab === 'system' && (
          <SystemTab form={form} update={update} jobId={jobId} equipment={equipment} onEquipmentSaved={loadJob} />
        )}
        {activeTab === 'install' && <InstallTab form={form} update={update} setField={setField} />}
        {activeTab === 'documents' && (
          <DocumentsTab
            jobId={jobId}
            documentsByType={documentsByType}
            docType={docType}
            setDocType={setDocType}
            uploading={uploading}
            onUpload={uploadDocument}
            onDownload={downloadDocument}
            onDelete={deleteDocument}
          />
        )}
        {activeTab === 'declaration' && (
          <DeclarationTab
            form={form}
            update={update}
            setField={setField}
            company={company}
            job={job}
            onSignRep={(dataUrl) => saveDeclarationSignature('declaration_signature', 'declaration_signed_at', dataUrl)}
            onSignWitness={(dataUrl) => saveDeclarationSignature('declaration_witness_signature', 'declaration_witness_signed_at', dataUrl)}
          />
        )}
        {activeTab === 'notes' && (
          <NotesTab
            notes={notes}
            noteDraft={noteDraft}
            setNoteDraft={setNoteDraft}
            noteType={noteType}
            setNoteType={setNoteType}
            onAdd={addNote}
            onDelete={deleteNote}
          />
        )}
      </div>

      <div className="save-bar">
        <span className={'save-flash' + (savedFlash ? ' show' : '')}>Saved</span>
        <button type="button" className="primary-btn" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

function CustomerTab({ form, update, setField, installers }) {
  return (
    <div>
      <h2>Customer / Owner Details</h2>
      <div className="job-type-grid">
        {JOB_TYPES.map((t) => (
          <button
            type="button"
            key={t.key}
            className={'job-type-card' + (form.job_type === t.key ? ' selected' : '')}
            onClick={() => setField('job_type', t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="field-row">
        <label>Customer type
          <select value={form.customer_type} onChange={update('customer_type')}>
            <option>Individual</option>
            <option>Company</option>
          </select>
        </label>
        <label>PO # (optional)
          <input value={form.po_number ?? ''} onChange={update('po_number')} />
        </label>
        <label>External Software Package ID (CRM)
          <input value={form.crm_id ?? ''} onChange={update('crm_id')} />
        </label>
      </div>

      <label className="checkbox-row" style={{ marginBottom: 18 }}>
        <input type="checkbox" checked={form.customer_gst_registered} onChange={update('customer_gst_registered')} />
        Customer is GST registered
      </label>

      <div className="field-row">
        <label>First name
          <input value={form.first_name ?? ''} onChange={update('first_name')} required />
        </label>
        <label>Last name
          <input value={form.last_name ?? ''} onChange={update('last_name')} required />
        </label>
      </div>

      <div className="field-row">
        <label>Email
          <input type="email" value={form.email ?? ''} onChange={update('email')} />
        </label>
        <label>Mobile
          <input value={form.mobile ?? ''} onChange={update('mobile')} placeholder="+61 4XX XXX XXX" />
        </label>
        <label>Phone
          <input value={form.phone ?? ''} onChange={update('phone')} />
        </label>
      </div>

      <h3>Owner address</h3>
      <div className="field-row">
        <label>Address
          <input value={form.address_line ?? ''} onChange={update('address_line')} />
        </label>
        <label>Suburb
          <input value={form.suburb ?? ''} onChange={update('suburb')} />
        </label>
      </div>
      <div className="field-row">
        <label>State
          <select value={form.state} onChange={update('state')}>
            {AU_STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label>Postcode
          <input value={form.postcode ?? ''} onChange={update('postcode')} />
        </label>
      </div>

      <label className="checkbox-row" style={{ marginBottom: 18 }}>
        <input type="checkbox" checked={form.install_same_as_owner} onChange={update('install_same_as_owner')} />
        Installation address is the same as the owner address
      </label>

      {!form.install_same_as_owner && (
        <>
          <h3>Installation address</h3>
          <div className="field-row">
            <label>Address
              <input value={form.install_address_line ?? ''} onChange={update('install_address_line')} />
            </label>
            <label>Suburb
              <input value={form.install_suburb ?? ''} onChange={update('install_suburb')} />
            </label>
          </div>
          <div className="field-row">
            <label>State
              <select value={form.install_state} onChange={update('install_state')}>
                {AU_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label>Postcode
              <input value={form.install_postcode ?? ''} onChange={update('install_postcode')} />
            </label>
          </div>
        </>
      )}

      <div className="field-row">
        <label>Assign installer
          <select value={form.installer_id} onChange={update('installer_id')}>
            <option value="">Unassigned</option>
            {installers.map((i) => (
              <option key={i.id} value={i.id}>{i.first_name} {i.last_name}</option>
            ))}
          </select>
        </label>
      </div>

      <h3>Customer signature method</h3>
      <div className="radio-group">
        <label className="checkbox-row">
          <input type="radio" name="sig-method" checked={form.customer_signature_method === 'installer_app'} onChange={() => setField('customer_signature_method', 'installer_app')} />
          Sign in person, on the installer's device
        </label>
        <label className="checkbox-row">
          <input type="radio" name="sig-method" checked={form.customer_signature_method === 'remote_email'} onChange={() => setField('customer_signature_method', 'remote_email')} />
          Send a remote signing link by email
        </label>
      </div>
      {form.customer_signature_method === 'remote_email' && (
        <div className="inline-note">
          Remote email delivery isn't connected in this build yet — the customer will still need to sign in
          person via Sign job until an email provider is wired up.
        </div>
      )}

      <label className="checkbox-row" style={{ marginTop: 18 }}>
        <input type="checkbox" checked={form.solar_vic_eligible} onChange={update('solar_vic_eligible')} />
        Eligible for Solar Victoria rebate
      </label>
    </div>
  );
}

function SystemTab({ form, update, jobId, equipment, onEquipmentSaved }) {
  return (
    <div>
      <h2>System Details</h2>
      <div className="field-row">
        <label>System size (kW)
          <input type="number" step="0.001" value={form.system_size_kw ?? ''} onChange={update('system_size_kw')} />
        </label>
        <label>Connection type
          <select value={form.grid_connection_type} onChange={update('grid_connection_type')}>
            {GRID_CONNECTION_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </label>
      </div>

      {form.grid_connection_type === 'with_battery' && (
        <label>Battery location
          <input value={form.battery_location ?? ''} onChange={update('battery_location')} placeholder="e.g. Garage wall, north side" />
        </label>
      )}

      <div className="field-row">
        <label>Warranty (years)
          <input type="number" min="0" value={form.warranty_years ?? ''} onChange={update('warranty_years')} />
        </label>
      </div>
      <label>Warranty description
        <textarea rows={2} value={form.warranty_description ?? ''} onChange={update('warranty_description')} />
      </label>

      <h3>Equipment</h3>
      <EquipmentForm jobId={jobId} existingEquipment={equipment} onDone={onEquipmentSaved} />
    </div>
  );
}

function InstallTab({ form, update, setField }) {
  return (
    <div>
      <h2>Install Details</h2>
      <div className="field-row">
        <label>Installation date
          <input type="date" value={form.installation_date ?? ''} onChange={update('installation_date')} />
        </label>
        <label>AM / PM
          <select value={form.install_ampm ?? ''} onChange={update('install_ampm')}>
            <option value="">Unspecified</option>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </label>
        <label>STC deeming period
          <input value={form.stc_deeming_period ?? ''} onChange={update('stc_deeming_period')} placeholder="e.g. 2026" />
        </label>
      </div>

      <div className="field-row">
        <label>Type of system
          <select value={form.system_type} onChange={update('system_type')}>
            {SYSTEM_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </label>
        <label>System mounting type
          <select value={form.system_mounting_type ?? ''} onChange={update('system_mounting_type')}>
            <option value="">Select…</option>
            {MOUNTING_TYPES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
      </div>

      <h3>Installer presence required</h3>
      <div className="presence-box">
        <div className="presence-checks">
          <label><input type="checkbox" checked={form.installer_presence_start} onChange={update('installer_presence_start')} /> Start</label>
          <label><input type="checkbox" checked={form.installer_presence_middle} onChange={update('installer_presence_middle')} /> Middle</label>
          <label><input type="checkbox" checked={form.installer_presence_end} onChange={update('installer_presence_end')} /> End</label>
        </div>
      </div>

      <Section title="Property & meter details" defaultOpen={Boolean(form.nmi_number || form.meter_number || form.distributor)}>
        <div className="field-row">
          <label>NMI number
            <input value={form.nmi_number ?? ''} onChange={update('nmi_number')} />
          </label>
          <label>Meter number
            <input value={form.meter_number ?? ''} onChange={update('meter_number')} />
          </label>
          <label>Distributor
            <input value={form.distributor ?? ''} onChange={update('distributor')} placeholder="e.g. Ausgrid, AusNet, Energex" />
          </label>
        </div>
        <div className="field-row">
          <label>Distributor job reference number
            <input value={form.distributor_job_reference ?? ''} onChange={update('distributor_job_reference')} />
          </label>
          <label>Property name (optional)
            <input value={form.property_name ?? ''} onChange={update('property_name')} />
          </label>
        </div>
        <div className="field-row">
          <label>Storey type
            <select value={form.storey_type} onChange={update('storey_type')}>
              {STOREY_TYPES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label>Property type
            <select value={form.property_type ?? ''} onChange={update('property_type')}>
              <option value="">Select…</option>
              {PROPERTY_TYPES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
        </div>
        <h3 style={{ marginTop: 6 }}>Has solar ever been installed at this address before?</h3>
        <div className="radio-group">
          <label className="checkbox-row">
            <input type="radio" name="ever-installed" checked={form.ever_installed_before === true} onChange={() => setField('ever_installed_before', true)} />
            Yes
          </label>
          <label className="checkbox-row">
            <input type="radio" name="ever-installed" checked={form.ever_installed_before === false} onChange={() => setField('ever_installed_before', false)} />
            No
          </label>
          <label className="checkbox-row">
            <input type="radio" name="ever-installed" checked={form.ever_installed_before === null} onChange={() => setField('ever_installed_before', null)} />
            Unknown
          </label>
        </div>
      </Section>

      <Section title="Instructions & comments" defaultOpen={Boolean(form.special_instructions_to_installer || form.additional_install_comments)}>
        <label>Special instructions to installer
          <textarea rows={3} value={form.special_instructions_to_installer ?? ''} onChange={update('special_instructions_to_installer')} />
        </label>
        <label>Additional install comments
          <textarea rows={3} value={form.additional_install_comments ?? ''} onChange={update('additional_install_comments')} />
        </label>
      </Section>

      <Section title="Compliance statements" defaultOpen={false}>
        <div className="legal-box">
          <label className="checkbox-row">
            <input type="checkbox" checked={form.cec_accreditation_statement} onChange={update('cec_accreditation_statement')} />
            The installer holds current Clean Energy Council accreditation appropriate to this installation type.
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={form.siting_approvals_statement} onChange={update('siting_approvals_statement')} />
            All required local, state or territory siting approvals for this installation have been obtained.
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={form.electrical_safety_statement} onChange={update('electrical_safety_statement')} />
            Electrical safety documentation for this installation (e.g. Certificate of Electrical Safety) has been completed.
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={form.anz_standards_statement} onChange={update('anz_standards_statement')} />
            The installation complies with the relevant AS/NZS wiring and grid-connection standards (including AS/NZS 5033 and AS/NZS 4777).
          </label>
        </div>
      </Section>
    </div>
  );
}

function DocumentsTab({ jobId, documentsByType, docType, setDocType, uploading, onUpload, onDownload, onDelete }) {
  return (
    <div>
      <h2>Documents &amp; Photos</h2>
      <div className="field-row">
        <label>Document type
          <select value={docType} onChange={(e) => setDocType(e.target.value)}>
            {DOC_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </label>
        <label className="chip-btn upload-btn" style={{ alignSelf: 'flex-end' }}>
          {uploading ? 'Uploading…' : '+ Upload document'}
          <input type="file" hidden disabled={uploading} onChange={(e) => onUpload(e.target.files[0])} />
        </label>
        <Link className="chip-btn" style={{ alignSelf: 'flex-end' }} to={`/jobs/${jobId}/stc-form`}>Generate STC Assignment Form</Link>
      </div>

      {DOC_TYPES.map((t) => {
        const docs = documentsByType[t.key] ?? [];
        if (docs.length === 0) return null;
        return (
          <div key={t.key} className="doc-group">
            <span className="muted-label">{t.label}</span>
            <div className="documents-summary">
              {docs.map((doc) => (
                <span key={doc.id} className="badge badge-neutral doc-badge">
                  <button type="button" onClick={() => onDownload(doc)}>{doc.file_name}</button>
                  <button type="button" className="doc-remove" aria-label="Delete document" onClick={() => onDelete(doc)}>×</button>
                </span>
              ))}
            </div>
          </div>
        );
      })}
      {Object.values(documentsByType).every((d) => d.length === 0) && (
        <div className="empty-state">No documents or photos uploaded yet.</div>
      )}
    </div>
  );
}

function DeclarationTab({ form, update, setField, company, job, onSignRep, onSignWitness }) {
  const retailerName = company?.legal_entity_name || company?.company_name || '—';
  return (
    <div>
      <h2>Retailer Declaration</h2>
      <p className="muted-label">
        Based on the Clean Energy Regulator's sample solar retailer written statement for solar PV systems
        (Renewable Energy (Electricity) Regulations 2001, regulation 20AH).
      </p>

      <Section title="View CER reference text" defaultOpen={false}>
        <div className="legal-box reference-text">
          <p>
            I (insert name) am the authorised representative of (insert retailer legal entity name and ABN) that sold
            the solar PV system to (insert owner name) and verify that:
          </p>
          <ul>
            <li>(insert name of installer) installed the unit at (insert installation address) and they are an employee or subcontractor of (insert retailer name)</li>
            <li>that the unit will perform in accordance with the contract (or the quote accepted) for the sale of the unit to the owner of the unit, except to the extent that that performance is prevented by circumstances outside the solar retailer's control</li>
            <li>that the unit is complete and generating electricity or capable of generating electricity</li>
            <li>that if grid connected the unit is connected to the grid or (insert retailer name) has completed its obligations under the contract (or quote accepted) relating to the connection of the unit to the grid</li>
            <li>(insert retailer name) provided information in writing to (insert owner name) about feed in tariffs and export limits for the unit and it is true, correct and complete</li>
            <li>(insert retailer name) provided information in writing to the owner of the unit about one or more of the following of the unit, expected payback period or expected energy savings or expected cost savings and that information is true, correct and complete</li>
            <li>any actual or potential conflicts of interest of (insert retailer name) relating to the sale or installation of the unit, or the creation of certificates for the unit, including any conflicts of interest in relation to persons or entities related to (insert retailer name), have been disclosed to (insert owner name) and managed appropriately</li>
            <li>a declaration deeming (insert retailer name) ineligible to make statement under regulation 20AH is not in effect on the day the statement is given</li>
          </ul>
        </div>
      </Section>

      <h3>Retailer detail</h3>
      <div className="field-row">
        <label>Retailer company name (legal entity name)
          <input value={retailerName} disabled />
        </label>
        <label>Retailer ABN
          <input value={company?.abn ?? ''} disabled />
        </label>
      </div>
      {!company?.abn && (
        <div className="inline-note">Set your company's legal entity name and ABN on the Profile page before signing this declaration.</div>
      )}

      <div className="field-row">
        <label>Retailer representative full name
          <input value={form.declaration_signed_by_name ?? ''} onChange={update('declaration_signed_by_name')} />
        </label>
        <label>Position held
          <input value={form.declaration_position ?? ''} onChange={update('declaration_position')} />
        </label>
      </div>

      <h3>Select the applicable options</h3>
      <div className="radio-group">
        <span className="muted-label">The installer is an employee or subcontractor of {retailerName}:</span>
        <label className="checkbox-row">
          <input type="radio" name="rel" checked={form.declaration_installer_relationship === 'employee'} onChange={() => setField('declaration_installer_relationship', 'employee')} /> Employee
        </label>
        <label className="checkbox-row">
          <input type="radio" name="rel" checked={form.declaration_installer_relationship === 'subcontractor'} onChange={() => setField('declaration_installer_relationship', 'subcontractor')} /> Subcontractor
        </label>
      </div>

      <div className="radio-group">
        <span className="muted-label">The unit will perform in accordance with:</span>
        <label className="checkbox-row">
          <input type="radio" name="basis" checked={form.declaration_performance_basis === 'contract'} onChange={() => setField('declaration_performance_basis', 'contract')} /> The contract
        </label>
        <label className="checkbox-row">
          <input type="radio" name="basis" checked={form.declaration_performance_basis === 'quote_accepted'} onChange={() => setField('declaration_performance_basis', 'quote_accepted')} /> The quote accepted
        </label>
      </div>

      <div className="radio-group">
        <span className="muted-label">The unit is:</span>
        <label className="checkbox-row">
          <input type="radio" name="completion" checked={form.declaration_completion_status === 'complete_generating'} onChange={() => setField('declaration_completion_status', 'complete_generating')} /> Complete and generating electricity
        </label>
        <label className="checkbox-row">
          <input type="radio" name="completion" checked={form.declaration_completion_status === 'capable_generating'} onChange={() => setField('declaration_completion_status', 'capable_generating')} /> Capable of generating electricity
        </label>
      </div>

      <div className="radio-group">
        <span className="muted-label">Grid connection:</span>
        <label className="checkbox-row">
          <input type="radio" name="grid" checked={form.declaration_grid_status === 'connected'} onChange={() => setField('declaration_grid_status', 'connected')} /> Unit is connected to the grid
        </label>
        <label className="checkbox-row">
          <input type="radio" name="grid" checked={form.declaration_grid_status === 'obligations_completed'} onChange={() => setField('declaration_grid_status', 'obligations_completed')} /> {retailerName} has completed its obligations relating to the connection of the unit to the grid
        </label>
        <label className="checkbox-row">
          <input type="radio" name="grid" checked={form.declaration_grid_status === 'not_grid_connected'} onChange={() => setField('declaration_grid_status', 'not_grid_connected')} /> Not applicable — unit is not grid connected
        </label>
      </div>

      <h3>Confirm the following</h3>
      <div className="legal-box">
        <label className="checkbox-row">
          <input type="checkbox" checked={form.declaration_feed_in_info_provided} onChange={update('declaration_feed_in_info_provided')} />
          Information was provided in writing to the owner about feed-in tariffs and export limits for the unit, and it is true, correct and complete.
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={form.declaration_savings_info_provided} onChange={update('declaration_savings_info_provided')} />
          Information was provided in writing to the owner about expected payback period, energy savings or cost savings, and it is true, correct and complete.
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={form.declaration_conflicts_disclosed} onChange={update('declaration_conflicts_disclosed')} />
          Any actual or potential conflicts of interest relating to the sale, installation, or certificate creation for the unit have been disclosed to the owner and managed appropriately.
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={form.declaration_no_ineligibility} onChange={update('declaration_no_ineligibility')} />
          No declaration deeming the retailer ineligible to make a statement under regulation 20AH is in effect on the day this statement is given.
        </label>
      </div>

      <div className="legal-box declaration-final">
        <label className="checkbox-row">
          <input type="checkbox" checked={form.declaration_accepted} onChange={update('declaration_accepted')} />
          I declare that the above statements are true, correct and complete and understand that penalties apply
          under the Renewable Energy (Electricity) Act 2000 and Renewable Energy (Electricity) Regulations 2001 for
          providing false or misleading information. I understand that giving false or misleading information is a
          serious offence under the Criminal Code Act 1995.
        </label>
      </div>

      <div className="field-row">
        <div className="signature-block">
          <span className="muted-label">Retailer representative signature</span>
          {form.declaration_signature ? (
            <div className="signature-saved">
              <img src={form.declaration_signature} alt="Retailer representative signature" />
              <button type="button" className="chip-btn" onClick={() => onSignRep(null)}>Re-sign</button>
            </div>
          ) : (
            <SignaturePad label="" existingDataUrl={null} onSave={onSignRep} />
          )}
          {form.declaration_signed_at && <div className="muted-label">Signed {new Date(form.declaration_signed_at).toLocaleString()}</div>}
        </div>

        <div className="signature-block">
          <label>Witness name
            <input value={form.declaration_witness_name ?? ''} onChange={update('declaration_witness_name')} />
          </label>
          <span className="muted-label">Witness signature</span>
          {form.declaration_witness_signature ? (
            <div className="signature-saved">
              <img src={form.declaration_witness_signature} alt="Witness signature" />
              <button type="button" className="chip-btn" onClick={() => onSignWitness(null)}>Re-sign</button>
            </div>
          ) : (
            <SignaturePad label="" existingDataUrl={null} onSave={onSignWitness} />
          )}
          {form.declaration_witness_signed_at && <div className="muted-label">Signed {new Date(form.declaration_witness_signed_at).toLocaleString()}</div>}
        </div>
      </div>
    </div>
  );
}

function NotesTab({ notes, noteDraft, setNoteDraft, noteType, setNoteType, onAdd, onDelete }) {
  return (
    <div>
      <h2>Notes &amp; RFIs</h2>
      <p className="muted-label">
        A Request for Information (RFI) is flagged here for your team to action manually — this build doesn't
        submit RFIs to a regulator ticketing system.
      </p>

      <div className="field-row">
        <label>Type
          <select value={noteType} onChange={(e) => setNoteType(e.target.value)}>
            <option value="note">Note</option>
            <option value="rfi">RFI (Request for Information)</option>
          </select>
        </label>
      </div>
      <label>New entry
        <textarea rows={3} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
      </label>
      <div className="modal-actions">
        <button type="button" className="primary-btn" onClick={onAdd} disabled={!noteDraft.trim()}>Add {noteType === 'rfi' ? 'RFI' : 'note'}</button>
      </div>

      <div className="notes-list">
        {notes.length === 0 && <div className="empty-state">No notes or RFIs yet.</div>}
        {notes.map((note) => (
          <div className="note-card" key={note.id}>
            <div className="note-card-header">
              <span className={'badge ' + (note.type === 'rfi' ? 'badge-orange' : 'badge-neutral')}>
                {note.type === 'rfi' ? 'RFI' : 'Note'}
              </span>
              <span className="muted-label">
                {note.author_name || 'Unknown'} · {new Date(note.created_at).toLocaleString()}
              </span>
              <button type="button" className="doc-remove" aria-label="Delete" onClick={() => onDelete(note.id)}>×</button>
            </div>
            <p>{note.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
