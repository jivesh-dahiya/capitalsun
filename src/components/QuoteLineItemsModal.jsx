import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CloseIcon } from './icons';
import { gstFromInclusive, exGstFromInclusive } from '../lib/gst';

function emptyRow() {
  return { id: crypto.randomUUID(), description: '', quantity: '1', unitPrice: '', included: false };
}

export default function QuoteLineItemsModal({ quote, companyId, gstRegistered, onClose, onSaved }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('quote_line_items')
        .select('*')
        .eq('quote_id', quote.id)
        .order('sort_order');
      if (data?.length) {
        setRows(data.map((r) => ({
          id: r.id,
          description: r.description,
          quantity: r.quantity ?? '',
          unitPrice: r.unit_price ?? '',
          included: r.included,
        })));
      } else {
        setRows([{ ...emptyRow(), description: 'System supply and installation', quantity: '1', unitPrice: quote.price || '' }]);
      }
      setLoading(false);
    }
    load();
  }, [quote.id, quote.price]);

  function updateRow(id, patch) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const total = rows.reduce((sum, r) => {
    if (r.included || !r.quantity || !r.unitPrice) return sum;
    return sum + Number(r.quantity) * Number(r.unitPrice);
  }, 0);

  async function handleSave() {
    setSaving(true);
    await supabase.from('quote_line_items').delete().eq('quote_id', quote.id);
    const validRows = rows.filter((r) => r.description.trim());
    if (validRows.length) {
      await supabase.from('quote_line_items').insert(
        validRows.map((r, i) => ({
          company_id: companyId,
          quote_id: quote.id,
          description: r.description,
          quantity: r.quantity ? Number(r.quantity) : null,
          unit_price: r.unitPrice ? Number(r.unitPrice) : null,
          included: r.included,
          sort_order: i,
        }))
      );
    }
    await supabase.from('quotes').update({ price: total }).eq('id', quote.id);
    setSaving(false);
    onSaved();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card line-items-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Pricing — {quote.first_name} {quote.last_name}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><CloseIcon /></button>
        </div>

        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : (
          <>
            <div className="line-items-list">
              {rows.map((row) => (
                <div className="line-item-row" key={row.id}>
                  <input
                    placeholder="Description"
                    value={row.description}
                    onChange={(e) => updateRow(row.id, { description: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={row.quantity}
                    onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Unit price"
                    disabled={row.included}
                    value={row.unitPrice}
                    onChange={(e) => updateRow(row.id, { unitPrice: e.target.value })}
                  />
                  <label className="checkbox-row line-item-included">
                    <input type="checkbox" checked={row.included} onChange={(e) => updateRow(row.id, { included: e.target.checked })} />
                    Incl.
                  </label>
                  <button type="button" className="doc-remove" aria-label="Remove line" onClick={() => removeRow(row.id)}>×</button>
                </div>
              ))}
            </div>
            <button type="button" className="chip-btn small" onClick={addRow}>+ Add line item</button>

            <div className="design-summary" style={{ marginTop: 18 }}>
              {gstRegistered && (
                <>
                  <div className="design-summary-row"><span>Subtotal (excl. GST)</span><span>${exGstFromInclusive(total).toLocaleString()}</span></div>
                  <div className="design-summary-row"><span>GST (10%)</span><span>${gstFromInclusive(total).toLocaleString()}</span></div>
                </>
              )}
              <div className="design-summary-row design-summary-total"><span>Total{gstRegistered ? ' incl. GST' : ''}</span><span>${total.toLocaleString()}</span></div>
            </div>

            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={onClose}>Cancel</button>
              <button type="button" className="primary-btn" disabled={saving} onClick={handleSave}>
                {saving ? 'Saving…' : 'Save pricing'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
