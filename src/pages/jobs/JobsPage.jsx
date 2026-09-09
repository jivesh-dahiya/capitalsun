import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { STAGES, JOB_STATUSES, JOB_TYPES, AU_STATES } from './jobConstants';
import JobModal from './JobModal';
import SignJobModal from './SignJobModal';
import EquipmentForm from './EquipmentForm';
import { downloadCsv, JOB_EXPORT_COLUMNS, STC_EXPORT_COLUMNS, BSTC_EXPORT_COLUMNS } from './csv';
import { CloseIcon } from '../../components/icons';
import { withViewTransition } from '../../lib/viewTransition';
import { useRealtimeJobs } from '../../lib/useRealtimeJobs';

export default function JobsPage() {
  const { company } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [installers, setInstallers] = useState([]);
  const [equipmentByJob, setEquipmentByJob] = useState({});
  const [documentsByJob, setDocumentsByJob] = useState({});
  const [uploadingJobId, setUploadingJobId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState('in_progress');
  const [showModal, setShowModal] = useState(false);
  const [signingJob, setSigningJob] = useState(null);
  const [equipmentJob, setEquipmentJob] = useState(null);
  const [filters, setFilters] = useState({ installerId: '', state: '', status: '', search: '' });
  const [commentDrafts, setCommentDrafts] = useState({});
  const [savedFlash, setSavedFlash] = useState({});
  const tabRefs = useRef({});
  const jobCardRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightJobId, setHighlightJobId] = useState(null);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowModal(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const jobId = searchParams.get('job');
    if (!jobId || jobs.length === 0) return;
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      setActiveStage(job.stage);
      setHighlightJobId(jobId);
      setTimeout(() => jobCardRefs.current[jobId]?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
      setTimeout(() => setHighlightJobId(null), 2200);
    }
    const next = new URLSearchParams(searchParams);
    next.delete('job');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, searchParams]);

  useLayoutEffect(() => {
    const el = tabRefs.current[activeStage];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeStage, jobs.length]);

  useEffect(() => {
    function handleResize() {
      const el = tabRefs.current[activeStage];
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeStage]);

  async function loadData() {
    if (!company) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: jobRows }, { data: installerRows }, { data: equipmentRows }, { data: documentRows }] = await Promise.all([
      supabase
        .from('jobs')
        .select('*, installers!jobs_installer_id_fkey(first_name, last_name)')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false }),
      supabase.from('installers').select('*').eq('company_id', company.id),
      supabase
        .from('job_equipment')
        .select('*, manufacturers(name), equipment_models(name), jobs!inner(company_id)')
        .eq('jobs.company_id', company.id),
      supabase.from('job_documents').select('*').eq('company_id', company.id).order('uploaded_at', { ascending: false }),
    ]);
    setJobs(jobRows ?? []);
    setInstallers(installerRows ?? []);
    const grouped = {};
    for (const item of equipmentRows ?? []) {
      (grouped[item.job_id] ??= []).push(item);
    }
    setEquipmentByJob(grouped);
    const docGrouped = {};
    for (const doc of documentRows ?? []) {
      (docGrouped[doc.job_id] ??= []).push(doc);
    }
    setDocumentsByJob(docGrouped);
    setLoading(false);
  }

  async function uploadDocument(job, file) {
    if (!file) return;
    setUploadingJobId(job.id);
    const path = `${company.id}/${job.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('job-documents').upload(path, file);
    if (!uploadError) {
      await supabase.from('job_documents').insert({
        company_id: company.id,
        job_id: job.id,
        file_name: file.name,
        storage_path: path,
      });
      await loadData();
    }
    setUploadingJobId(null);
  }

  async function downloadDocument(doc) {
    const { data } = await supabase.storage.from('job-documents').createSignedUrl(doc.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  async function deleteDocument(doc) {
    await supabase.storage.from('job-documents').remove([doc.storage_path]);
    await supabase.from('job_documents').delete().eq('id', doc.id);
    loadData();
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  useRealtimeJobs(company?.id, loadData);

  const stageCounts = useMemo(() => {
    const counts = {};
    for (const stage of STAGES) counts[stage.key] = 0;
    for (const job of jobs) counts[job.stage] = (counts[job.stage] ?? 0) + 1;
    return counts;
  }, [jobs]);

  const visibleJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (job.stage !== activeStage) return false;
      if (filters.installerId && job.installer_id !== filters.installerId) return false;
      if (filters.state && job.state !== filters.state) return false;
      if (filters.status && job.job_status !== filters.status) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const haystack = `${job.first_name} ${job.last_name} ${job.address_line ?? ''} ${job.po_number ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [jobs, activeStage, filters]);

  async function moveStage(job, nextStage) {
    const statusLabel = STAGES.find((s) => s.key === nextStage)?.label.toUpperCase();
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, stage: nextStage, status_label: statusLabel } : j)));
    const { error } = await supabase
      .from('jobs')
      .update({ stage: nextStage, status_label: statusLabel })
      .eq('id', job.id);
    if (error) loadData();
  }

  async function changeStatus(job, nextStatus) {
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, job_status: nextStatus } : j)));
    const { error } = await supabase.from('jobs').update({ job_status: nextStatus }).eq('id', job.id);
    if (error) loadData();
  }

  async function setInstallationDate(job, date) {
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, installation_date: date || null } : j)));
    const { error } = await supabase.from('jobs').update({ installation_date: date || null }).eq('id', job.id);
    if (error) loadData();
  }

  async function saveComment(job) {
    const comments = commentDrafts[job.id] ?? job.comments ?? '';
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, comments } : j)));
    const { error } = await supabase.from('jobs').update({ comments }).eq('id', job.id);
    if (error) {
      loadData();
      return;
    }
    setSavedFlash((prev) => ({ ...prev, [job.id]: true }));
    setTimeout(() => setSavedFlash((prev) => ({ ...prev, [job.id]: false })), 1400);
  }

  async function saveSignature(job, field, timestampField, dataUrl) {
    const patch = { [field]: dataUrl, [timestampField]: dataUrl ? new Date().toISOString() : null };
    await supabase.from('jobs').update(patch).eq('id', job.id);
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, ...patch } : j)));
    setSigningJob((prev) => (prev && prev.id === job.id ? { ...prev, ...patch } : prev));
  }

  function exportCsv(columns, suffix) {
    downloadCsv(`jobs-${activeStage}-${suffix}.csv`, columns, visibleJobs);
  }

  const jobTypeLabel = (key) => JOB_TYPES.find((t) => t.key === key)?.label ?? key;

  function getReadiness(job) {
    const checks = [
      { label: 'Contact details', done: Boolean(job.email || job.mobile) },
      { label: 'Installer assigned', done: Boolean(job.installer_id) },
      { label: 'Equipment recorded', done: (equipmentByJob[job.id] ?? []).length > 0 },
      { label: 'Customer signature', done: Boolean(job.customer_signature) },
      { label: 'Installer signature', done: Boolean(job.installer_signature) },
    ];
    return { checks, done: checks.filter((c) => c.done).length, total: checks.length };
  }

  const installerWorkload = useMemo(() => {
    const map = {};
    for (const job of jobs) {
      if (!job.installer_id) continue;
      if (['cancelled', 'approved', 'complete'].includes(job.stage)) continue;
      map[job.installer_id] = (map[job.installer_id] ?? 0) + 1;
    }
    return map;
  }, [jobs]);

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Job Pipeline</h1>
        </div>
        <div className="header-actions">
          <button className="ghost-btn" onClick={() => exportCsv(JOB_EXPORT_COLUMNS, 'all')}>Download jobs</button>
          <button className="ghost-btn" onClick={() => exportCsv(STC_EXPORT_COLUMNS, 'stc')}>STC CSV</button>
          <button className="ghost-btn" onClick={() => exportCsv(BSTC_EXPORT_COLUMNS, 'bstc')}>BSTC CSV</button>
          <button
            className="primary-btn"
            style={!showModal ? { viewTransitionName: 'job-modal-morph' } : undefined}
            onClick={() => withViewTransition(() => setShowModal(true))}
          >
            + New Job
          </button>
        </div>
      </div>

      <div className="tab-strip">
        <span
          className="tab-indicator"
          style={{ transform: `translateX(${indicator.left}px) scaleX(${indicator.width})` }}
        />
        {STAGES.map((stage) => (
          <button
            key={stage.key}
            ref={(el) => { tabRefs.current[stage.key] = el; }}
            className={'tab-item' + (activeStage === stage.key ? ' active' : '')}
            onClick={() => setActiveStage(stage.key)}
          >
            {stage.label}
            {stageCounts[stage.key] > 0 && <span className="tab-count">{stageCounts[stage.key]}</span>}
          </button>
        ))}
      </div>

      <div className="panel filter-bar">
        <select value={filters.installerId} onChange={(e) => setFilters((f) => ({ ...f, installerId: e.target.value }))}>
          <option value="">Filter by installer</option>
          {installers.map((i) => (
            <option key={i.id} value={i.id}>{i.first_name} {i.last_name}</option>
          ))}
        </select>
        <select value={filters.state} onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))}>
          <option value="">Filter by state</option>
          {AU_STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">Filter by status</option>
          {JOB_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <input
          placeholder="Search name, address, PO#"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
      </div>

      {loading ? (
        <div className="panel empty-state">Loading jobs…</div>
      ) : visibleJobs.length === 0 ? (
        <div className="panel empty-state">No jobs in this stage yet.</div>
      ) : (
        <div className="job-list">
          <div className="job-list-header">
            <span>Customer</span>
            <span>Contact</span>
            <span>Rebate details</span>
            <span>Date &amp; status</span>
            <span>Actions</span>
          </div>
          {visibleJobs.map((job) => {
            const readiness = getReadiness(job);
            return (
            <div
              className={'panel job-card' + (highlightJobId === job.id ? ' highlighted' : '')}
              key={job.id}
              ref={(el) => { jobCardRefs.current[job.id] = el; }}
            >
              <div className="job-card-grid">
                <div>
                  <div className="job-card-name">{job.first_name} {job.last_name}</div>
                  <div className="muted-label">{jobTypeLabel(job.job_type)}</div>
                  <div className={'readiness-pill' + (readiness.done === readiness.total ? ' ready' : '')} title={readiness.checks.filter((c) => !c.done).map((c) => c.label).join(', ')}>
                    {readiness.done === readiness.total ? 'Ready to submit' : `${readiness.done}/${readiness.total} ready`}
                  </div>
                  {readiness.done < readiness.total && (
                    <div className="readiness-missing">
                      Needs: {readiness.checks.filter((c) => !c.done).map((c) => c.label).join(', ')}
                    </div>
                  )}
                  {job.installers && (
                    <div className="job-installer">
                      {job.installers.first_name} {job.installers.last_name}
                    </div>
                  )}
                  {job.po_number && <div className="muted-label">PO# {job.po_number}</div>}
                  <div className="signature-status">
                    <span className={job.customer_signature ? 'badge badge-green' : 'badge badge-amber'}>
                      Customer {job.customer_signature ? 'signed' : 'unsigned'}
                    </span>
                    <span className={job.installer_signature ? 'badge badge-green' : 'badge badge-amber'}>
                      Installer {job.installer_signature ? 'signed' : 'unsigned'}
                    </span>
                    <span className={job.designer_signature ? 'badge badge-green' : 'badge badge-amber'}>
                      Designer {job.designer_signature ? 'signed' : 'unsigned'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="muted-label">Contact</div>
                  <div>{job.address_line}</div>
                  <div>{job.suburb} {job.state} {job.postcode}</div>
                  <div>{job.mobile}</div>
                </div>

                <div>
                  <div className="stc-card">
                    <span className="badge badge-green">STC</span>
                    <div>Size: {job.system_size_kw ?? '-'} kW</div>
                    <div>Count: {job.stc_count ?? '-'}</div>
                    <div>Amount: ${job.stc_amount ?? '0.00'}</div>
                    <span className={'badge ' + (job.stc_paid ? 'badge-green' : 'badge-amber')}>
                      {job.stc_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                  <div className="stc-card">
                    <span className="badge badge-orange">BSTC</span>
                    <div>Count: {job.bstc_count ?? '-'}</div>
                    <div>Amount: ${job.bstc_amount ?? '0.00'}</div>
                    <span className={'badge ' + (job.bstc_paid ? 'badge-green' : 'badge-amber')}>
                      {job.bstc_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="muted-label">Installation date</div>
                  <input
                    type="date"
                    className="date-input"
                    value={job.installation_date ?? ''}
                    onChange={(e) => setInstallationDate(job, e.target.value)}
                  />
                  <select
                    className="status-select"
                    value={job.job_status}
                    onChange={(e) => changeStatus(job, e.target.value)}
                  >
                    {JOB_STATUSES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="job-actions">
                  <select
                    className="stage-select"
                    value={job.stage}
                    onChange={(e) => moveStage(job, e.target.value)}
                  >
                    {STAGES.map((s) => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                  <Link className="chip-btn" to={`/jobs/${job.id}`}>Open</Link>
                  <button className="chip-btn" onClick={() => setSigningJob(job)}>Sign job</button>
                  <button className="chip-btn danger" onClick={() => moveStage(job, 'cancelled')}>Cancel</button>
                </div>
              </div>

              <div className="equipment-summary">
                {(equipmentByJob[job.id] ?? []).length === 0 ? (
                  <span className="muted-label">No equipment recorded</span>
                ) : (
                  (equipmentByJob[job.id] ?? []).map((item) => (
                    <span key={item.id} className="badge badge-neutral">
                      {item.category}: {item.manufacturers?.name} {item.equipment_models?.name} ×{item.quantity}
                    </span>
                  ))
                )}
                <button type="button" className="chip-btn small" onClick={() => setEquipmentJob(job)}>Edit equipment</button>
              </div>

              <div className="documents-summary">
                {(documentsByJob[job.id] ?? []).length === 0 ? (
                  <span className="muted-label">No documents or photos</span>
                ) : (
                  (documentsByJob[job.id] ?? []).map((doc) => (
                    <span key={doc.id} className="badge badge-neutral doc-badge">
                      <button type="button" onClick={() => downloadDocument(doc)}>{doc.file_name}</button>
                      <button type="button" className="doc-remove" aria-label="Delete document" onClick={() => deleteDocument(doc)}>×</button>
                    </span>
                  ))
                )}
                <label className="chip-btn small upload-btn">
                  {uploadingJobId === job.id ? 'Uploading…' : '+ Upload'}
                  <input
                    type="file"
                    hidden
                    disabled={uploadingJobId === job.id}
                    onChange={(e) => uploadDocument(job, e.target.files[0])}
                  />
                </label>
              </div>

              <div className="comment-box-wrap">
                <textarea
                  className="comment-box"
                  placeholder="Leave comments for this job"
                  value={commentDrafts[job.id] ?? job.comments ?? ''}
                  onChange={(e) => setCommentDrafts((d) => ({ ...d, [job.id]: e.target.value }))}
                  onBlur={() => saveComment(job)}
                />
                <span className={'save-flash' + (savedFlash[job.id] ? ' show' : '')}>Saved</span>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {showModal && company && (
        <JobModal
          companyId={company.id}
          installers={installers}
          installerWorkload={installerWorkload}
          existingJobs={jobs}
          morphName="job-modal-morph"
          onClose={() => withViewTransition(() => setShowModal(false))}
          onCreated={() => {
            setShowModal(false);
            loadData();
          }}
        />
      )}

      {signingJob && (
        <SignJobModal
          job={signingJob}
          onClose={() => setSigningJob(null)}
          onSign={(field, timestampField, dataUrl) => saveSignature(signingJob, field, timestampField, dataUrl)}
        />
      )}

      {equipmentJob && (
        <div className="modal-backdrop" onClick={() => setEquipmentJob(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Equipment — {equipmentJob.first_name} {equipmentJob.last_name}</h2>
              <button type="button" className="icon-btn" aria-label="Close" onClick={() => setEquipmentJob(null)}><CloseIcon /></button>
            </div>
            <EquipmentForm
              jobId={equipmentJob.id}
              existingEquipment={equipmentByJob[equipmentJob.id] ?? []}
              onDone={() => {
                setEquipmentJob(null);
                loadData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
