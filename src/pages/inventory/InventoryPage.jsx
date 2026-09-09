import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import Combobox from '../../components/Combobox';

const emptyForm = {
  manufacturerId: '',
  palletNumber: '',
  serials: '',
  wattage: '',
};

export default function InventoryPage() {
  const { company } = useAuth();
  const [manufacturers, setManufacturers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState('');
  const [serialSearch, setSerialSearch] = useState('');
  const [message, setMessage] = useState('');

  async function loadData() {
    if (!company) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: manuRows }, { data: itemRows }] = await Promise.all([
      supabase.from('manufacturers').select('*').order('name'),
      supabase
        .from('inventory_items')
        .select('*, manufacturers(name), equipment_models(name)')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false }),
    ]);
    setManufacturers(manuRows ?? []);
    setItems(itemRows ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  async function handleAdd(e) {
    e.preventDefault();
    setMessage('');
    const serials = form.serials
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (serials.length === 0) {
      setMessage('Enter at least one serial number.');
      return;
    }
    const rows = serials.map((serial) => ({
      company_id: company.id,
      manufacturer_id: form.manufacturerId || null,
      serial_number: serial,
      wattage_kw: form.wattage ? Number(form.wattage) : null,
      pallet_number: form.palletNumber || null,
      status: 'unverified',
    }));
    const { error } = await supabase.from('inventory_items').insert(rows);
    if (error) {
      setMessage(error.message);
      return;
    }
    setForm(emptyForm);
    loadData();
  }

  const filtered = items.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (serialSearch && !item.serial_number.toLowerCase().includes(serialSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Panel Inventory</h1>
        </div>
      </div>

      <form className="panel" style={{ marginBottom: 18 }} onSubmit={handleAdd}>
        <h2 style={{ marginTop: 0 }}>Add Inventory</h2>
        <div className="field-row">
          <label>
            Manufacturer
            <Combobox
              value={form.manufacturerId}
              onChange={(id) => setForm((f) => ({ ...f, manufacturerId: id }))}
              options={manufacturers}
              formatOption={(m) => `${m.name} (${m.category})`}
              placeholder="Type to search…"
            />
          </label>
          <label>
            Pallet number (optional)
            <input value={form.palletNumber} onChange={(e) => setForm((f) => ({ ...f, palletNumber: e.target.value }))} />
          </label>
        </div>
        <label>
          Unverified panel serials
          <textarea
            rows={3}
            placeholder="Enter comma separated serials"
            value={form.serials}
            onChange={(e) => setForm((f) => ({ ...f, serials: e.target.value }))}
          />
        </label>
        <label>
          Wattage (kW)
          <input type="number" step="0.001" value={form.wattage} onChange={(e) => setForm((f) => ({ ...f, wattage: e.target.value }))} />
        </label>
        {message && <div className="auth-error">{message}</div>}
        <div className="modal-actions">
          <button type="submit" className="primary-btn">Add as unverified panels</button>
        </div>
      </form>

      <div className="panel filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="unverified">Unverified</option>
          <option value="verified">Verified</option>
          <option value="assigned">Assigned</option>
        </select>
        <input
          placeholder="Search by serial number"
          value={serialSearch}
          onChange={(e) => setSerialSearch(e.target.value)}
        />
      </div>

      <div className="panel">
        {loading ? (
          <div className="empty-state">Loading inventory…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No data available.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Serial</th>
                <th>Manufacturer</th>
                <th>Job ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>{item.serial_number}</td>
                  <td>{item.manufacturers?.name ?? '-'}</td>
                  <td>{item.job_id ?? '-'}</td>
                  <td><span className="status-pill">{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
