import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { ChevronLeftIcon } from '../../components/icons';
import SignaturePad from './SignaturePad';
import {
  installerWrittenStatement,
  designerWrittenStatement,
  retailerDeclaration,
  customerDeclarationText,
} from '../../lib/stcAssignmentText';

const CONNECTION_TYPE_OPTIONS = ['AC coupled', 'DC coupled', 'Hybrid inverter'];
const BATTERY_INSTALL_LOCATIONS = ['Garage', 'Outdoor wall', 'Indoor utility area', 'Under eave', 'Other'];

const YES_NO_FIELDS = [
  { key: 'changed_default_manufacturer_setting', label: 'Was the default manufacturer setting changed at installation?' },
  { key: 'part_of_aggregated_control', label: 'Is the battery part of an aggregated control (VPP) arrangement?' },
  { key: 'previously_received_stc_discount', label: 'Has this property previously received an STC point-of-sale discount?' },
  { key: 'vpp_capable', label: 'Is the battery VPP-capable?' },
  { key: 'retailer_involved_in_procurement', label: 'Was the retailer involved in procuring the battery on the owner’s behalf?' },
];

function fullName(row) {
  if (!row) return '';
  return [row.first_name, row.last_name].filter(Boolean).join(' ');
}

export default function StcAssignmentFormPage() {
  const { jobId } = useParams();
  const { company } = useAuth();
  const [job, setJob] = useState(null);
  const [installers, setInstallers] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [serialDrafts, setSerialDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [form, setForm] = useState({});

  async function loadAll() {
    setLoading(true);
    const [{ data: jobRow }, { data: installerRows }, { data: equipmentRows }] = await Promise.all([
      supabase.from('jobs').select('*').eq('id', jobId).maybeSingle(),
      supabase.from('installers').select('*').eq('company_id', company.id),
      supabase
        .from('job_equipment')
        .select('*, manufacturers(name), equipment_models(name, series, power_kw, capacity_kwh)')
        .eq('job_id', jobId),
    ]);
    setJob(jobRow ?? null);
    if (jobRow) {
      setForm({
        customer_abn: jobRow.customer_abn ?? '',
        po_number: jobRow.po_number ?? '',
        installation_date: jobRow.installation_date ?? '',
        nmi_number: jobRow.nmi_number ?? '',
        property_type: jobRow.property_type ?? '',
        storey_type: jobRow.storey_type ?? 'Single',
        installer_id: jobRow.installer_id ?? '',
        designer_installer_id: jobRow.designer_installer_id ?? '',
        electrician_installer_id: jobRow.electrician_installer_id ?? '',
        battery_installation_type: jobRow.battery_installation_type ?? 'New',
        battery_connection_type: jobRow.battery_connection_type ?? '',
        battery_location: jobRow.battery_location ?? '',
        changed_default_manufacturer_setting: jobRow.changed_default_manufacturer_setting ?? false,
        part_of_aggregated_control: jobRow.part_of_aggregated_control ?? false,
        previously_received_stc_discount: jobRow.previously_received_stc_discount ?? false,
        vpp_capable: jobRow.vpp_capable ?? false,
        retailer_involved_in_procurement: jobRow.retailer_involved_in_procurement ?? false,
        stc_assignment_signed_by_name: jobRow.stc_assignment_signed_by_name ?? '',
        stc_assignment_signature: jobRow.stc_assignment_signature ?? null,
        stc_assignment_signed_at: jobRow.stc_assignment_signed_at ?? null,
      });
    }
    setInstallers(installerRows ?? []);
    const rows = equipmentRows ?? [];
    setEquipment(rows);
    const drafts = {};
    for (const row of rows) drafts[row.id] = (row.serial_numbers ?? []).join(', ');
    setSerialDrafts(drafts);
    setLoading(false);
  }

  useEffect(() => {
    if (!company?.id || !jobId) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id, jobId]);

  const batteryRows = useMemo(() => equipment.filter((e) => e.category === 'battery' && e.quantity > 0), [equipment]);
  const inverterRows = useMemo(() => equipment.filter((e) => e.category === 'inverter' && e.quantity > 0), [equipment]);
  const panelRows = useMemo(() => equipment.filter((e) => e.category === 'panel' && e.quantity > 0), [equipment]);
  const hasBattery = batteryRows.length > 0;

  const totalBatteries = batteryRows.reduce((sum, r) => sum + (r.quantity ?? 0), 0);
  const totalInverters = inverterRows.reduce((sum, r) => sum + (r.quantity ?? 0), 0);
  const totalCapacityKwh = batteryRows.reduce((sum, r) => sum + (r.quantity ?? 0) * Number(r.equipment_models?.capacity_kwh ?? 0), 0);

  const designer = installers.find((i) => i.id === form.designer_installer_id);
  const installerRow = installers.find((i) => i.id === form.installer_id);
  const electrician = installers.find((i) => i.id === form.electrician_installer_id);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      customer_abn: form.customer_abn || null,
      po_number: form.po_number || null,
      installation_date: form.installation_date || null,
      nmi_number: form.nmi_number || null,
      property_type: form.property_type || null,
      storey_type: form.storey_type || null,
      installer_id: form.installer_id || null,
      designer_installer_id: form.designer_installer_id || null,
      electrician_installer_id: form.electrician_installer_id || null,
      battery_installation_type: form.battery_installation_type || null,
      battery_connection_type: form.battery_connection_type || null,
      battery_location: form.battery_location || null,
      changed_default_manufacturer_setting: form.changed_default_manufacturer_setting,
      part_of_aggregated_control: form.part_of_aggregated_control,
      previously_received_stc_discount: form.previously_received_stc_discount,
      vpp_capable: form.vpp_capable,
      retailer_involved_in_procurement: form.retailer_involved_in_procurement,
      stc_assignment_signed_by_name: form.stc_assignment_signed_by_name || null,
    };
    await supabase.from('jobs').update(payload).eq('id', jobId);

    await Promise.all(
      equipment.map((row) => {
        const serials = (serialDrafts[row.id] ?? '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        return supabase.from('job_equipment').update({ serial_numbers: serials }).eq('id', row.id);
      })
    );

    setSaving(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1600);
    loadAll();
  }

  async function saveSignature(dataUrl) {
    const patch = {
      stc_assignment_signature: dataUrl,
      stc_assignment_signed_at: dataUrl ? new Date().toISOString() : null,
    };
    await supabase.from('jobs').update(patch).eq('id', jobId);
    setForm((f) => ({ ...f, ...patch }));
  }

  if (loading) return <div className="empty-state">Loading STC assignment form…</div>;
  if (!job) return <div className="empty-state">Job not found.</div>;

  const aggregatorName = company?.stc_agent_name || company?.legal_entity_name || company?.company_name || '—';
  const aggregatorAbn = company?.stc_agent_abn || company?.abn || '';
  const installAddress = job.install_same_as_owner
    ? { line: job.address_line, suburb: job.suburb, state: job.state, postcode: job.postcode }
    : { line: job.install_address_line, suburb: job.install_suburb, state: job.install_state, postcode: job.install_postcode };
  const stcTotal = hasBattery ? job.bstc_count : job.stc_count;
  const stcDiscountAmount = hasBattery ? job.bstc_amount : job.stc_amount;

  return (
    <div className="stc-form-page">
      <div className="topbar no-print">
        <div>
          <Link className="back-link" to={`/jobs/${jobId}`}><ChevronLeftIcon /> Back to job</Link>
          <h1>STC Assignment Form — {hasBattery ? 'Battery Systems' : 'Solar'}</h1>
        </div>
        <div className="header-actions">
          {savedFlash && <span className="muted-label stc-form-saved-flash">Saved</span>}
          <button className="chip-btn" onClick={() => window.print()}>Print / Download PDF</button>
          <button className="primary-btn" disabled={saving} onClick={handleSave}>{saving ? 'Saving…' : 'Save form details'}</button>
        </div>
      </div>

      <div className="panel no-print stc-form-editor">
        <h2>Form details</h2>
        <p className="muted-label">
          Fill in the fields below — they feed directly into the printable assignment form underneath. Owner, address,
          equipment and STC totals are pulled automatically from this job's System Details and Documents.
        </p>

        <div className="field-row">
          <label>Customer ABN (if applicable)<input value={form.customer_abn} onChange={(e) => setField('customer_abn', e.target.value)} /></label>
          <label>NMI number<input value={form.nmi_number} onChange={(e) => setField('nmi_number', e.target.value)} /></label>
        </div>
        <div className="field-row">
          <label>Property type
            <select value={form.property_type} onChange={(e) => setField('property_type', e.target.value)}>
              <option value="">Select…</option>
              <option>House</option><option>Townhouse</option><option>Unit / Apartment</option>
              <option>Rural / Acreage</option><option>Commercial</option><option>Other</option>
            </select>
          </label>
          <label>Storey
            <select value={form.storey_type} onChange={(e) => setField('storey_type', e.target.value)}>
              <option>Single</option><option>Double</option><option>Triple</option><option>Other</option>
            </select>
          </label>
        </div>
        <div className="field-row">
          <label>PO number<input value={form.po_number} onChange={(e) => setField('po_number', e.target.value)} /></label>
          <label>Installation date<input type="date" value={form.installation_date ?? ''} onChange={(e) => setField('installation_date', e.target.value)} /></label>
        </div>

        <h3>Roles</h3>
        <div className="field-row">
          <label>Installer
            <select value={form.installer_id} onChange={(e) => setField('installer_id', e.target.value)}>
              <option value="">Select…</option>
              {installers.map((i) => <option key={i.id} value={i.id}>{fullName(i)}</option>)}
            </select>
          </label>
          <label>Designer
            <select value={form.designer_installer_id} onChange={(e) => setField('designer_installer_id', e.target.value)}>
              <option value="">Same as installer</option>
              {installers.map((i) => <option key={i.id} value={i.id}>{fullName(i)}</option>)}
            </select>
          </label>
          <label>Electrician
            <select value={form.electrician_installer_id} onChange={(e) => setField('electrician_installer_id', e.target.value)}>
              <option value="">Same as installer</option>
              {installers.map((i) => <option key={i.id} value={i.id}>{fullName(i)}</option>)}
            </select>
          </label>
        </div>
        {installers.some((i) => !i.accreditation_type || !i.accreditation_number) && (
          <div className="inline-note">
            Some installers are missing an accreditation number or type — add these on the Installer List page so
            they appear correctly on the printed form.
          </div>
        )}

        {hasBattery && (
          <>
            <h3>Battery installation details</h3>
            <div className="field-row">
              <label>Battery installation type
                <select value={form.battery_installation_type} onChange={(e) => setField('battery_installation_type', e.target.value)}>
                  <option>New</option><option>Replacement</option><option>Addition to existing system</option>
                </select>
              </label>
              <label>Connection type
                <select value={form.battery_connection_type} onChange={(e) => setField('battery_connection_type', e.target.value)}>
                  <option value="">Select…</option>
                  {CONNECTION_TYPE_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label>Install location
                <select value={form.battery_location} onChange={(e) => setField('battery_location', e.target.value)}>
                  <option value="">Select…</option>
                  {BATTERY_INSTALL_LOCATIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
            </div>
            <div className="legal-box">
              {YES_NO_FIELDS.map((f) => (
                <label className="checkbox-row" key={f.key}>
                  <input type="checkbox" checked={!!form[f.key]} onChange={(e) => setField(f.key, e.target.checked)} />
                  {f.label}
                </label>
              ))}
            </div>
          </>
        )}

        <h3>Equipment serial numbers</h3>
        {equipment.length === 0 && <div className="inline-note">No equipment recorded yet — add it on the System Details tab.</div>}
        {equipment.map((row) => (
          <label key={row.id}>
            {row.category === 'panel' ? 'Panel' : row.category === 'inverter' ? 'Inverter' : 'Battery'} — {row.manufacturers?.name} {row.equipment_models?.name} ({row.quantity} unit{row.quantity === 1 ? '' : 's'}) — serial numbers, comma-separated
            <input
              value={serialDrafts[row.id] ?? ''}
              onChange={(e) => setSerialDrafts((d) => ({ ...d, [row.id]: e.target.value }))}
              placeholder="e.g. SN0001, SN0002"
            />
          </label>
        ))}

        <h3>Customer declaration signature</h3>
        <div className="field-row">
          <label>Signed by (owner full name)<input value={form.stc_assignment_signed_by_name} onChange={(e) => setField('stc_assignment_signed_by_name', e.target.value)} /></label>
        </div>
        <div className="signature-block">
          {form.stc_assignment_signature ? (
            <div className="signature-saved">
              <img src={form.stc_assignment_signature} alt="Customer signature" />
              <button type="button" className="chip-btn" onClick={() => saveSignature(null)}>Re-sign</button>
            </div>
          ) : (
            <SignaturePad label="" existingDataUrl={null} onSave={saveSignature} />
          )}
          {form.stc_assignment_signed_at && <div className="muted-label">Signed {new Date(form.stc_assignment_signed_at).toLocaleString()}</div>}
        </div>

        {!job.declaration_accepted && (
          <div className="inline-note">
            The Retailer Declaration &amp; Written Statement below pulls from the job's <Link to={`/jobs/${jobId}`}>Retailer Declaration tab</Link> —
            it hasn't been completed and signed yet.
          </div>
        )}
      </div>

      <div className="stc-form-doc-shell">
        <div className="stc-form-doc">
          <div className="stc-form-header">
            <div>
              <div className="stc-form-company-name">{company?.legal_entity_name || company?.company_name}</div>
              <div className="muted-label">ABN {company?.abn || '—'}</div>
            </div>
            <div className="stc-form-header-right">
              <div className="stc-form-title">STC Assignment Form</div>
              <div className="stc-form-subtitle">{hasBattery ? 'Battery Systems' : 'Solar'}</div>
              <div className="muted-label">Installation date: {job.installation_date || '—'}</div>
              <div className="muted-label">PO #: {job.po_number || '—'}</div>
            </div>
          </div>

          <FormSection title="Owner Details">
            <FormGrid fields={[
              ['Full name', fullName(job)],
              ['Email', job.email || '—'],
              ['Mobile', job.mobile || job.phone || '—'],
              ['ABN', job.customer_abn || '—'],
            ]} />
          </FormSection>

          <FormSection title="Installation Address">
            <FormGrid fields={[
              ['Address', installAddress.line || '—'],
              ['Suburb', installAddress.suburb || '—'],
              ['State', installAddress.state || '—'],
              ['Postcode', installAddress.postcode || '—'],
            ]} />
          </FormSection>

          <FormSection title="Property Details">
            <FormGrid fields={[
              ['Property type', job.property_type || '—'],
              ['Storey', job.storey_type || '—'],
              ['ABN', job.customer_abn || '—'],
              ['NMI number', job.nmi_number || '—'],
            ]} />
          </FormSection>

          <FormSection title="STC Details">
            <FormGrid fields={[
              ['Discount / rebate amount', stcDiscountAmount ? `$${Number(stcDiscountAmount).toLocaleString()}` : '—'],
              ['Total STCs', stcTotal ?? '—'],
            ]} />
          </FormSection>

          <FormSection title="System Details">
            {hasBattery ? (
              <FormGrid fields={[
                ['Total batteries', totalBatteries || '—'],
                ['Usable capacity', totalCapacityKwh ? `${totalCapacityKwh.toFixed(2)} kWh` : '—'],
                ['Nominal capacity', totalCapacityKwh ? `${totalCapacityKwh.toFixed(2)} kWh` : '—'],
                ['Total inverters', totalInverters || '—'],
              ]} />
            ) : (
              <FormGrid fields={[
                ['System size', job.system_size_kw ? `${job.system_size_kw} kW` : '—'],
                ['Total panels', panelRows.reduce((s, r) => s + (r.quantity ?? 0), 0) || '—'],
                ['Total inverters', totalInverters || '—'],
              ]} />
            )}
          </FormSection>

          {hasBattery && (
            <FormSection title="Installation Details">
              <FormGrid fields={[
                ['Battery installation type', job.battery_installation_type || '—'],
                ['Connection type', job.battery_connection_type || '—'],
                ['Install location', job.battery_location || '—'],
                ['Changed default manufacturer setting?', job.changed_default_manufacturer_setting ? 'Yes' : 'No'],
                ['Part of aggregated control (VPP)?', job.part_of_aggregated_control ? 'Yes' : 'No'],
                ['Previously received discount?', job.previously_received_stc_discount ? 'Yes' : 'No'],
                ['VPP capable?', job.vpp_capable ? 'Yes' : 'No'],
                ['Retailer involved in procurement?', job.retailer_involved_in_procurement ? 'Yes' : 'No'],
              ]} />
            </FormSection>
          )}

          {panelRows.length > 0 && !hasBattery && (
            <EquipmentTable title="Panel Details" rows={panelRows} serialDrafts={serialDrafts} />
          )}
          {hasBattery && <EquipmentTable title="Battery System Details" rows={batteryRows} serialDrafts={serialDrafts} />}
          {inverterRows.length > 0 && <EquipmentTable title="Inverter Details" rows={inverterRows} serialDrafts={serialDrafts} />}

          <FormSection title="Designer, Installer & Electrician Details">
            <RoleTable rows={[
              ['Designer', designer || installerRow],
              ['Installer', installerRow],
              ['Electrician', electrician || installerRow],
            ]} />
          </FormSection>

          <FormSection title="Customer Declaration">
            <p className="stc-form-declaration-text">{customerDeclarationText({ aggregatorName })}</p>
            <div className="muted-label">STC agent / assignee: {aggregatorName}{aggregatorAbn ? ` — ABN ${aggregatorAbn}` : ''}</div>
            <div className="stc-form-signoff">
              <div>
                <div className="muted-label">Signed by</div>
                <div>{form.stc_assignment_signed_by_name || fullName(job) || '—'}</div>
              </div>
              <div>
                <div className="muted-label">Signature</div>
                {form.stc_assignment_signature ? <img className="stc-form-sig-img" src={form.stc_assignment_signature} alt="Customer signature" /> : <div>—</div>}
              </div>
              <div>
                <div className="muted-label">Signed on</div>
                <div>{form.stc_assignment_signed_at ? new Date(form.stc_assignment_signed_at).toLocaleDateString() : '—'}</div>
              </div>
            </div>
          </FormSection>

          <div className="stc-form-page-break" />

          <FormSection title="Installer Written Statement">
            <StatementList points={installerWrittenStatement({ hasBattery })} />
          </FormSection>

          <FormSection title="Designer Written Statement">
            <StatementList points={designerWrittenStatement({ hasBattery })} />
          </FormSection>

          <FormSection title="Retailer Declaration & Written Statement">
            <StatementList points={retailerDeclaration({ hasBattery })} />
            <div className="stc-form-signoff">
              <div>
                <div className="muted-label">Retailer representative</div>
                <div>{job.declaration_signed_by_name || '—'}</div>
              </div>
              <div>
                <div className="muted-label">Retailer signature</div>
                {job.declaration_signature ? <img className="stc-form-sig-img" src={job.declaration_signature} alt="Retailer signature" /> : <div>Not yet signed</div>}
              </div>
              <div>
                <div className="muted-label">Signed on</div>
                <div>{job.declaration_signed_at ? new Date(job.declaration_signed_at).toLocaleDateString() : '—'}</div>
              </div>
            </div>
          </FormSection>

          <div className="inline-note no-print">
            This form is generated from Capitalsun's own records and structured to capture what a Clean Energy
            Regulator-compliant STC assignment needs. Have your compliance lead confirm the exact wording of the
            written statements above against current CER guidance before relying on it for a real certificate
            assignment.
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <div className="stc-form-section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function FormGrid({ fields }) {
  return (
    <div className="stc-form-grid">
      {fields.map(([label, value]) => (
        <div className="stc-form-field" key={label}>
          <span className="stc-form-field-label">{label}</span>
          <span className="stc-form-field-value">{value}</span>
        </div>
      ))}
    </div>
  );
}

function EquipmentTable({ title, rows, serialDrafts }) {
  return (
    <div className="stc-form-section">
      <h3>{title}</h3>
      <table className="stc-form-table">
        <thead>
          <tr><th>#</th><th>Brand</th><th>Model</th><th>Series</th><th>Serial numbers</th></tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id}>
              <td>{idx + 1}</td>
              <td>{row.manufacturers?.name || '—'}</td>
              <td>{row.equipment_models?.name || '—'}</td>
              <td>{row.equipment_models?.series || '—'}</td>
              <td>{serialDrafts[row.id] || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoleTable({ rows }) {
  return (
    <table className="stc-form-table">
      <thead>
        <tr><th>Role</th><th>Full name</th><th>Company</th><th>Phone</th><th>Email</th><th>Accreditation #</th><th>Accreditation type</th><th>Electrical licence #</th></tr>
      </thead>
      <tbody>
        {rows.map(([role, person]) => (
          <tr key={role}>
            <td>{role}</td>
            <td>{fullName(person) || '—'}</td>
            <td>{person?.company_name || '—'}</td>
            <td>{person?.phone || '—'}</td>
            <td>{person?.email || '—'}</td>
            <td>{person?.accreditation_number || '—'}</td>
            <td>{person?.accreditation_type || '—'}</td>
            <td>{person?.electrician_license_number || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatementList({ points }) {
  return (
    <ul className="stc-form-statement-list">
      {points.map((p, i) => <li key={i}>{p}</li>)}
    </ul>
  );
}
