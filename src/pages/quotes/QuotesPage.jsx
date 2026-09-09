import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { AU_STATES } from '../jobs/jobConstants';
import { CloseIcon } from '../../components/icons';
import Section from '../../components/Section';
import ShareProposalModal from '../../components/ShareProposalModal';
import QuoteLineItemsModal from '../../components/QuoteLineItemsModal';
import { ZONE_RATINGS, ZONE_DEFAULTS_BY_STATE, calculateStcCount } from '../../lib/stcCalculator';

const CURRENT_YEAR = new Date().getFullYear();

const emptyForm = {
  firstName: '', lastName: '', email: '', mobile: '',
  addressLine: '', suburb: '', state: 'NSW', postcode: '',
  systemSizeKw: '', panelCount: '', price: '', notes: '', leadId: '',
  stcZone: ZONE_DEFAULTS_BY_STATE.NSW, stcPrice: 35, installYear: CURRENT_YEAR,
};

const STATUS_LABEL = { draft: 'Draft', sent: 'Sent', accepted: 'Accepted', rejected: 'Rejected' };

export default function QuotesPage() {
  const { company, profile } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [sharingQuote, setSharingQuote] = useState(null);
  const [pricingQuote, setPricingQuote] = useState(null);

  async function loadData() {
    if (!company) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: quoteRows }, { data: leadRows }] = await Promise.all([
      supabase.from('quotes').select('*').eq('company_id', company.id).order('created_at', { ascending: false }),
      supabase.from('leads').select('id, first_name, last_name').eq('company_id', company.id).is('converted_job_id', null),
    ]);
    setQuotes(quoteRows ?? []);
    setLeads(leadRows ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  const liveStcCount = useMemo(
    () => calculateStcCount({ systemKw: Number(form.systemSizeKw) || 0, zone: form.stcZone, installYear: form.installYear }),
    [form.systemSizeKw, form.stcZone, form.installYear]
  );
  const liveStcAmount = liveStcCount * Number(form.stcPrice || 0);

  function openNewQuoteModal() {
    setForm({ ...emptyForm, stcPrice: company?.default_stc_price ?? 35 });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 14);
    await supabase.from('quotes').insert({
      company_id: company.id,
      created_by: profile?.id || null,
      valid_until: validUntil.toISOString().slice(0, 10),
      lead_id: form.leadId || null,
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email || null,
      mobile: form.mobile || null,
      address_line: form.addressLine || null,
      suburb: form.suburb || null,
      state: form.state || null,
      postcode: form.postcode || null,
      system_size_kw: form.systemSizeKw ? Number(form.systemSizeKw) : null,
      panel_count: form.panelCount ? Number(form.panelCount) : null,
      price: form.price ? Number(form.price) : 0,
      notes: form.notes || null,
      stc_zone: form.stcZone,
      stc_price: Number(form.stcPrice) || null,
      expected_install_year: form.installYear,
      stc_count: liveStcCount || null,
      stc_amount: liveStcAmount || null,
    });
    setForm(emptyForm);
    setShowModal(false);
    loadData();
  }

  async function markSent(quote) {
    await supabase.from('quotes').update({ status: 'sent' }).eq('id', quote.id);
    loadData();
  }


  return (
    <div>
      <div className="topbar">
        <div><h1>Quotes</h1></div>
        <div className="header-actions">
          <button className="primary-btn" onClick={openNewQuoteModal}>+ New Quote</button>
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <div className="empty-state">Loading quotes…</div>
        ) : quotes.length === 0 ? (
          <div className="empty-state">No quotes yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>System</th>
                <th>Rebates</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td>{q.first_name} {q.last_name}<div className="muted-label">{q.suburb} {q.state}</div></td>
                  <td>
                    {q.system_size_kw ?? '-'} kW{q.panel_count ? ` · ${q.panel_count} panels` : ''}
                    {q.estimated_annual_kwh && <div className="muted-label">~{q.estimated_annual_kwh.toLocaleString()} kWh/yr</div>}
                  </td>
                  <td>
                    {q.stc_count ? <>{q.stc_count} STCs · ${Number(q.stc_amount).toLocaleString()}</> : '-'}
                    {q.bstc_amount > 0 && <div className="muted-label">+${Number(q.bstc_amount).toLocaleString()} battery</div>}
                  </td>
                  <td>${Number(q.price).toLocaleString()}</td>
                  <td><span className={'badge ' + (q.status === 'accepted' ? 'badge-green' : q.status === 'rejected' ? 'badge-amber' : 'badge-neutral')}>{STATUS_LABEL[q.status]}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Link className="chip-btn small" to={`/quotes/${q.id}/design`}>Design system</Link>
                      <button className="chip-btn small" onClick={() => setPricingQuote(q)}>Pricing</button>
                      {q.status === 'draft' && <button className="chip-btn small" onClick={() => markSent(q)}>Mark as sent</button>}
                      {(q.status === 'sent' || q.status === 'accepted') && (
                        <button className="chip-btn small" onClick={() => setSharingQuote(q)}>Share proposal</button>
                      )}
                      {q.created_job_id && <Link className="chip-btn small" to={`/jobs?job=${q.created_job_id}`}>View job</Link>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <div className="modal-header">
              <h2>New Quote</h2>
              <button type="button" className="icon-btn" aria-label="Close" onClick={() => setShowModal(false)}><CloseIcon /></button>
            </div>
            {leads.length > 0 && (
              <label>Link to lead (optional)
                <select value={form.leadId} onChange={(e) => setForm((f) => ({ ...f, leadId: e.target.value }))}>
                  <option value="">No linked lead</option>
                  {leads.map((l) => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}
                </select>
              </label>
            )}
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
                <select
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value, stcZone: ZONE_DEFAULTS_BY_STATE[e.target.value] ?? f.stcZone }))}
                >
                  {AU_STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label>Postcode<input value={form.postcode} onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))} /></label>
            </div>
            <div className="field-row">
              <label>System size (kW)<input type="number" step="0.001" value={form.systemSizeKw} onChange={(e) => setForm((f) => ({ ...f, systemSizeKw: e.target.value }))} /></label>
              <label>Panel count<input type="number" value={form.panelCount} onChange={(e) => setForm((f) => ({ ...f, panelCount: e.target.value }))} /></label>
            </div>
            <label>Price ($)<input type="number" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required /></label>

            <Section title={liveStcCount ? `STC rebate — ${liveStcCount} × $${form.stcPrice} = $${liveStcAmount.toLocaleString()}` : 'STC rebate'} defaultOpen={false}>
              <div className="field-row">
                <label>Zone
                  <select value={form.stcZone} onChange={(e) => setForm((f) => ({ ...f, stcZone: Number(e.target.value) }))}>
                    {Object.entries(ZONE_RATINGS).map(([z, rating]) => (
                      <option key={z} value={z}>Zone {z} ({rating})</option>
                    ))}
                  </select>
                </label>
                <label>Expected install year
                  <input type="number" min={CURRENT_YEAR} max="2030" value={form.installYear} onChange={(e) => setForm((f) => ({ ...f, installYear: Number(e.target.value) }))} />
                </label>
              </div>
              <label>Assumed STC price ($/certificate)
                <input type="number" min="0" step="0.5" value={form.stcPrice} onChange={(e) => setForm((f) => ({ ...f, stcPrice: e.target.value }))} />
              </label>
              <div className="inline-note">
                Default zone is a starting point for the selected state — confirm the exact zone for this postcode
                against the CER's official list. For a full system design with panel layout and battery rebates, use
                Design system instead.
              </div>
            </Section>

            <label>Notes / terms<textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></label>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="primary-btn">Save quote</button>
            </div>
          </form>
        </div>
      )}

      {sharingQuote && (
        <ShareProposalModal quote={sharingQuote} onClose={() => setSharingQuote(null)} />
      )}

      {pricingQuote && (
        <QuoteLineItemsModal
          quote={pricingQuote}
          companyId={company.id}
          gstRegistered={company.gst_registered}
          onClose={() => setPricingQuote(null)}
          onSaved={() => {
            setPricingQuote(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
