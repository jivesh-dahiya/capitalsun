import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Combobox from '../../components/Combobox';

const CATEGORIES = [
  { key: 'panel', label: 'Panels' },
  { key: 'inverter', label: 'Inverter' },
  { key: 'battery', label: 'Battery' },
];

function emptyRows() {
  return { panel: { manufacturerId: '', modelId: '', quantity: '' }, inverter: { manufacturerId: '', modelId: '', quantity: '' }, battery: { manufacturerId: '', modelId: '', quantity: '' } };
}

function modelLabel(model) {
  if (model.power_kw != null) return `${model.name} — ${Number(model.power_kw)} kW`;
  if (model.capacity_kwh != null) return `${model.name} — ${Number(model.capacity_kwh)} kWh`;
  return model.name;
}

// The CEC registry doesn't publish phase or hybrid/PV-only classification, so
// this shows what it does have — series (inverters/batteries only), and AU
// approval (every model in this catalog is CEC-approved for Australia).
function modelSubLabel(model) {
  return [model.series, 'AU'].filter(Boolean).join(' · ');
}

export default function EquipmentForm({ jobId, existingEquipment, onDone, onSkip }) {
  const [manufacturers, setManufacturers] = useState([]);
  const [modelsByManufacturer, setModelsByManufacturer] = useState({});
  const [loadingModels, setLoadingModels] = useState({});
  const [rows, setRows] = useState(emptyRows());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from('manufacturers').select('*').order('name').then(({ data }) => setManufacturers(data ?? []));
  }, []);

  useEffect(() => {
    if (!existingEquipment?.length) return;
    setRows((prev) => {
      const next = { ...prev };
      for (const item of existingEquipment) {
        next[item.category] = {
          manufacturerId: item.manufacturer_id ?? '',
          modelId: item.model_id ?? '',
          quantity: item.quantity ?? '',
        };
      }
      return next;
    });
  }, [existingEquipment]);

  // Fetch a manufacturer's models on demand — the full CEC catalog has ~13,000
  // models, so loading it all upfront would be wasteful. This runs whenever a
  // row's manufacturer is set, whether by the user or by an existing-equipment prefill.
  useEffect(() => {
    const wanted = Object.values(rows)
      .map((r) => r.manufacturerId)
      .filter((id) => id && !modelsByManufacturer[id] && !loadingModels[id]);
    if (wanted.length === 0) return;

    setLoadingModels((prev) => {
      const next = { ...prev };
      wanted.forEach((id) => { next[id] = true; });
      return next;
    });

    wanted.forEach((manufacturerId) => {
      supabase
        .from('equipment_models')
        .select('*')
        .eq('manufacturer_id', manufacturerId)
        .order('name')
        .then(({ data }) => {
          setModelsByManufacturer((prev) => ({ ...prev, [manufacturerId]: data ?? [] }));
          setLoadingModels((prev) => ({ ...prev, [manufacturerId]: false }));
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  function updateRow(category, field, value) {
    setRows((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
        ...(field === 'manufacturerId' ? { modelId: '' } : {}),
      },
    }));
  }

  async function handleSave() {
    setBusy(true);
    await supabase.from('job_equipment').delete().eq('job_id', jobId);
    const inserts = CATEGORIES.filter((c) => rows[c.key].modelId && rows[c.key].quantity).map((c) => ({
      job_id: jobId,
      category: c.key,
      manufacturer_id: rows[c.key].manufacturerId,
      model_id: rows[c.key].modelId,
      quantity: Number(rows[c.key].quantity),
    }));
    if (inserts.length > 0) {
      await supabase.from('job_equipment').insert(inserts);
    }
    setBusy(false);
    onDone();
  }

  return (
    <div>
      {CATEGORIES.map((category) => {
        const manuOptions = manufacturers.filter((m) => m.category === category.key);
        const row = rows[category.key];
        const modelOptions = modelsByManufacturer[row.manufacturerId] ?? [];
        return (
          <div key={category.key} className="equipment-row">
            <span className="muted-label">{category.label}</span>
            <div className="field-row">
              <label>
                Manufacturer
                <Combobox
                  value={row.manufacturerId}
                  onChange={(id) => updateRow(category.key, 'manufacturerId', id)}
                  options={manuOptions}
                  placeholder="Type to search…"
                />
              </label>
              <label>
                Model
                <Combobox
                  value={row.modelId}
                  onChange={(id) => updateRow(category.key, 'modelId', id)}
                  options={modelOptions}
                  formatOption={modelLabel}
                  subLabel={modelSubLabel}
                  placeholder={loadingModels[row.manufacturerId] ? 'Loading models…' : row.manufacturerId ? 'Type to search…' : 'Select a manufacturer first'}
                  disabled={!row.manufacturerId || loadingModels[row.manufacturerId]}
                />
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  min="0"
                  value={row.quantity}
                  onChange={(e) => updateRow(category.key, 'quantity', e.target.value)}
                />
              </label>
            </div>
          </div>
        );
      })}

      <div className="modal-actions">
        {onSkip && <button type="button" className="ghost-btn" onClick={onSkip}>Skip for now</button>}
        <button type="button" className="primary-btn" disabled={busy} onClick={handleSave}>
          {busy ? 'Saving…' : 'Save equipment'}
        </button>
      </div>
    </div>
  );
}
