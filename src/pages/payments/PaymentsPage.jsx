import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { CloseIcon } from '../../components/icons';

const emptyForm = { jobId: '', milestoneLabel: 'Deposit', amount: '', dueDate: '' };

export default function PaymentsPage() {
  const { company } = useAuth();
  const [payments, setPayments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState('all');

  async function loadData() {
    if (!company) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: paymentRows }, { data: jobRows }] = await Promise.all([
      supabase
        .from('payments')
        .select('*, jobs(first_name, last_name, address_line)')
        .eq('company_id', company.id)
        .order('due_date', { ascending: true }),
      supabase.from('jobs').select('id, first_name, last_name').eq('company_id', company.id).order('created_at', { ascending: false }),
    ]);
    setPayments(paymentRows ?? []);
    setJobs(jobRows ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const outstanding = payments.filter((p) => !p.paid).reduce((sum, p) => sum + Number(p.amount), 0);
    const overdue = payments.filter((p) => !p.paid && p.due_date && p.due_date < today);
    const overdueTotal = overdue.reduce((sum, p) => sum + Number(p.amount), 0);
    const collected = payments.filter((p) => p.paid).reduce((sum, p) => sum + Number(p.amount), 0);
    return { outstanding, overdueCount: overdue.length, overdueTotal, collected };
  }, [payments, today]);

  const visible = payments.filter((p) => {
    if (filter === 'overdue') return !p.paid && p.due_date && p.due_date < today;
    if (filter === 'outstanding') return !p.paid;
    if (filter === 'paid') return p.paid;
    return true;
  });

  async function handleSubmit(e) {
    e.preventDefault();
    await supabase.from('payments').insert({
      company_id: company.id,
      job_id: form.jobId,
      milestone_label: form.milestoneLabel,
      amount: Number(form.amount) || 0,
      due_date: form.dueDate || null,
    });
    setForm(emptyForm);
    setShowModal(false);
    loadData();
  }

  async function togglePaid(payment) {
    const paid = !payment.paid;
    setPayments((prev) => prev.map((p) => (p.id === payment.id ? { ...p, paid, paid_at: paid ? new Date().toISOString() : null } : p)));
    await supabase.from('payments').update({ paid, paid_at: paid ? new Date().toISOString() : null }).eq('id', payment.id);
  }

  return (
    <div>
      <div className="topbar">
        <div><h1>Payments</h1></div>
        <div className="header-actions">
          <button className="primary-btn" onClick={() => setShowModal(true)}>+ Add milestone</button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-topline"><span>Outstanding</span></div>
          <div className="stat-value">${stats.outstanding.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-topline"><span>Overdue</span></div>
          <div className="stat-value">${stats.overdueTotal.toLocaleString()}</div>
          <div className="goal-meta"><span>Milestones</span><span>{stats.overdueCount}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-topline"><span>Collected</span></div>
          <div className="stat-value">${stats.collected.toLocaleString()}</div>
        </div>
      </div>

      <div className="panel filter-bar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All milestones</option>
          <option value="outstanding">Outstanding</option>
          <option value="overdue">Overdue</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <div className="panel">
        {loading ? (
          <div className="empty-state">Loading payments…</div>
        ) : visible.length === 0 ? (
          <div className="empty-state">No payment milestones yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Milestone</th>
                <th>Amount</th>
                <th>Due date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const overdue = !p.paid && p.due_date && p.due_date < today;
                return (
                  <tr key={p.id}>
                    <td>
                      {p.jobs ? <Link to={`/jobs?job=${p.job_id}`}>{p.jobs.first_name} {p.jobs.last_name}</Link> : '—'}
                    </td>
                    <td>{p.milestone_label}</td>
                    <td>${Number(p.amount).toLocaleString()}</td>
                    <td>{p.due_date ?? '-'}</td>
                    <td>
                      <button
                        className={'badge ' + (p.paid ? 'badge-green' : overdue ? 'badge-amber' : 'badge-neutral')}
                        style={{ border: 'none', cursor: 'pointer' }}
                        onClick={() => togglePaid(p)}
                      >
                        {p.paid ? 'Paid' : overdue ? 'Overdue' : 'Unpaid'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <div className="modal-header">
              <h2>Add payment milestone</h2>
              <button type="button" className="icon-btn" aria-label="Close" onClick={() => setShowModal(false)}><CloseIcon /></button>
            </div>
            <label>Job
              <select value={form.jobId} onChange={(e) => setForm((f) => ({ ...f, jobId: e.target.value }))} required>
                <option value="">Select a job…</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.first_name} {j.last_name}</option>)}
              </select>
            </label>
            <div className="field-row">
              <label>Milestone
                <select value={form.milestoneLabel} onChange={(e) => setForm((f) => ({ ...f, milestoneLabel: e.target.value }))}>
                  <option>Deposit</option>
                  <option>Pre-install</option>
                  <option>Final</option>
                  <option>Other</option>
                </select>
              </label>
              <label>Amount ($)<input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required /></label>
            </div>
            <label>Due date<input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} /></label>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="primary-btn">Add milestone</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
