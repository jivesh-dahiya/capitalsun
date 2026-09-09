import { useState } from 'react';
import { CloseIcon } from './icons';

export default function ShareProposalModal({ quote, onClose }) {
  const [copied, setCopied] = useState(false);
  const proposalUrl = `${window.location.origin}/accept/${quote.accept_token}`;
  const subject = `Your solar proposal from us`;
  const body = `Hi ${quote.first_name},\n\nHere's your solar proposal — you can view it, download a PDF, and accept online:\n${proposalUrl}\n\nAny questions, just reply to this email.`;
  const mailtoHref = `mailto:${quote.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  function copyLink() {
    navigator.clipboard?.writeText(proposalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Share proposal — {quote.first_name} {quote.last_name}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><CloseIcon /></button>
        </div>

        <label>Web proposal
          <div className="share-link-row">
            <input readOnly value={proposalUrl} onFocus={(e) => e.target.select()} />
            <button type="button" className="chip-btn" onClick={copyLink}>{copied ? 'Copied!' : 'Copy'}</button>
            <a className="chip-btn" href={proposalUrl} target="_blank" rel="noreferrer">Open</a>
          </div>
        </label>

        <div className="modal-actions" style={{ justifyContent: 'flex-start', marginTop: 18 }}>
          <a className="ghost-btn" href={`${proposalUrl}?print=1`} target="_blank" rel="noreferrer">
            Download PDF
          </a>
          <a className="ghost-btn" href={mailtoHref}>
            Open in email app
          </a>
        </div>

        <div className="inline-note" style={{ marginTop: 18 }}>
          Emailing the customer directly from here isn't wired up yet — that needs a transactional email
          provider connected. "Open in email app" drafts the message in your own mail client instead.
        </div>
      </div>
    </div>
  );
}
