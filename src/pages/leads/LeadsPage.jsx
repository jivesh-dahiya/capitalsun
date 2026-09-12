import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { LEAD_STAGES, LEAD_SOURCES } from './leadConstants';
import { AU_STATES } from '../jobs/jobConstants';
import { CloseIcon, ChatBubbleIcon, PlugIcon } from '../../components/icons';
import { useRealtimeLeads } from '../../lib/useRealtimeLeads';

const emptyForm = {
  firstName: '', lastName: '', email: '', mobile: '',
  addressLine: '', suburb: '', state: 'NSW', postcode: '',
  source: 'Referral', estimatedValue: '', notes: '', nextFollowUpDate: '',
};

export default function LeadsPage() {
  const { company, refreshCompany } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [followUpDrafts, setFollowUpDrafts] = useState({});
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [widgetCopied, setWidgetCopied] = useState(false);
  const [apiCopied, setApiCopied] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const todayIso = new Date().toISOString().slice(0, 10);
  const chatWidgetUrl = company ? `${window.location.origin}/chat/${company.id}` : '';
  const embedSnippet = `<iframe src="${chatWidgetUrl}" style="position:fixed;bottom:24px;right:24px;width:400px;height:640px;border:none;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.2);z-index:9999;" title="Chat"></iframe>`;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const apiCurlExample = company ? `curl -X POST '${supabaseUrl}/rest/v1/rpc/create_lead_via_api' \\
  -H 'apikey: ${supabaseAnonKey}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "p_api_key": "${company.api_key}",
    "p_first_name": "Jane",
    "p_last_name": "Smith",
    "p_email": "jane@example.com",
    "p_mobile": "0412345678",
    "p_address_line": "12 Example St",
    "p_suburb": "Sydney",
    "p_state": "NSW",
    "p_postcode": "2000",
    "p_source": "Website contact form"
  }'` : '';

  async function toggleChatWidget(enabled) {
    await supabase.from('companies').update({ chat_widget_enabled: enabled }).eq('id', company.id);
    await refreshCompany();
  }

  function copyEmbed() {
    navigator.clipboard?.writeText(embedSnippet);
    setWidgetCopied(true);
    setTimeout(() => setWidgetCopied(false), 1600);
  }

  function copyApiExample() {
    navigator.clipboard?.writeText(apiCurlExample);
    setApiCopied(true);
    setTimeout(() => setApiCopied(false), 1600);
  }

  async function regenerateApiKey() {
    if (!window.confirm("Regenerate the API key? Anything still using the old key (your website form, Zapier, etc.) will stop working until it's updated.")) return;
    setRegenerating(true);
    await supabase.from('companies').update({ api_key: crypto.randomUUID() }).eq('id', company.id);
    await refreshCompany();
    setRegenerating(false);
  }

  async function loadLeads() {
    if (!company) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });
    setLeads(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  useRealtimeLeads(company?.id, loadLeads);

  async function moveStage(lead, nextStage) {
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, stage: nextStage } : l)));
    const { error } = await supabase.from('leads').update({ stage: nextStage }).eq('id', lead.id);
    if (error) loadLeads();
  }

  async function logContact(lead) {
    const patch = { last_contacted_at: new Date().toISOString() };
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, ...patch } : l)));
    await supabase.from('leads').update(patch).eq('id', lead.id);
  }

  async function setFollowUp(lead, date) {
    // A native date input reports intermediate values while the year is
    // still being typed (e.g. "275760-08-14" mid-keystroke) — only accept a
    // plausible, fully-typed year rather than persisting every keystroke.
    if (date) {
      const year = Number(date.slice(0, 4));
      if (!year || year < 2000 || year > 2100) return;
    }
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, next_follow_up_date: date || null } : l)));
    await supabase.from('leads').update({ next_follow_up_date: date || null }).eq('id', lead.id);
  }

  function convertToJob(lead) {
    sessionStorage.setItem('leadPrefill', JSON.stringify({
      leadId: lead.id,
      firstName: lead.first_name,
      lastName: lead.last_name,
      email: lead.email ?? '',
      mobile: lead.mobile ?? '',
      addressLine: lead.address_line ?? '',
      suburb: lead.suburb ?? '',
      state: lead.state ?? 'NSW',
      postcode: lead.postcode ?? '',
    }));
    navigate('/jobs?new=1');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await supabase.from('leads').insert({
      company_id: company.id,
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email || null,
      mobile: form.mobile || null,
      address_line: form.addressLine || null,
      suburb: form.suburb || null,
      state: form.state || null,
      postcode: form.postcode || null,
      source: form.source,
      estimated_value: form.estimatedValue ? Number(form.estimatedValue) : null,
      notes: form.notes || null,
      next_follow_up_date: form.nextFollowUpDate || null,
    });
    setForm(emptyForm);
    setShowModal(false);
    loadLeads();
  }

  return (
    <div>
      <div className="topbar">
        <div><h1>Sales Pipeline</h1></div>
        <div className="header-actions">
          {company && (
            <>
              <button type="button" className="icon-btn icon-btn-circle" aria-label="AI chat intake settings" title="AI chat intake" onClick={() => setShowChatSettings(true)}>
                <ChatBubbleIcon width={18} height={18} />
              </button>
              <button type="button" className="icon-btn icon-btn-circle" aria-label="Leads API settings" title="Connect your website" onClick={() => setShowApiSettings(true)}>
                <PlugIcon width={18} height={18} />
              </button>
            </>
          )}
          <button className="primary-btn" onClick={() => setShowModal(true)}>+ New Lead</button>
        </div>
      </div>

      {showChatSettings && company && (
        <div className="modal-backdrop" onClick={() => setShowChatSettings(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>AI chat intake</h2>
              <button type="button" className="icon-btn" aria-label="Close" onClick={() => setShowChatSettings(false)}><CloseIcon /></button>
            </div>
            <p className="help-text" style={{ marginTop: 0 }}>
              Embed this on your website so a visitor gets a guided intake chat any time, day or night — it asks what
              they want installed, their bill, address and contact details, estimates a system size, scores the lead,
              and alerts you here in real time the moment it lands.
            </p>
            <label className="checkbox-row">
              <input type="checkbox" checked={company.chat_widget_enabled} onChange={(e) => toggleChatWidget(e.target.checked)} />
              Chat intake enabled
            </label>
            <label>Standalone link (share directly, or use for testing)
              <div className="share-link-row">
                <input readOnly value={chatWidgetUrl} onFocus={(e) => e.target.select()} />
                <a className="chip-btn" href={chatWidgetUrl} target="_blank" rel="noreferrer">Open</a>
              </div>
            </label>
            <label>Embed code (paste into your website's HTML)
              <div className="share-link-row">
                <input readOnly value={embedSnippet} onFocus={(e) => e.target.select()} />
                <button type="button" className="chip-btn" onClick={copyEmbed}>{widgetCopied ? 'Copied!' : 'Copy'}</button>
              </div>
            </label>
            <div className="inline-note">
              This guided flow asks one question at a time with buttons and simple fields — it doesn't yet understand
              free-typed sentences. That upgrade needs an LLM API key connected on your end; ask when you're ready.
            </div>
          </div>
        </div>
      )}

      {showApiSettings && company && (
        <div className="modal-backdrop" onClick={() => setShowApiSettings(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Connect your website</h2>
              <button type="button" className="icon-btn" aria-label="Close" onClick={() => setShowApiSettings(false)}><CloseIcon /></button>
            </div>
          <p className="help-text" style={{ marginTop: 0 }}>
            If leads already come in through your existing website's contact form or admin page, point that form's
            submit handler (or a Zapier/Make.com webhook, or a WordPress plugin) at this endpoint and they'll land
            straight in this pipeline with a live alert — same as the chat widget, just from your own form instead
            of ours.
          </p>
          <label>API key
            <div className="share-link-row">
              <input readOnly type={showApiKey ? 'text' : 'password'} value={company.api_key} />
              <button type="button" className="chip-btn" onClick={() => setShowApiKey((v) => !v)}>{showApiKey ? 'Hide' : 'Show'}</button>
              <button type="button" className="chip-btn danger" disabled={regenerating} onClick={regenerateApiKey}>
                {regenerating ? 'Regenerating…' : 'Regenerate'}
              </button>
            </div>
          </label>
          <label>Example request
            <textarea readOnly rows={12} className="api-example" value={apiCurlExample} onFocus={(e) => e.target.select()} />
          </label>
          <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
            <button type="button" className="chip-btn" onClick={copyApiExample}>{apiCopied ? 'Copied!' : 'Copy example'}</button>
          </div>
          <div className="inline-note">
            Only <code>p_first_name</code> is required — everything else is optional. Treat this key like a
            password: anyone who has it can create leads in your account, so keep it on your server side (a form's
            backend, a Zapier step) rather than in public front-end code, and regenerate it if it's ever exposed.
          </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="panel empty-state">Loading leads…</div>
      ) : (
        <div className="kanban-board">
          {LEAD_STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage.key);
            return (
              <div className="kanban-column" key={stage.key}>
                <div className="kanban-column-head">
                  <span>{stage.label}</span>
                  <span className="tab-count">{stageLeads.length}</span>
                </div>
                <div className="kanban-cards">
                  {stageLeads.length === 0 && <div className="kanban-empty">No leads here</div>}
                  {stageLeads.map((lead) => (
                    <div className="kanban-card" key={lead.id}>
                      <div className="job-card-name">{lead.first_name} {lead.last_name}</div>
                      {lead.address_line && <div className="muted-label">{lead.suburb}, {lead.state}</div>}
                      <div className="kanban-card-meta">
                        {lead.channel === 'website_chat' && <span className="badge badge-green">AI chat</span>}
                        {lead.channel === 'api' && <span className="badge badge-green">Website form</span>}
                        {lead.source && lead.channel !== 'website_chat' && lead.channel !== 'api' && <span className="badge badge-neutral">{lead.source}</span>}
                        {lead.source && lead.channel === 'api' && <span className="badge badge-neutral">{lead.source}</span>}
                        {lead.estimated_value != null && <span className="badge badge-green">${Number(lead.estimated_value).toLocaleString()}</span>}
                        {lead.lead_score != null && <span className="badge badge-neutral">Score {lead.lead_score}</span>}
                      </div>
                      {lead.estimated_system_kw && (
                        <div className="muted-label">~{lead.estimated_system_kw}kW · {lead.avg_monthly_bill ? `$${lead.avg_monthly_bill}/mo bill` : ''}</div>
                      )}
                      {lead.appointment_at && (
                        <div className="muted-label">Booked: {new Date(lead.appointment_at).toLocaleString()}</div>
                      )}
                      {lead.notes && <p className="kanban-notes">{lead.notes}</p>}
                      <div className="kanban-followup">
                        <span className={'muted-label' + (lead.next_follow_up_date && lead.next_follow_up_date <= todayIso ? ' followup-due' : '')}>
                          {lead.next_follow_up_date ? `Follow up: ${lead.next_follow_up_date}` : 'No follow-up set'}
                        </span>
                        <input
                          type="date"
                          value={followUpDrafts[lead.id] ?? lead.next_follow_up_date ?? ''}
                          onChange={(e) => setFollowUpDrafts((d) => ({ ...d, [lead.id]: e.target.value }))}
                          onBlur={(e) => setFollowUp(lead, e.target.value)}
                        />
                      </div>
                      {lead.last_contacted_at && (
                        <div className="muted-label">Last contacted: {new Date(lead.last_contacted_at).toLocaleDateString()}</div>
                      )}
                      <button type="button" className="chip-btn small" style={{ marginTop: 6, width: '100%' }} onClick={() => logContact(lead)}>
                        Log contact
                      </button>
                      <select className="stage-select" value={lead.stage} onChange={(e) => moveStage(lead, e.target.value)}>
                        {LEAD_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                      {!lead.converted_job_id ? (
                        <button className="chip-btn small" style={{ marginTop: 8, width: '100%' }} onClick={() => convertToJob(lead)}>
                          Convert to job
                        </button>
                      ) : (
                        <div className="muted-label" style={{ marginTop: 8 }}>Converted to job</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <div className="modal-header">
              <h2>New Lead</h2>
              <button type="button" className="icon-btn" aria-label="Close" onClick={() => setShowModal(false)}><CloseIcon /></button>
            </div>
            <div className="field-row">
              <label>First name<input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} required /></label>
              <label>Last name<input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} required /></label>
            </div>
            <div className="field-row">
              <label>Email<input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></label>
              <label>Mobile<input value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))} /></label>
            </div>
            <div className="field-row">
              <label>Address<input value={form.addressLine} onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))} /></label>
              <label>Suburb<input value={form.suburb} onChange={(e) => setForm((f) => ({ ...f, suburb: e.target.value }))} /></label>
            </div>
            <div className="field-row">
              <label>State
                <select value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}>
                  {AU_STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label>Postcode<input value={form.postcode} onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))} /></label>
            </div>
            <div className="field-row">
              <label>Source
                <select value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}>
                  {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label>Estimated value ($)<input type="number" value={form.estimatedValue} onChange={(e) => setForm((f) => ({ ...f, estimatedValue: e.target.value }))} /></label>
            </div>
            <label>Next follow-up date<input type="date" value={form.nextFollowUpDate} onChange={(e) => setForm((f) => ({ ...f, nextFollowUpDate: e.target.value }))} /></label>
            <label>Notes<textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></label>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="primary-btn">Add lead</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
