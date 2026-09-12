import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export default function Profile() {
  const { profile, company, subscription, refreshCompany } = useAuth();
  const [teammates, setTeammates] = useState([]);
  const [teammatesLoading, setTeammatesLoading] = useState(true);
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingError, setBillingError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [teamActionError, setTeamActionError] = useState('');
  const [teamActionBusyId, setTeamActionBusyId] = useState(null);
  const canManageTeam = profile?.role === 'owner' || profile?.role === 'admin';

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
      body: { email: inviteEmail.trim(), firstName: inviteFirstName.trim(), lastName: inviteLastName.trim(), role: inviteRole },
    });
    setInviteBusy(false);
    if (error || data?.error) {
      setInviteError(data?.error || error?.message || "Couldn't send the invite.");
      return;
    }
    setInviteEmail('');
    setInviteFirstName('');
    setInviteLastName('');
    setInviteRole('member');
    setInviteSent(true);
    loadTeammates();
  }

  async function changeRole(teammateId, role) {
    setTeamActionError('');
    setTeamActionBusyId(teammateId);
    const { error } = await supabase.from('profiles').update({ role }).eq('id', teammateId);
    setTeamActionBusyId(null);
    if (error) {
      setTeamActionError(error.message);
      return;
    }
    loadTeammates();
  }

  async function openBillingPortal() {
    setBillingError('');
    setBillingBusy(true);
    const { data, error } = await supabase.functions.invoke('create-billing-portal-session', { body: {} });
    setBillingBusy(false);
    if (error || data?.error) {
      setBillingError(data?.error || error?.message || "Couldn't open billing.");
      return;
    }
    window.location.href = data.url;
  }

  async function removeTeammate(teammate) {
    const name = [teammate.first_name, teammate.last_name].filter(Boolean).join(' ') || 'this teammate';
    if (!window.confirm(`Remove ${name} from your team? They'll lose access immediately.`)) return;
    setTeamActionError('');
    setTeamActionBusyId(teammate.id);
    const { data, error } = await supabase.functions.invoke('remove-teammate', {
      body: { userId: teammate.id },
    });
    setTeamActionBusyId(null);
    if (error || data?.error) {
      setTeamActionError(data?.error || error?.message || "Couldn't remove that teammate.");
      return;
    }
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
        <p className="help-text" style={{ marginTop: -8, marginBottom: 18 }}>
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
        <p className="help-text" style={{ marginTop: -8, marginBottom: 12 }}>
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
        <p className="help-text" style={{ marginTop: -8, marginBottom: 12 }}>
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
        <h2 style={{ marginTop: 0 }}>Billing</h2>
        {subscription ? (
          <>
            <p className="help-text" style={{ marginTop: -8, marginBottom: 14 }}>
              {subscription.plans?.name || subscription.plan_id} plan
              {subscription.plans?.seat_limit != null ? ` — up to ${subscription.plans.seat_limit} seats` : ' — unlimited seats'}
              {subscription.billing_cycle ? `, billed ${subscription.billing_cycle}` : ''}.{' '}
              <span className={'badge ' + (subscription.status === 'active' ? 'badge-green' : subscription.status === 'trialing' ? 'badge-amber' : subscription.status === 'past_due' ? 'badge-amber' : 'badge-neutral')}>
                {subscription.status === 'trialing' && subscription.trial_end
                  ? `trial — ${Math.max(0, Math.ceil((new Date(subscription.trial_end) - new Date()) / 86400000))} day(s) left`
                  : subscription.status}
              </span>
            </p>
            {billingError && <div className="auth-error">{billingError}</div>}
            {canManageTeam ? (
              <button type="button" className="chip-btn" disabled={billingBusy} onClick={openBillingPortal}>
                {billingBusy ? 'Opening…' : 'Manage billing'}
              </button>
            ) : (
              <p className="help-text" style={{ margin: 0 }}>Only an owner or admin can manage billing.</p>
            )}
          </>
        ) : (
          <p className="help-text" style={{ margin: 0 }}>No billing information yet.</p>
        )}
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Team</h2>
        <p className="help-text" style={{ marginTop: -8, marginBottom: 14 }}>
          Public sign-up is off in production — this is how you add staff. An invited teammate gets an email with a
          link to set their own password and join {company.company_name || 'your company'}.
          {!canManageTeam && ' Only an owner or admin can invite, promote, or remove teammates.'}
        </p>

        {teamActionError && <div className="auth-error" style={{ marginBottom: 12 }}>{teamActionError}</div>}

        {teammatesLoading ? (
          <div className="empty-state">Loading team…</div>
        ) : (
          <table style={{ marginBottom: 18 }}>
            <thead><tr><th>Name</th><th>Mobile</th><th>Role</th>{canManageTeam && <th></th>}</tr></thead>
            <tbody>
              {teammates.map((t) => {
                const isSelf = t.id === profile?.id;
                const busy = teamActionBusyId === t.id;
                return (
                  <tr key={t.id}>
                    <td>{[t.first_name, t.last_name].filter(Boolean).join(' ') || '—'}{isSelf ? ' (you)' : ''}</td>
                    <td>{t.mobile || '—'}</td>
                    <td>
                      {canManageTeam && t.role !== 'owner' && !isSelf ? (
                        <select value={t.role} disabled={busy} onChange={(e) => changeRole(t.id, e.target.value)} style={{ padding: '3px 6px' }}>
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={'badge ' + (t.role === 'owner' ? 'badge-amber' : t.role === 'admin' ? 'badge-green' : 'badge-neutral')}>
                          {t.role === 'owner' ? 'Owner' : t.role === 'admin' ? 'Admin' : 'Member'}
                        </span>
                      )}
                    </td>
                    {canManageTeam && (
                      <td>
                        {t.role !== 'owner' && !isSelf && (
                          <button type="button" className="doc-remove" aria-label="Remove teammate" disabled={busy} onClick={() => removeTeammate(t)}>×</button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {canManageTeam && (
          <form onSubmit={handleInvite}>
            <div className="field-row">
              <label>First name<input value={inviteFirstName} onChange={(e) => setInviteFirstName(e.target.value)} /></label>
              <label>Last name<input value={inviteLastName} onChange={(e) => setInviteLastName(e.target.value)} /></label>
            </div>
            <div className="field-row">
              <label>Email
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
              </label>
              <label>Role
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </div>
            {inviteError && <div className="auth-error">{inviteError}</div>}
            {inviteSent && <div className="status-pill" style={{ marginBottom: 12 }}>Invite sent</div>}
            <div className="modal-actions">
              <button type="submit" className="primary-btn" disabled={inviteBusy}>{inviteBusy ? 'Sending…' : 'Send invite'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
