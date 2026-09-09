import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { CloseIcon } from '../../components/icons';

const CATEGORIES = ['Inverter issue', 'Panel issue', 'Generation issue', 'Wiring', 'Monitoring', 'Other'];
const SEVERITIES = [
  { key: 'low', label: 'Low' },
  { key: 'normal', label: 'Normal' },
  { key: 'high', label: 'High' },
  { key: 'critical', label: 'Critical' },
];
const STATUSES = [
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

const emptyForm = {
  jobId: '', firstName: '', lastName: '', mobile: '', email: '',
  category: CATEGORIES[0], severity: 'normal', description: '',
};

export default function ServiceTicketsPage() {
  const { company } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState('');

  async function loadData() {
    if (!company) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: ticketRows }, { data: jobRows }] = await Promise.all([
      supabase.from('service_tickets').select('*').eq('company_id', company.id).order('created_at', { ascending: false }),
      supabase.from('jobs').select('id, first_name, last_name, mobile, email').eq('company_id', company.id).order('created_at', { ascending: false }),
    ]);
    setTickets(ticketRows ?? []);
    setJobs(jobRows ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  function pickJob(jobId) {
    const job = jobs.find((j) => j.id === jobId);
    setForm((f) => ({
      ...f,
      jobId,
      firstName: job?.first_name ?? f.firstName,
      lastName: job?.last_name ?? f.lastName,
      mobile: job?.mobile ?? f.mobile,
      email: job?.email ?? f.email,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await supabase.from('service_tickets').insert({
      company_id: company.id,
      job_id: form.jobId || null,
      first_name: form.firstName,
      last_name: form.lastName,
      mobile: form.mobile || null,
      email: form.email || null,
      category: form.category,
      severity: form.severity,
      description: form.description || null,
    });
    setForm(emptyForm);
    setShowModal(false);
    loadData();
  }

  async function changeStatus(ticket, status) {
    const resolvedAt = status === 'resolved' || status === 'closed' ? new Date().toISOString() : null;
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, status, resolved_at: resolvedAt } : t)));
    await supabase.from('service_tickets').update({ status, resolved_at: resolvedAt }).eq('id', ticket.id);
  }

  const visible = statusFilter ? tickets.filter((t) => t.status === statusFilter) : tickets;

  return (
    <div>
      <div className="topbar">
        <div><h1>Service &amp; O&amp;M</h1></div>
        <div className="header-actions">
          <button className="primary-btn" onClick={() => setShowModal(true)}>+ New Ticket</button>
        </div>
      </div>

      <div className="panel filter-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="panel empty-state">Loading tickets…</div>
      ) : visible.length === 0 ? (
        <div className="panel empty-state">No service tickets yet.</div>
      ) : (
        <div className="job-list">
          {visible.map((t) => (
            <div className="panel job-card" key={t.id}>
              <div className="job-card-grid" style={{ gridTemplateColumns: '1.3fr 1.3fr 1fr auto' }}>
                <div>
                  <div className="job-card-name">{t.first_name} {t.last_name}</div>
                  <div className="muted-label">{t.category}</div>
                  <div>{t.mobile}</div>
                </div>
                <div>
                  <div className="muted-label">Description</div>
                  <div>{t.description || '—'}</div>
                </div>
                <div>
                  <div className="muted-label">Severity</div>
                  <span className={'badge ' + (t.severity === 'critical' || t.severity === 'high' ? 'badge-amber' : 'badge-neutral')}>
                    {SEVERITIES.find((s) => s.key === t.severity)?.label}
                  </span>
                </div>
                <div className="job-actions">
                  <select className="stage-select" value={t.status} onChange={(e) => changeStatus(t, e.target.value)}>
                    {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <div className="modal-header">
              <h2>New service ticket</h2>
              <button type="button" className="icon-btn" aria-label="Close" onClick={() => setShowModal(false)}><CloseIcon /></button>
            </div>
            {jobs.length > 0 && (
              <label>Link to existing job (optional)
                <select value={form.jobId} onChange={(e) => pickJob(e.target.value)}>
                  <option value="">No linked job</option>
                  {jobs.map((j) => <option key={j.id} value={j.id}>{j.first_name} {j.last_name}</option>)}
                </select>
              </label>
            )}
            <div className="field-row">
              <label>First name<input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} required /></label>
              <label>Last name<input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} required /></label>
            </div>
            <div className="field-row">
              <label>Mobile<input value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} /></label>
              <label>Email<input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></label>
            </div>
            <div className="field-row">
              <label>Category
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label>Severity
                <select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}>
                  {SEVERITIES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </label>
            </div>
            <label>Description<textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></label>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="primary-btn">Create ticket</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
