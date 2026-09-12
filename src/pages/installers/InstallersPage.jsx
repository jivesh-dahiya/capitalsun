import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import EmptyState from '../../components/EmptyState';
import { HardHatIcon } from '../../components/icons';

const ROLE_OPTIONS = ['Installer', 'Electrician', 'Designer'];

const emptyForm = {
  firstName: '',
  lastName: '',
  roles: ['Installer'],
  accreditationNumber: '',
  accreditationType: '',
  electricianLicenseNumber: '',
  companyName: '',
  phone: '',
  email: '',
  addressLine: '',
};

export default function InstallersPage() {
  const { company } = useAuth();
  const [installers, setInstallers] = useState([]);
  const [workload, setWorkload] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  async function loadInstallers() {
    if (!company) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data }, { data: jobRows }] = await Promise.all([
      supabase.from('installers').select('*').eq('company_id', company.id).order('created_at', { ascending: false }),
      supabase.from('jobs').select('installer_id, stage').eq('company_id', company.id),
    ]);
    setInstallers(data ?? []);
    const map = {};
    for (const job of jobRows ?? []) {
      if (!job.installer_id) continue;
      if (['cancelled', 'approved', 'complete'].includes(job.stage)) continue;
      map[job.installer_id] = (map[job.installer_id] ?? 0) + 1;
    }
    setWorkload(map);
    setLoading(false);
  }

  useEffect(() => {
    loadInstallers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  function toggleRole(role) {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await supabase.from('installers').insert({
      company_id: company.id,
      first_name: form.firstName,
      last_name: form.lastName,
      roles: form.roles,
      accreditation_number: form.accreditationNumber || null,
      accreditation_type: form.accreditationType || null,
      electrician_license_number: form.electricianLicenseNumber || null,
      company_name: form.companyName || null,
      phone: form.phone || null,
      email: form.email || null,
      address_line: form.addressLine || null,
    });
    setForm(emptyForm);
    setShowForm(false);
    loadInstallers();
  }

  const filtered = installers.filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      i.accreditation_number?.toLowerCase().includes(q) ||
      i.electrician_license_number?.toLowerCase().includes(q) ||
      `${i.first_name} ${i.last_name}`.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Installer List</h1>
        </div>
        <div className="header-actions">
          <button className="primary-btn" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Close' : '+ New Installer'}
          </button>
        </div>
      </div>

      {showForm && (
        <form className="panel" style={{ marginBottom: 18 }} onSubmit={handleSubmit}>
          <div className="field-row">
            <label>
              First name
              <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} required />
            </label>
            <label>
              Last name
              <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} required />
            </label>
          </div>
          <div className="field-row">
            <label>
              Accreditation number
              <input value={form.accreditationNumber} onChange={(e) => setForm((f) => ({ ...f, accreditationNumber: e.target.value }))} />
            </label>
            <label>
              Accreditation type
              <input value={form.accreditationType} onChange={(e) => setForm((f) => ({ ...f, accreditationType: e.target.value }))} placeholder="e.g. CEC Accredited Installer" />
            </label>
            <label>
              Electrician license number
              <input value={form.electricianLicenseNumber} onChange={(e) => setForm((f) => ({ ...f, electricianLicenseNumber: e.target.value }))} />
            </label>
          </div>
          <div className="field-row">
            <label>
              Company (if subcontracted)
              <input value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </label>
          </div>
          <label>
            Address
            <input value={form.addressLine} onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))} />
          </label>
          <div className="presence-box">
            <span className="muted-label">Roles</span>
            <div className="presence-checks">
              {ROLE_OPTIONS.map((role) => (
                <label key={role}>
                  <input type="checkbox" checked={form.roles.includes(role)} onChange={() => toggleRole(role)} /> {role}
                </label>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="submit" className="primary-btn">Add installer</button>
          </div>
        </form>
      )}

      <div className="panel filter-bar">
        <input
          placeholder="Search by name, accreditation or license number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="panel">
        {loading ? (
          <div className="empty-state">Loading installers…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={HardHatIcon}
            title="No installers yet"
            hint="Add your crew's accreditation and license details so you can assign them to jobs."
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Installer name</th>
                <th>Roles</th>
                <th>Active jobs</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id}>
                  <td>{i.first_name} {i.last_name}</td>
                  <td>{i.roles.join(', ')}</td>
                  <td>{workload[i.id] ?? 0}</td>
                  <td><span className="status-pill">{i.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
