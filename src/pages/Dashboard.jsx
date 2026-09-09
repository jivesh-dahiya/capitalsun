import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { ChevronLeftIcon, ChevronRightIcon, BriefcaseIcon, CheckCircleIcon, CertificateIcon, CoinIcon } from '../components/icons';
import { useCountUp } from '../lib/useCountUp';
import { useRealtimeJobs } from '../lib/useRealtimeJobs';
import JobsMap from '../components/JobsMap';

function MiniCalendar({ markedDates }) {
  const today = new Date();
  const [monthOffset, setMonthOffset] = useState(0);
  const view = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button className="icon-btn" aria-label="Previous month" onClick={() => setMonthOffset((m) => m - 1)}><ChevronLeftIcon /></button>
        <strong>{view.toLocaleString('default', { month: 'long', year: 'numeric' })}</strong>
        <button className="icon-btn" aria-label="Next month" onClick={() => setMonthOffset((m) => m + 1)}><ChevronRightIcon /></button>
      </div>
      <div className="calendar-grid">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="calendar-dow">{d}</div>
        ))}
        {cells.map((day, i) => {
          const dateKey = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
          const marked = dateKey && markedDates.has(dateKey);
          return (
            <div key={i} className={'calendar-cell' + (marked ? ' marked' : '') + (day ? '' : ' empty')}>
              {day ?? ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, sublabel, subvalue, icon, tone }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  return (
    <div className="stat-card">
      <div className="stat-topline">
        <span>{label}</span>
        <span className={'stat-icon ' + tone}>{icon}</span>
      </div>
      <div className="stat-value">{typeof value === 'number' ? Math.round(animated) : value}</div>
      {sublabel && <div className="goal-meta"><span>{sublabel}</span><span>{subvalue}</span></div>}
    </div>
  );
}

export default function Dashboard() {
  const { company } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [leads, setLeads] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!company) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: jobRows }, { data: leadRows }, { data: quoteRows }, { data: paymentRows }, { data: ticketRows }] = await Promise.all([
      supabase.from('jobs').select('*').eq('company_id', company.id).order('created_at', { ascending: false }),
      supabase.from('leads').select('*').eq('company_id', company.id),
      supabase.from('quotes').select('*').eq('company_id', company.id),
      supabase.from('payments').select('*').eq('company_id', company.id),
      supabase.from('service_tickets').select('*').eq('company_id', company.id),
    ]);
    setJobs(jobRows ?? []);
    setLeads(leadRows ?? []);
    setQuotes(quoteRows ?? []);
    setPayments(paymentRows ?? []);
    setTickets(ticketRows ?? []);
    setLoading(false);
  }, [company]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeJobs(company?.id, load);

  const today = new Date().toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7);

  const stats = useMemo(() => {
    const inProgress = jobs.filter((j) => j.stage === 'in_progress').length;
    const activeInstallations = jobs.filter((j) => !['cancelled', 'approved', 'complete'].includes(j.stage)).length;
    const delayedInstallations = jobs.filter((j) => j.installation_date && j.installation_date < today && !['cancelled', 'approved', 'complete'].includes(j.stage)).length;
    const installedKwThisMonth = jobs
      .filter((j) => j.installation_date && j.installation_date.startsWith(monthPrefix))
      .reduce((sum, j) => sum + Number(j.system_size_kw ?? 0), 0);

    const newLeadsToday = leads.filter((l) => l.created_at?.slice(0, 10) === today).length;
    const qualifiedLeads = leads.filter((l) => l.stage === 'qualified').length;
    const wonLeads = leads.filter((l) => l.stage === 'won').length;
    const lostLeads = leads.filter((l) => l.stage === 'lost').length;
    const conversionRate = wonLeads + lostLeads > 0 ? Math.round((wonLeads / (wonLeads + lostLeads)) * 100) : 0;
    const followUpsDue = leads.filter((l) => l.next_follow_up_date && l.next_follow_up_date <= today && !['won', 'lost'].includes(l.stage));

    const quotesSent = quotes.filter((q) => q.status === 'sent').length;
    const acceptedQuotes = quotes.filter((q) => q.status === 'accepted');
    const monthlyRevenue = acceptedQuotes
      .filter((q) => q.accepted_at?.slice(0, 7) === monthPrefix)
      .reduce((sum, q) => sum + Number(q.price ?? 0), 0);
    const avgDealValue = acceptedQuotes.length > 0
      ? acceptedQuotes.reduce((sum, q) => sum + Number(q.price ?? 0), 0) / acceptedQuotes.length
      : 0;

    const pendingPayments = payments.filter((p) => !p.paid);
    const overduePayments = pendingPayments.filter((p) => p.due_date && p.due_date < today);
    const outstanding = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress');
    const criticalTickets = openTickets.filter((t) => t.severity === 'critical' || t.severity === 'high');

    return {
      inProgress, activeInstallations, delayedInstallations, installedKwThisMonth,
      newLeadsToday, qualifiedLeads, wonLeads, lostLeads, conversionRate, followUpsDue,
      quotesSent, monthlyRevenue, avgDealValue,
      pendingPayments, overduePayments, outstanding,
      openTickets, criticalTickets,
    };
  }, [jobs, leads, quotes, payments, tickets, today, monthPrefix]);

  const attentionItems = useMemo(() => {
    const items = [];
    if (stats.overduePayments.length > 0) {
      items.push({ level: 'high', text: `${stats.overduePayments.length} payment${stats.overduePayments.length === 1 ? '' : 's'} overdue`, to: '/payments' });
    }
    if (stats.criticalTickets.length > 0) {
      items.push({ level: 'high', text: `${stats.criticalTickets.length} high/critical service ticket${stats.criticalTickets.length === 1 ? '' : 's'} open`, to: '/service' });
    }
    if (stats.delayedInstallations > 0) {
      items.push({ level: 'high', text: `${stats.delayedInstallations} installation${stats.delayedInstallations === 1 ? '' : 's'} past its date`, to: '/jobs' });
    }
    if (stats.followUpsDue.length > 0) {
      items.push({ level: 'medium', text: `${stats.followUpsDue.length} lead follow-up${stats.followUpsDue.length === 1 ? '' : 's'} due`, to: '/leads' });
    }
    if (stats.quotesSent > 0) {
      items.push({ level: 'low', text: `${stats.quotesSent} quote${stats.quotesSent === 1 ? '' : 's'} awaiting customer response`, to: '/quotes' });
    }
    return items;
  }, [stats]);

  const markedDates = useMemo(() => {
    const set = new Set();
    for (const job of jobs) {
      if (job.installation_date) set.add(job.installation_date);
    }
    return set;
  }, [jobs]);

  if (loading) return <div className="panel empty-state">Loading dashboard…</div>;

  return (
    <div>
      <div className="topbar">
        <div><h1>Dashboard</h1></div>
        <div className="header-actions">
          <Link className="primary-btn" to="/jobs?new=1">+ New Job</Link>
        </div>
      </div>

      <div className="stats-grid">
        <Stat label="Total jobs" value={jobs.length} sublabel="In progress" subvalue={stats.inProgress} icon={<BriefcaseIcon width={18} height={18} />} tone="violet" />
        <Stat label="Active installations" value={stats.activeInstallations} sublabel="Delayed" subvalue={stats.delayedInstallations} icon={<CheckCircleIcon width={18} height={18} />} tone="sky" />
        <Stat label="Installed kW this month" value={Math.round(stats.installedKwThisMonth * 10) / 10} icon={<CertificateIcon width={18} height={18} />} tone="emerald" />
        <Stat label="Outstanding payments" value={Math.round(stats.outstanding)} sublabel="Overdue" subvalue={stats.overduePayments.length} icon={<CoinIcon width={18} height={18} />} tone="amber" />

        <Stat label="Total leads" value={leads.length} sublabel="New today" subvalue={stats.newLeadsToday} icon={<BriefcaseIcon width={18} height={18} />} tone="violet" />
        <Stat label="Qualified leads" value={stats.qualifiedLeads} sublabel="Follow-ups due" subvalue={stats.followUpsDue.length} icon={<CheckCircleIcon width={18} height={18} />} tone="sky" />
        <Stat label="Conversion rate" value={`${stats.conversionRate}%`} sublabel="Won / Lost" subvalue={`${stats.wonLeads} / ${stats.lostLeads}`} icon={<CertificateIcon width={18} height={18} />} tone="emerald" />
        <Stat label="Monthly revenue" value={Math.round(stats.monthlyRevenue)} sublabel="Avg deal value" subvalue={`$${Math.round(stats.avgDealValue).toLocaleString()}`} icon={<CoinIcon width={18} height={18} />} tone="amber" />
      </div>

      <div className="content-grid">
        <div className="panel">
          <div className="panel-header"><h2>Needing attention</h2></div>
          {attentionItems.length === 0 ? (
            <div className="empty-state">Nothing urgent — you're on top of it.</div>
          ) : (
            <ul className="attention-list">
              {attentionItems.map((item, i) => (
                <li key={i} className={'attention-item ' + item.level}>
                  <Link to={item.to}>{item.text}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="panel">
          <div className="panel-header"><h2>Job calendar</h2></div>
          <MiniCalendar markedDates={markedDates} />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-header">
          <h2>Job map</h2>
          <Link className="chip-btn small" to="/map">View full map</Link>
        </div>
        <JobsMap jobs={jobs} onSelectJob={(id) => navigate(`/jobs?job=${id}`)} height={320} />
      </div>

      <div className="panel">
        <div className="panel-header"><h2>Recent jobs</h2></div>
        {jobs.length === 0 ? (
          <div className="empty-state">
            <p>No jobs yet — create your first job to see it here.</p>
            <Link className="primary-btn" to="/jobs?new=1">+ New Job</Link>
          </div>
        ) : (
          <ul className="activity-list">
            {jobs.slice(0, 6).map((job) => (
              <li key={job.id}>
                {job.first_name} {job.last_name} — {job.address_line}, {job.suburb} {job.state}
                <span className="status-pill" style={{ marginLeft: 10 }}>{job.status_label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
