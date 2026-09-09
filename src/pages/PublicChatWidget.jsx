import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AU_STATES } from './jobs/jobConstants';
import { estimateSystemSizeKw } from '../lib/systemSizing';
import { scoreLead } from '../lib/leadScoring';

const JOB_OPTIONS = [
  { key: 'solar_battery', label: 'Solar + Battery' },
  { key: 'solar_only', label: 'Solar only' },
  { key: 'battery_only', label: 'Battery only' },
  { key: 'not_sure', label: "Not sure yet" },
];

function Bubble({ from, children }) {
  return <div className={`chat-bubble chat-bubble-${from}`}>{children}</div>;
}

export default function PublicChatWidget() {
  const { companyId } = useParams();
  const [company, setCompany] = useState(undefined);
  const [step, setStep] = useState('intro');
  const [transcript, setTranscript] = useState([]);
  const [form, setForm] = useState({
    jobInterest: '', avgMonthlyBill: '', addressLine: '', suburb: '', state: 'NSW', postcode: '',
    firstName: '', lastName: '', mobile: '', email: '', appointmentAt: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [leadId, setLeadId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.rpc('get_company_public_info', { p_company_id: companyId });
      if (error || !data?.length || !data[0].chat_widget_enabled) {
        setCompany(null);
        return;
      }
      setCompany(data[0]);
    }
    load();
  }, [companyId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, step]);

  function say(from, text) {
    setTranscript((prev) => [...prev, { from, text, at: new Date().toISOString() }]);
  }

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function chooseJob(key, label) {
    setForm((f) => ({ ...f, jobInterest: key }));
    say('visitor', label);
    say('bot', "Got it. What's your average monthly electricity bill? (A rough number is fine — this just helps size the system.)");
    setStep('bill');
  }

  function submitBill(e) {
    e.preventDefault();
    say('visitor', form.avgMonthlyBill ? `About $${form.avgMonthlyBill}/month` : "I'm not sure");
    say('bot', "Thanks — and what's the installation address? That lets me give you a size estimate for your area.");
    setStep('address');
  }

  function submitAddress(e) {
    e.preventDefault();
    say('visitor', [form.addressLine, form.suburb, form.state, form.postcode].filter(Boolean).join(', '));
    const size = estimateSystemSizeKw({ avgMonthlyBill: Number(form.avgMonthlyBill), state: form.state });
    if (size) {
      say('bot', `Based on that, you'd likely suit around a ${size}kW system. A specialist will confirm the exact size after seeing your roof. What's your name and best contact number?`);
    } else {
      say('bot', "A specialist will work out the right size for you. What's your name and best contact number?");
    }
    setStep('contact');
  }

  function submitContact(e) {
    e.preventDefault();
    say('visitor', `${form.firstName} ${form.lastName} — ${form.mobile}`);
    say('bot', 'Would you like to book a time for a site visit or call? Pick a date and time that works, or skip for now.');
    setStep('appointment');
  }

  async function finish(withAppointment) {
    setSubmitting(true);
    const size = estimateSystemSizeKw({ avgMonthlyBill: Number(form.avgMonthlyBill), state: form.state });
    const { score } = scoreLead({
      addressLine: form.addressLine,
      avgMonthlyBill: Number(form.avgMonthlyBill),
      jobInterest: form.jobInterest,
      appointmentAt: withAppointment ? form.appointmentAt : null,
      email: form.email,
      mobile: form.mobile,
    });
    const { data, error } = await supabase.rpc('create_lead_from_widget', {
      p_company_id: companyId,
      p_first_name: form.firstName,
      p_last_name: form.lastName || '-',
      p_email: form.email || null,
      p_mobile: form.mobile || null,
      p_address_line: form.addressLine || null,
      p_suburb: form.suburb || null,
      p_state: form.state || null,
      p_postcode: form.postcode || null,
      p_job_interest: form.jobInterest || null,
      p_avg_monthly_bill: form.avgMonthlyBill ? Number(form.avgMonthlyBill) : null,
      p_estimated_system_kw: size,
      p_lead_score: score,
      p_appointment_at: withAppointment && form.appointmentAt ? new Date(form.appointmentAt).toISOString() : null,
      p_chat_transcript: transcript,
    });
    setSubmitting(false);
    if (!error) {
      setLeadId(data);
      say('bot', withAppointment
        ? "You're booked in — we'll see you then! A specialist may also call ahead to confirm."
        : "Thanks! A specialist will reach out shortly to confirm the details.");
      setStep('done');
    }
  }

  if (company === undefined) return <div className="chat-shell"><div className="chat-window">Loading…</div></div>;
  if (company === null) return <div className="chat-shell"><div className="chat-window empty-state">This chat isn't available right now.</div></div>;

  return (
    <div className="chat-shell">
      <div className="chat-window">
        <div className="chat-header">
          {company.logo_url ? <img src={company.logo_url} alt={company.company_name} className="chat-logo" /> : <div className="brand-mark">{(company.company_name || 'C')[0]}</div>}
          <div>
            <div className="chat-company-name">{company.company_name}</div>
            <div className="muted-label">Usually replies instantly</div>
          </div>
        </div>

        <div className="chat-messages">
          {step === 'intro' && transcript.length === 0 && (
            <Bubble from="bot">Hi! What are you looking to install?</Bubble>
          )}
          {transcript.map((m, i) => <Bubble key={i} from={m.from}>{m.text}</Bubble>)}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-area">
          {step === 'intro' && (
            <div className="chat-quick-replies">
              {JOB_OPTIONS.map((o) => (
                <button key={o.key} type="button" className="chip-btn" onClick={() => chooseJob(o.key, o.label)}>{o.label}</button>
              ))}
            </div>
          )}

          {step === 'bill' && (
            <form className="chat-form" onSubmit={submitBill}>
              <input type="number" min="0" placeholder="e.g. 300" value={form.avgMonthlyBill} onChange={update('avgMonthlyBill')} autoFocus />
              <button type="submit" className="primary-btn">Send</button>
            </form>
          )}

          {step === 'address' && (
            <form className="chat-form chat-form-grid" onSubmit={submitAddress}>
              <input placeholder="Street address" value={form.addressLine} onChange={update('addressLine')} required autoFocus />
              <input placeholder="Suburb" value={form.suburb} onChange={update('suburb')} required />
              <select value={form.state} onChange={update('state')}>
                {AU_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <input placeholder="Postcode" value={form.postcode} onChange={update('postcode')} />
              <button type="submit" className="primary-btn">Send</button>
            </form>
          )}

          {step === 'contact' && (
            <form className="chat-form chat-form-grid" onSubmit={submitContact}>
              <input placeholder="First name" value={form.firstName} onChange={update('firstName')} required autoFocus />
              <input placeholder="Last name" value={form.lastName} onChange={update('lastName')} />
              <input placeholder="Mobile" value={form.mobile} onChange={update('mobile')} required />
              <input placeholder="Email (optional)" type="email" value={form.email} onChange={update('email')} />
              <button type="submit" className="primary-btn">Send</button>
            </form>
          )}

          {step === 'appointment' && (
            <form className="chat-form" onSubmit={(e) => { e.preventDefault(); finish(true); }}>
              <input type="datetime-local" value={form.appointmentAt} onChange={update('appointmentAt')} required autoFocus />
              <button type="submit" className="primary-btn" disabled={submitting}>{submitting ? 'Booking…' : 'Book it'}</button>
              <button type="button" className="ghost-btn" disabled={submitting} onClick={() => finish(false)}>Skip for now</button>
            </form>
          )}

          {step === 'done' && (
            <div className="chat-done">
              <span className="readiness-pill ready">Thanks — we've got your details{leadId ? '' : ''}.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
