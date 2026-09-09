import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { buildContractSections } from '../lib/contractTerms';
import { gstFromInclusive } from '../lib/gst';

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function systemHeadline(quote) {
  const parts = [];
  if (quote.system_size_kw) parts.push(`${Number(quote.system_size_kw).toFixed(2)}kW Solar`);
  if (quote.battery_capacity_kwh > 0) parts.push(`${Number(quote.battery_capacity_kwh).toFixed(2)}kWh Battery Storage`);
  return parts.length ? parts.join(' + ') : 'Solar System Proposal';
}

export default function AcceptQuote() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [quote, setQuote] = useState(undefined);
  const [lineItems, setLineItems] = useState([]);
  const [name, setName] = useState('');
  const [termsChecked, setTermsChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [showAcceptForm, setShowAcceptForm] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error: rpcError } = await supabase.rpc('get_quote_by_token', { p_token: token });
      if (rpcError || !data || data.length === 0) {
        setQuote(null);
        return;
      }
      setQuote(data[0]);
      const { data: items } = await supabase.rpc('get_quote_line_items_by_token', { p_token: token });
      setLineItems(items ?? []);
    }
    load();
  }, [token]);

  useEffect(() => {
    if (quote && searchParams.get('print') === '1') {
      setTimeout(() => window.print(), 400);
    }
  }, [quote, searchParams]);

  async function handleAccept(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { error: rpcError } = await supabase.rpc('accept_quote', { p_token: token, p_accepted_by_name: name });
      if (rpcError) throw rpcError;
      setAccepted(true);
    } catch (err) {
      setError(err.message || 'Could not accept this quote.');
    } finally {
      setBusy(false);
    }
  }

  if (quote === undefined) {
    return <div className="proposal-shell"><div className="panel empty-state">Loading proposal…</div></div>;
  }

  if (quote === null) {
    return <div className="proposal-shell"><div className="panel empty-state">This proposal link is invalid or has expired.</div></div>;
  }

  const alreadyDone = quote.status === 'accepted' || accepted;
  const rebateTotal = Number(quote.stc_amount || 0) + Number(quote.bstc_amount || 0);
  const priceAfterRebates = Math.max(0, Number(quote.price) - rebateTotal);
  const retailerName = quote.company_legal_entity_name || quote.company_name;
  const contactLines = [quote.company_address_line, [quote.company_suburb, quote.company_state, quote.company_postcode].filter(Boolean).join(' ')].filter(Boolean);
  const depositPercent = quote.deposit_percent ?? 10;
  const depositAmount = Math.round(priceAfterRebates * depositPercent) / 100;

  const hasSystemDetails = quote.panel_model || quote.inverter_model || quote.battery_model || quote.warranty_years > 0;
  const contractSections = buildContractSections({
    retailerName,
    retailerAbn: quote.company_abn,
    retailerAddress: contactLines.join(', '),
    ownerName: `${quote.first_name} ${quote.last_name}`,
    ownerAddress: `${quote.address_line ?? ''}, ${quote.suburb ?? ''} ${quote.state ?? ''} ${quote.postcode ?? ''}`,
    systemPrice: Number(quote.price),
    stcAmount: rebateTotal,
    totalPrice: priceAfterRebates,
    depositPercent,
    depositAmount,
    warrantyYears: quote.warranty_years,
    state: quote.state,
  });

  return (
    <div className="proposal-shell">
      <div className="proposal-layout">
        <div className="proposal-doc">
          <div className="proposal-header">
            {quote.company_logo_url ? (
              <img src={quote.company_logo_url} alt={retailerName} className="proposal-logo" />
            ) : (
              <div className="brand-mark">{(quote.company_name || 'C')[0]}</div>
            )}
            <div className="proposal-header-text">
              <div className="proposal-company-name">{retailerName}</div>
              {quote.company_abn && <div className="muted-label">ABN: {quote.company_abn}</div>}
            </div>
          </div>

          <div className="proposal-accent-bar" />

          <h1 className="proposal-headline">{systemHeadline(quote)}</h1>

          <div className="proposal-addressed-to">
            <span className="muted-label">Addressed to</span>
            <div className="proposal-customer-name">{quote.first_name} {quote.last_name}</div>
            {quote.mobile && <a href={`tel:${quote.mobile}`}>{quote.mobile}</a>}
            {quote.email && <a href={`mailto:${quote.email}`}>{quote.email}</a>}
            {quote.address_line && (
              <div>{quote.address_line}<br />{quote.suburb} {quote.state} {quote.postcode}</div>
            )}
          </div>

          <div className="proposal-meta">
            {quote.prepared_by_name?.trim() && <div>Prepared by {quote.prepared_by_name} on {formatDate(quote.created_at)}</div>}
            {quote.updated_at && quote.updated_at !== quote.created_at && <div>Last updated {formatDate(quote.updated_at)}</div>}
            {quote.valid_until && <div><strong>Offer valid until {formatDate(quote.valid_until)}</strong></div>}
          </div>

          {quote.estimated_annual_kwh > 0 && (
            <div className="proposal-stat-row">
              <strong>Estimated annual production:</strong> ~{Number(quote.estimated_annual_kwh).toLocaleString()} kWh/year
            </div>
          )}

          {quote.notes && <div className="proposal-notes">{quote.notes}</div>}

          {hasSystemDetails && (
            <div className="proposal-system-details">
              <h3>System Details</h3>
              {quote.panel_model && (
                <div className="proposal-component-row">
                  <span className="muted-label">Panels</span>
                  <span>{quote.panel_manufacturer} {quote.panel_model}{quote.panel_watt ? ` — ${Math.round(quote.panel_watt * 1000)}W each` : ''}{quote.panel_count ? ` × ${quote.panel_count}` : ''}</span>
                </div>
              )}
              {quote.inverter_model && (
                <div className="proposal-component-row">
                  <span className="muted-label">Inverter</span>
                  <span>{quote.inverter_manufacturer} {quote.inverter_model}{quote.inverter_kw ? ` — ${Number(quote.inverter_kw).toFixed(1)}kW` : ''}{quote.inverter_quantity > 1 ? ` × ${quote.inverter_quantity}` : ''}</span>
                </div>
              )}
              {quote.battery_model && (
                <div className="proposal-component-row">
                  <span className="muted-label">Battery</span>
                  <span>{quote.battery_manufacturer} {quote.battery_model}{quote.battery_kwh ? ` — ${Number(quote.battery_kwh).toFixed(2)}kWh` : ''}{quote.battery_quantity > 1 ? ` × ${quote.battery_quantity}` : ''}</span>
                </div>
              )}
              {quote.warranty_years > 0 && (
                <div className="proposal-component-row">
                  <span className="muted-label">Workmanship warranty</span>
                  <span>{quote.warranty_years} years</span>
                </div>
              )}
            </div>
          )}

          {lineItems.length > 0 && (
            <div className="proposal-line-items">
              <h3>Quote</h3>
              <table>
                <thead>
                  <tr><th>Description</th><th>Qty</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {lineItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.description}</td>
                      <td>{item.quantity ?? ''}</td>
                      <td>{item.included ? '(incl.)' : item.unit_price != null && item.quantity != null ? `$${(item.unit_price * item.quantity).toLocaleString()}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(contactLines.length > 0 || quote.company_email || quote.company_mobile || quote.company_website) && (
            <div className="proposal-footer">
              <span className="muted-label">Contact</span>
              {contactLines.map((line) => <div key={line}>{line}</div>)}
              {quote.company_mobile && <div>{quote.company_mobile}</div>}
              {quote.company_email && <div>{quote.company_email}</div>}
              {quote.company_website && <div>{quote.company_website}</div>}
            </div>
          )}

          <details className="detail-section proposal-terms no-print" open={showTerms} onToggle={(e) => setShowTerms(e.target.open)}>
            <summary>Terms &amp; Conditions</summary>
            <div className="detail-section-body">
              <div className="inline-note">
                This is a template contract covering standard NETCC / Australian Consumer Law obligations. It has
                not been reviewed by a lawyer for {retailerName}'s specific business or state — the retailer should
                have it checked before relying on it with real customers.
              </div>
              {contractSections.map((section) => (
                <div key={section.title} className="proposal-terms-section">
                  <h4>{section.title}</h4>
                  {section.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
                  {section.definitions && (
                    <dl>
                      {section.definitions.map(([term, def]) => (
                        <div key={term}><dt>{term}</dt><dd>{def}</dd></div>
                      ))}
                    </dl>
                  )}
                  {section.table && (
                    <ul className="proposal-contacts-list">
                      {section.table.map((c) => <li key={c.region}><strong>{c.region}</strong> — {c.name}: {c.phone}</li>)}
                    </ul>
                  )}
                  {section.paymentTable && (
                    <table>
                      <tbody>
                        {section.paymentTable.map((row) => (
                          <tr key={row.label}><td>{row.label}</td><td>{row.amount != null ? `$${row.amount.toLocaleString()}` : '—'}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          </details>
        </div>

        <div className="proposal-summary panel">
          <span className="muted-label">{retailerName}</span>
          <h3 style={{ marginTop: 4 }}>System Summary</h3>
          <div className="design-summary-row"><span>System price{quote.company_gst_registered ? ' incl. GST' : ''}</span><span>${Number(quote.price).toLocaleString()}</span></div>
          {quote.company_gst_registered && (
            <div className="design-summary-row"><span className="muted-label">Includes GST</span><span className="muted-label">${gstFromInclusive(Number(quote.price)).toLocaleString()}</span></div>
          )}
          {quote.stc_amount > 0 && (
            <div className="design-summary-row"><span>Solar rebate (STCs){quote.stc_count ? ` × ${quote.stc_count}` : ''}</span><span>-${Number(quote.stc_amount).toLocaleString()}</span></div>
          )}
          {quote.bstc_amount > 0 && (
            <div className="design-summary-row"><span>Battery rebate</span><span>-${Number(quote.bstc_amount).toLocaleString()}</span></div>
          )}
          <div className="design-summary-row design-summary-total"><span>Total{quote.company_gst_registered ? ' incl. GST' : ''}</span><span>${priceAfterRebates.toLocaleString()}</span></div>
          <div className="design-summary-row"><span>Deposit ({depositPercent}%)</span><span>${depositAmount.toLocaleString()}</span></div>

          {alreadyDone ? (
            <div className="readiness-pill ready" style={{ marginTop: 16 }}>
              Accepted — we'll be in touch to schedule your installation.
            </div>
          ) : showAcceptForm ? (
            <form onSubmit={handleAccept} className="proposal-accept-form no-print">
              <label className="checkbox-row">
                <input type="checkbox" checked={termsChecked} onChange={(e) => setTermsChecked(e.target.checked)} required />
                I have read and agree to the <button type="button" className="link-btn proposal-terms-link" onClick={() => setShowTerms(true)}>Terms &amp; Conditions</button>
              </label>
              <label>
                Type your full name to sign
                <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
              </label>
              {error && <div className="auth-error">{error}</div>}
              <button className="primary-btn" type="submit" disabled={busy || !termsChecked} style={{ width: '100%' }}>
                {busy ? 'Accepting…' : 'Confirm acceptance'}
              </button>
            </form>
          ) : (
            <button type="button" className="primary-btn proposal-accept-btn no-print" onClick={() => setShowAcceptForm(true)}>
              Accept &amp; Sign
            </button>
          )}

          {quote.prepared_by_name?.trim() && (
            <div className="proposal-prepared-by">
              {quote.prepared_by_name}{quote.prepared_by_mobile ? ` · ${quote.prepared_by_mobile}` : ''}
            </div>
          )}

          <button type="button" className="link-btn no-print" onClick={() => window.print()}>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
