import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export default function Profile() {
  const { profile, company, refreshCompany } = useAuth();
  const [teammates, setTeammates] = useState([]);
  const [teammatesLoading, setTeammatesLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

  async function loadTeammates() {
    if (!company) return;
    setTeammatesLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('company_id', company.id).order('created_at');
    setTeammates(data ?? []);
    setTeammatesLoading(false);
  }

  useEffect(() => {
    loadTeammates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  async function handleInvite(e) {
    e.preventDefault();
    setInviteError('');
    setInviteSent(false);
    setInviteBusy(true);
    const { data, error } = await supabase.functions.invoke('invite-teammate', {
      body: { email: inviteEmail.trim(), firstName: inviteFirstName.trim(), lastName: inviteLastName.trim() },
    });
    setInviteBusy(false);
    if (error || data?.error) {
      setInviteError(data?.error || error?.message || "Couldn't send the invite.");
      return;
    }
    setInviteEmail('');
    setInviteFirstName('');
    setInviteLastName('');
    setInviteSent(true);
    loadTeammates();
  }
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (company) {
      setForm({
        firstName: profile?.first_name ?? '',
        lastName: profile?.last_name ?? '',
        mobile: profile?.mobile ?? '',
        legalEntityName: company.legal_entity_name ?? '',
        companyName: company.company_name ?? '',
        abn: company.abn ?? '',
        directorName: company.director_name ?? '',
        directorEmail: company.director_email ?? '',
        gstRegistered: company.gst_registered ?? false,
        addressLine: company.address_line ?? '',
        suburb: company.suburb ?? '',
        state: company.state ?? '',
        postcode: company.postcode ?? '',
        defaultStcPrice: company.default_stc_price ?? 35,
        defaultBstcRate: company.default_bstc_rate ?? 250,
        website: company.website ?? '',
        stcAgentName: company.stc_agent_name ?? '',
        stcAgentAbn: company.stc_agent_abn ?? '',
        stcAgentAddress: company.stc_agent_address ?? '',
      });
    }
  }, [company, profile]);

  if (!form) return <div className="panel empty-state">Loading profile…</div>;

  function update(field) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaved(false);
    await Promise.all([
      supabase.from('profiles').update({
        first_name: form.firstName,
        last_name: form.lastName,
        mobile: form.mobile,
      }).eq('id', profile.id),
      supabase.from('companies').update({
        legal_entity_name: form.legalEntityName,
        company_name: form.companyName,
        abn: form.abn,
        director_name: form.directorName,
        director_email: form.directorEmail,
        gst_registered: form.gstRegistered,
        address_line: form.addressLine,
        suburb: form.suburb,
        state: form.state,
        postcode: form.postcode,
        default_stc_price: Number(form.defaultStcPrice) || null,
        default_bstc_rate: Number(form.defaultBstcRate) || null,
        website: form.website || null,
        stc_agent_name: form.stcAgentName || null,
        stc_agent_abn: form.stcAgentAbn || null,
        stc_agent_address: form.stcAgentAddress || null,
      }).eq('id', company.id),
    ]);
    await refreshCompany();
    setSaved(true);
  }

  async function uploadLogo(file) {
    if (!file) return;
    setUploadingLogo(true);
    const ext = file.name.split('.').pop();
    const path = `${company.id}/logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('company-logos').upload(path, file);
    if (!uploadError) {
      const { data } = supabase.storage.from('company-logos').getPublicUrl(path);
      await supabase.from('companies').update({ logo_url: data.publicUrl }).eq('id', company.id);
      await refreshCompany();
    }
    setUploadingLogo(false);
  }

  async function removeLogo() {
    await supabase.from('companies').update({ logo_url: null }).eq('id', company.id);
    await refreshCompany();
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>Update Profile</h1>
        </div>
      </div>

      <form className="panel" onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>Proposal Branding</h2>
        <label>Company logo
          <div className="logo-upload-row">
            {company.logo_url ? (
              <img src={company.logo_url} alt="Company logo" className="logo-preview" />
            ) : (
              <div className="logo-preview logo-preview-empty">No logo</div>
            )}
            <label className="chip-btn upload-btn">
              {uploadingLogo ? 'Uploading…' : company.logo_url ? 'Replace logo' : 'Upload logo'}
              <input type="file" accept="image/*" hidden disabled={uploadingLogo} onChange={(e) => uploadLogo(e.target.files[0])} />
            </label>
            {company.logo_url && (
              <button type="button" className="chip-btn danger" onClick={removeLogo}>Remove</button>
            )}
          </div>
        </label>
        <p className="muted-label" style={{ marginTop: -8, marginBottom: 18 }}>
          Shown at the top of every customer-facing proposal.
        </p>

        <h2>Account Information</h2>
        <div className="field-row">
          <label>
            First name
            <input value={form.firstName} onChange={update('firstName')} />
          </label>
          <label>
            Last name
            <input value={form.lastName} onChange={update('lastName')} />
          </label>
        </div>
        <label>
          Mobile
          <input value={form.mobile} onChange={update('mobile')} />
        </label>

        <h2>Company Information</h2>
        <label>
          Legal entity name
          <input value={form.legalEntityName} onChange={update('legalEntityName')} />
        </label>
        <div className="field-row">
          <label>
            Company (trading) name
            <input value={form.companyName} onChange={update('companyName')} />
          </label>
          <label>
            ABN
            <input value={form.abn} onChange={update('abn')} />
          </label>
        </div>
        <div className="field-row">
          <label>
            Director name
            <input value={form.directorName} onChange={update('directorName')} />
          </label>
          <label>
            Director email
            <input value={form.directorEmail} onChange={update('directorEmail')} />
          </label>
        </div>
        <div className="field-row">
          <label>
            Website (optional)
            <input value={form.website} onChange={update('website')} placeholder="https://example.com.au" />
          </label>
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={form.gstRegistered} onChange={update('gstRegistered')} />
          GST registered
        </label>

        <h2>Address</h2>
        <label>
          Address
          <input value={form.addressLine} onChange={update('addressLine')} />
        </label>
        <div className="field-row">
          <label>
            Suburb
            <input value={form.suburb} onChange={update('suburb')} />
          </label>
          <label>
            State
            <input value={form.state} onChange={update('state')} />
          </label>
          <label>
            Postcode
            <input value={form.postcode} onChange={update('postcode')} />
          </label>
        </div>

        <h2>Rebate Defaults</h2>
        <p className="muted-label" style={{ marginTop: -8, marginBottom: 12 }}>
          Starting assumptions for new quotes — STC prices float daily on the open market, so treat these as your
          own working numbers, not a live feed.
        </p>
        <div className="field-row">
          <label>
            Assumed STC price ($/certificate)
            <input type="number" min="0" step="0.5" value={form.defaultStcPrice} onChange={update('defaultStcPrice')} />
          </label>
          <label>
            Battery rebate rate ($/kWh)
            <input type="number" min="0" step="1" value={form.defaultBstcRate} onChange={update('defaultBstcRate')} />
          </label>
        </div>

        <h2>STC Agent</h2>
        <p className="muted-label" style={{ marginTop: -8, marginBottom: 12 }}>
          The business that receives the assignment of small-scale technology certificates on the STC Assignment
          Form — usually your own business, or an external STC aggregator you work with. Leave blank to use your
          own company name and ABN above.
        </p>
        <div className="field-row">
          <label>
            STC agent / assignee name
            <input value={form.stcAgentName} onChange={update('stcAgentName')} placeholder={form.legalEntityName || form.companyName} />
          </label>
          <label>
            STC agent ABN
            <input value={form.stcAgentAbn} onChange={update('stcAgentAbn')} placeholder={form.abn} />
          </label>
        </div>
        <label>
          STC agent address (optional)
          <input value={form.stcAgentAddress} onChange={update('stcAgentAddress')} />
        </label>

        {saved && <div className="status-pill" style={{ marginBottom: 12 }}>Saved</div>}
        <div className="modal-actions">
          <button type="submit" className="primary-btn">Save changes</button>
        </div>
      </form>

      <div className="panel" style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Team</h2>
        <p className="muted-label" style={{ marginTop: -8, marginBottom: 14 }}>
          Public sign-up is off in production — this is how you add staff. An invited teammate gets an email with a
          link to set their own password and join {company.company_name || 'your company'}.
        </p>

        {teammatesLoading ? (
          <div className="empty-state">Loading team…</div>
        ) : (
          <table style={{ marginBottom: 18 }}>
            <thead><tr><th>Name</th><th>Mobile</th></tr></thead>
            <tbody>
              {teammates.map((t) => (
                <tr key={t.id}>
                  <td>{[t.first_name, t.last_name].filter(Boolean).join(' ') || '—'}{t.id === profile?.id ? ' (you)' : ''}</td>
                  <td>{t.mobile || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <form onSubmit={handleInvite}>
          <div className="field-row">
            <label>First name<input value={inviteFirstName} onChange={(e) => setInviteFirstName(e.target.value)} /></label>
            <label>Last name<input value={inviteLastName} onChange={(e) => setInviteLastName(e.target.value)} /></label>
          </div>
          <label>Email
            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
          </label>
          {inviteError && <div className="auth-error">{inviteError}</div>}
          {inviteSent && <div className="status-pill" style={{ marginBottom: 12 }}>Invite sent</div>}
          <div className="modal-actions">
            <button type="submit" className="primary-btn" disabled={inviteBusy}>{inviteBusy ? 'Sending…' : 'Send invite'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
