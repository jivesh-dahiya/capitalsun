import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { geocodeAddress } from '../../lib/geocode';
import { dominantEdgeAngleDeg, fillPolygonWithPanels } from '../../lib/panelLayout';
import { estimateAnnualKwh, monthlyProductionKwh } from '../../lib/solarProduction';
import { ZONE_RATINGS, ZONE_DEFAULTS_BY_STATE, calculateStcCount, calculateBatteryRebateAmount } from '../../lib/stcCalculator';
import { isPopularPanel } from '../../lib/panelCatalog';
import RoofDesignMap from '../../components/RoofDesignMap';
import Combobox from '../../components/Combobox';
import Section from '../../components/Section';
import { ChevronLeftIcon, CursorIcon, PolygonIcon, TrashIcon, StarIcon } from '../../components/icons';

const CURRENT_YEAR = new Date().getFullYear();
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Physical panel footprint isn't part of the CEC registry (only electrical
// specs are), so layout uses a standard ~2.0m² module size regardless of the
// model chosen — wattage for the system-size math still comes from the real
// selected model.
const PANEL_SIZES = {
  portrait: { widthM: 1.134, heightM: 1.762 },
  landscape: { widthM: 1.762, heightM: 1.134 },
};

const AZIMUTH_OPTIONS = [
  { deg: 0, label: 'North' },
  { deg: 45, label: 'North-East' },
  { deg: 90, label: 'East' },
  { deg: 135, label: 'South-East' },
  { deg: 180, label: 'South' },
  { deg: 225, label: 'South-West' },
  { deg: 270, label: 'West' },
  { deg: 315, label: 'North-West' },
];

const PANEL_TABS = [
  { key: 'design', label: 'In this design' },
  { key: 'favourites', label: 'Favourite panels' },
  { key: 'popular', label: 'Popular panels' },
];

function computeFacePanels(face) {
  const { widthM, heightM } = PANEL_SIZES[face.orientation];
  return fillPolygonWithPanels(face.latLngs, { panelWidthM: widthM, panelHeightM: heightM, rotationDeg: face.rotationDeg });
}

function panelLabel(model) {
  const brand = model.manufacturers?.name ? `${model.manufacturers.name} ` : '';
  const watts = model.power_kw != null ? ` — ${Math.round(Number(model.power_kw) * 1000)}W` : ' — wattage unknown';
  return `${brand}${model.name}${watts}`;
}

function inverterLabel(model) {
  const brand = model.manufacturers?.name ? `${model.manufacturers.name} ` : '';
  const kw = model.power_kw != null ? ` — ${Number(model.power_kw).toFixed(1)}kW AC` : '';
  return `${brand}${model.name}${kw}`;
}

function batteryLabel(model) {
  const brand = model.manufacturers?.name ? `${model.manufacturers.name} ` : '';
  const kwh = model.capacity_kwh != null ? ` — ${Number(model.capacity_kwh).toFixed(2)}kWh` : '';
  return `${brand}${model.name}${kwh}`;
}

// The CEC registry doesn't publish inverter/panel phase or hybrid/PV-only
// classification, so this shows what it does have — series, and AU approval
// (every model in this catalog is CEC-approved for Australia).
function equipmentSubLabel(model) {
  return [model.series, 'AU'].filter(Boolean).join(' · ');
}

export default function QuoteDesignPage() {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const { company, refreshCompany } = useAuth();
  const [quote, setQuote] = useState(null);
  const [center, setCenter] = useState(null);
  const [panelModels, setPanelModels] = useState([]);
  const [selectedPanelId, setSelectedPanelId] = useState('');
  const [panelWattW, setPanelWattW] = useState('');
  const [savingWatt, setSavingWatt] = useState(false);
  const [inverterModels, setInverterModels] = useState([]);
  const [selectedInverterId, setSelectedInverterId] = useState('');
  const [inverterQty, setInverterQty] = useState(1);
  const [batteryModels, setBatteryModels] = useState([]);
  const [selectedBatteryId, setSelectedBatteryId] = useState('');
  const [batteryQty, setBatteryQty] = useState(1);
  const [systemEfficiency, setSystemEfficiency] = useState(0.87);
  const [warrantyYears, setWarrantyYears] = useState(10);
  const [faces, setFaces] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stcZone, setStcZone] = useState(3);
  const [stcPrice, setStcPrice] = useState(35);
  const [installYear, setInstallYear] = useState(CURRENT_YEAR);
  const [bstcRate, setBstcRate] = useState(250);
  const [step, setStep] = useState('roof');
  const [panelTab, setPanelTab] = useState('design');
  const [favouritePanelIds, setFavouritePanelIds] = useState(new Set());

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: quoteRow }, { data: panelRows }, { data: inverterRows }, { data: batteryRows }] = await Promise.all([
        supabase.from('quotes').select('*').eq('id', quoteId).maybeSingle(),
        supabase.from('equipment_models').select('*, manufacturers(name)').eq('category', 'panel').order('name'),
        supabase.from('equipment_models').select('*, manufacturers(name)').eq('category', 'inverter').order('name'),
        supabase.from('equipment_models').select('*, manufacturers(name)').eq('category', 'battery').order('name'),
      ]);
      setQuote(quoteRow ?? null);
      setPanelModels(panelRows ?? []);
      setSelectedPanelId(quoteRow?.panel_model_id ?? '');
      setInverterModels(inverterRows ?? []);
      setSelectedInverterId(quoteRow?.inverter_model_id ?? '');
      setInverterQty(quoteRow?.inverter_quantity ?? 1);
      setBatteryModels(batteryRows ?? []);
      setSelectedBatteryId(quoteRow?.battery_model_id ?? '');
      setBatteryQty(quoteRow?.battery_quantity ?? 1);
      setSystemEfficiency(quoteRow?.design_data?.systemEfficiency ?? 0.87);
      setWarrantyYears(quoteRow?.warranty_years ?? 10);
      setStcZone(quoteRow?.stc_zone ?? ZONE_DEFAULTS_BY_STATE[quoteRow?.state] ?? 3);
      setStcPrice(quoteRow?.stc_price ?? company?.default_stc_price ?? 35);
      setInstallYear(quoteRow?.expected_install_year ?? CURRENT_YEAR);
      setBstcRate(quoteRow?.bstc_rate ?? company?.default_bstc_rate ?? 250);
      setFavouritePanelIds(new Set(company?.favourite_panel_ids ?? []));

      if (quoteRow?.lat != null && quoteRow?.lng != null) {
        setCenter({ lat: quoteRow.lat, lng: quoteRow.lng });
      } else if (quoteRow) {
        const coords = await geocodeAddress({
          addressLine: quoteRow.address_line,
          suburb: quoteRow.suburb,
          state: quoteRow.state,
          postcode: quoteRow.postcode,
        });
        if (coords) setCenter(coords);
      }

      if (quoteRow?.design_data?.faces?.length) {
        const hydrated = quoteRow.design_data.faces.map((f) => {
          const face = { ...f, excludedKeys: new Set(f.excludedKeys ?? []) };
          face.panels = computeFacePanels(face);
          return face;
        });
        setFaces(hydrated);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId, company?.id]);

  useEffect(() => {
    const model = panelModels.find((m) => m.id === selectedPanelId);
    setPanelWattW(model?.power_kw != null ? String(Math.round(Number(model.power_kw) * 1000)) : '');
  }, [selectedPanelId, panelModels]);

  async function saveWattCorrection() {
    const model = panelModels.find((m) => m.id === selectedPanelId);
    if (!model || panelWattW === '') return;
    const kw = Number(panelWattW) / 1000;
    if (kw === Number(model.power_kw)) return;
    setSavingWatt(true);
    await supabase.from('equipment_models').update({ power_kw: kw }).eq('id', selectedPanelId);
    setPanelModels((prev) => prev.map((m) => (m.id === selectedPanelId ? { ...m, power_kw: kw } : m)));
    setSavingWatt(false);
  }

  async function toggleFavouritePanel(modelId) {
    const next = new Set(favouritePanelIds);
    if (next.has(modelId)) next.delete(modelId); else next.add(modelId);
    setFavouritePanelIds(next);
    await supabase.from('companies').update({ favourite_panel_ids: [...next] }).eq('id', company.id);
    refreshCompany?.();
  }

  function handleFaceDrawn(latLngs) {
    const rotationDeg = Math.round(dominantEdgeAngleDeg(latLngs));
    const face = {
      id: crypto.randomUUID(),
      latLngs,
      azimuthDeg: 0,
      tiltDeg: 22,
      rotationDeg,
      orientation: 'portrait',
      excludedKeys: new Set(),
    };
    face.panels = computeFacePanels(face);
    setFaces((prev) => [...prev, face]);
    setDrawing(false);
  }

  function updateFace(faceId, patch) {
    setFaces((prev) => prev.map((f) => {
      if (f.id !== faceId) return f;
      const merged = { ...f, ...patch };
      if (patch.rotationDeg !== undefined || patch.orientation !== undefined) {
        merged.panels = computeFacePanels(merged);
        merged.excludedKeys = new Set();
      }
      return merged;
    }));
  }

  function removeFace(faceId) {
    setFaces((prev) => prev.filter((f) => f.id !== faceId));
  }

  function clearAllFaces() {
    if (faces.length === 0) return;
    if (!window.confirm('Remove all roof faces and panels from this design?')) return;
    setFaces([]);
  }

  function togglePanel(faceId, key) {
    setFaces((prev) => prev.map((f) => {
      if (f.id !== faceId) return f;
      const next = new Set(f.excludedKeys);
      if (next.has(key)) next.delete(key); else next.add(key);
      return { ...f, excludedKeys: next };
    }));
  }

  const faceSummaries = useMemo(
    () => faces.map((f) => ({ ...f, panelCount: f.panels.length - f.excludedKeys.size })),
    [faces]
  );
  const totalPanels = faceSummaries.reduce((s, f) => s + f.panelCount, 0);
  const systemKw = selectedPanelId && panelWattW !== '' ? (totalPanels * Number(panelWattW)) / 1000 : 0;
  const estimatedKwh = estimateAnnualKwh({
    systemKw,
    state: quote?.state,
    faces: faceSummaries.map((f) => ({ panelCount: f.panelCount, azimuthDeg: f.azimuthDeg, tiltDeg: f.tiltDeg })),
    systemEfficiency,
  });
  const monthlyKwh = useMemo(() => monthlyProductionKwh(estimatedKwh, quote?.state), [estimatedKwh, quote?.state]);
  const maxMonthlyKwh = Math.max(1, ...monthlyKwh);
  const stcCount = calculateStcCount({ systemKw, zone: stcZone, installYear });
  const stcAmount = stcCount * Number(stcPrice || 0);
  const selectedInverter = inverterModels.find((m) => m.id === selectedInverterId);
  const inverterAcKw = selectedInverter?.power_kw != null ? Number(selectedInverter.power_kw) * Number(inverterQty || 0) : 0;
  const selectedBattery = batteryModels.find((m) => m.id === selectedBatteryId);
  const batteryCapacityKwh = selectedBattery?.capacity_kwh != null ? Number(selectedBattery.capacity_kwh) * Number(batteryQty || 0) : 0;
  const batteryRebateAmount = calculateBatteryRebateAmount({
    capacityKwh: batteryCapacityKwh,
    ratePerKwh: Number(bstcRate || 0),
  });

  const selectedPanelModel = panelModels.find((m) => m.id === selectedPanelId);
  const panelListForTab = useMemo(() => {
    if (panelTab === 'design') return selectedPanelModel ? [selectedPanelModel] : [];
    if (panelTab === 'favourites') return panelModels.filter((m) => favouritePanelIds.has(m.id));
    return panelModels.filter(isPopularPanel).slice(0, 40);
  }, [panelTab, panelModels, selectedPanelModel, favouritePanelIds]);

  async function handleSave() {
    setSaving(true);
    const designData = {
      systemEfficiency,
      faces: faces.map((f) => ({
        id: f.id,
        latLngs: f.latLngs,
        azimuthDeg: f.azimuthDeg,
        tiltDeg: f.tiltDeg,
        rotationDeg: f.rotationDeg,
        orientation: f.orientation,
        excludedKeys: [...f.excludedKeys],
      })),
    };
    const { error } = await supabase
      .from('quotes')
      .update({
        lat: center?.lat ?? null,
        lng: center?.lng ?? null,
        panel_model_id: selectedPanelId || null,
        system_size_kw: systemKw ? Number(systemKw.toFixed(3)) : null,
        panel_count: totalPanels || null,
        estimated_annual_kwh: estimatedKwh || null,
        design_data: designData,
        inverter_model_id: selectedInverterId || null,
        inverter_quantity: selectedInverterId ? Number(inverterQty) || null : null,
        battery_model_id: selectedBatteryId || null,
        battery_quantity: selectedBatteryId ? Number(batteryQty) || null : null,
        stc_zone: stcZone,
        stc_price: Number(stcPrice) || null,
        expected_install_year: installYear,
        stc_count: stcCount || null,
        stc_amount: stcAmount || null,
        battery_capacity_kwh: batteryCapacityKwh || null,
        bstc_rate: Number(bstcRate) || null,
        bstc_amount: batteryRebateAmount || null,
        warranty_years: warrantyYears ? Number(warrantyYears) : null,
      })
      .eq('id', quoteId);
    setSaving(false);
    if (!error) navigate('/quotes');
  }

  if (loading) return <div className="panel empty-state">Loading design…</div>;
  if (!quote) return <div className="panel empty-state">Quote not found.</div>;

  return (
    <div className="detail-page">
      <div className="topbar">
        <div>
          <button type="button" className="ghost-btn back-link" onClick={() => navigate('/quotes')}>
            <ChevronLeftIcon /> Quotes
          </button>
          <h1>{quote.first_name} {quote.last_name}</h1>
          <div className="muted-label">{quote.address_line}, {quote.suburb} {quote.state} {quote.postcode}</div>
        </div>
        <div className="header-actions">
          <div className="design-step-indicator">
            <span className={step === 'roof' ? 'active' : ''}>1. Roof &amp; Panels</span>
            <span className="design-step-sep">→</span>
            <span className={step === 'system' ? 'active' : ''}>2. System Configuration</span>
          </div>
        </div>
      </div>

      {step === 'roof' && (
        <>
          <div className="design-layout">
            <div className="design-map-col">
              <div className="design-toolbar">
                <div className="design-tool-group">
                  <button
                    type="button"
                    className={'icon-btn-circle' + (!drawing ? ' active' : '')}
                    aria-label="Select / pan"
                    title="Select / pan — click a panel to remove it"
                    onClick={() => setDrawing(false)}
                  >
                    <CursorIcon width={16} height={16} />
                  </button>
                  <button
                    type="button"
                    className={'icon-btn-circle' + (drawing ? ' active' : '')}
                    aria-label="Draw roof face"
                    title="Draw roof face"
                    onClick={() => setDrawing((d) => !d)}
                  >
                    <PolygonIcon width={16} height={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn-circle"
                    aria-label="Clear all roof faces"
                    title="Clear all roof faces"
                    disabled={faces.length === 0}
                    onClick={clearAllFaces}
                  >
                    <TrashIcon width={16} height={16} />
                  </button>
                </div>
                <span className="muted-label">
                  {drawing ? 'Click points around the roof outline, double-click to finish.' : 'Click a placed panel to remove it.'}
                </span>
              </div>
              <div className="design-map-wrap">
                <RoofDesignMap
                  center={center}
                  faces={faceSummaries}
                  drawing={drawing}
                  onFaceDrawn={handleFaceDrawn}
                  onDrawCancelled={() => setDrawing(false)}
                  onPanelToggle={togglePanel}
                />
                <div className="design-panel-counter">Total panels: <strong>{totalPanels}</strong></div>
              </div>
              {!center && <div className="inline-note">Couldn't locate this address on the map yet — you can still draw once it geocodes, or check the address on the Customer Details step.</div>}

              <h3>Roof faces</h3>
              {faceSummaries.length === 0 ? (
                <div className="empty-state">Draw a roof face on the map to place panels.</div>
              ) : (
                faceSummaries.map((face, i) => (
                  <div className="face-card" key={face.id}>
                    <div className="face-card-header">
                      <strong>Face {i + 1}</strong>
                      <button type="button" className="doc-remove" aria-label="Remove face" onClick={() => removeFace(face.id)}>×</button>
                    </div>
                    <div className="muted-label">{face.panelCount} panels{face.excludedKeys.size > 0 ? ` (${face.excludedKeys.size} removed)` : ''}</div>
                    <div className="field-row">
                      <label>Facing
                        <select value={face.azimuthDeg} onChange={(e) => updateFace(face.id, { azimuthDeg: Number(e.target.value) })}>
                          {AZIMUTH_OPTIONS.map((a) => <option key={a.deg} value={a.deg}>{a.label}</option>)}
                        </select>
                      </label>
                      <label>Tilt (°)
                        <input type="number" min="0" max="60" value={face.tiltDeg} onChange={(e) => updateFace(face.id, { tiltDeg: Number(e.target.value) })} />
                      </label>
                    </div>
                    <div className="field-row">
                      <label>Panel orientation
                        <select value={face.orientation} onChange={(e) => updateFace(face.id, { orientation: e.target.value })}>
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Landscape</option>
                        </select>
                      </label>
                      <label>Row angle (°)
                        <input type="number" min="0" max="359" value={face.rotationDeg} onChange={(e) => updateFace(face.id, { rotationDeg: Number(e.target.value) })} />
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="design-side panel">
              <h3 style={{ marginTop: 0 }}>Panel model</h3>
              <Combobox
                value={selectedPanelId}
                onChange={(id) => { setSelectedPanelId(id); setPanelTab('design'); }}
                options={panelModels}
                formatOption={panelLabel}
                subLabel={() => 'AU'}
                placeholder="Search all panels…"
              />
              {selectedPanelId && (
                <label>
                  Panel wattage (W)
                  <input
                    type="number"
                    min="0"
                    value={panelWattW}
                    onChange={(e) => setPanelWattW(e.target.value)}
                    onBlur={saveWattCorrection}
                  />
                </label>
              )}
              {selectedPanelId && panelWattW === '' && (
                <div className="inline-note">
                  The CEC registry doesn't publish panel wattage — enter it from the datasheet, it'll be
                  remembered for this model next time.
                </div>
              )}
              {savingWatt && <div className="muted-label">Saving…</div>}

              <div className="panel-tab-strip">
                {PANEL_TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={'panel-tab-item' + (panelTab === t.key ? ' active' : '')}
                    onClick={() => setPanelTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="panel-list">
                {panelListForTab.length === 0 && (
                  <div className="empty-state">
                    {panelTab === 'design' && 'No panel selected yet — search above or pick one from Popular panels.'}
                    {panelTab === 'favourites' && 'No favourite panels yet — star a panel to save it here.'}
                    {panelTab === 'popular' && 'No popular-brand panels found in the catalog.'}
                  </div>
                )}
                {panelListForTab.map((m) => (
                  <div key={m.id} className={'panel-list-row' + (m.id === selectedPanelId ? ' selected' : '')}>
                    <button type="button" className="panel-list-select" onClick={() => { setSelectedPanelId(m.id); }}>
                      <span className="panel-list-title">{panelLabel(m)}</span>
                      <span className="panel-list-sub">{equipmentSubLabel(m)}</span>
                    </button>
                    <button
                      type="button"
                      className={'panel-star-btn' + (favouritePanelIds.has(m.id) ? ' active' : '')}
                      aria-label={favouritePanelIds.has(m.id) ? 'Remove from favourites' : 'Add to favourites'}
                      onClick={() => toggleFavouritePanel(m.id)}
                    >
                      <StarIcon width={15} height={15} fill={favouritePanelIds.has(m.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                ))}
              </div>
              {panelTab === 'popular' && (
                <div className="inline-note">A shortlist of well-known panel brands in the Australian market — not live sales-ranking data.</div>
              )}
            </div>
          </div>

          <div className="save-bar">
            <span className="muted-label">{totalPanels} panels{systemKw ? ` · ${systemKw.toFixed(2)} kW DC` : ''}</span>
            <button type="button" className="primary-btn" onClick={() => setStep('system')}>
              Continue to System Configuration →
            </button>
          </div>
        </>
      )}

      {step === 'system' && (
        <>
          <div className="design-layout design-layout-system">
            <div className="design-side panel">
              <h3 style={{ marginTop: 0 }}>Inverter</h3>
              <Combobox
                value={selectedInverterId}
                onChange={setSelectedInverterId}
                options={inverterModels}
                formatOption={inverterLabel}
                subLabel={equipmentSubLabel}
                placeholder="Type to search…"
              />
              {selectedInverterId && (
                <label>Quantity
                  <input type="number" min="1" value={inverterQty} onChange={(e) => setInverterQty(e.target.value)} />
                </label>
              )}
              {inverterAcKw > 0 && <div className="muted-label">Total AC output: {inverterAcKw.toFixed(2)} kW</div>}

              <h3>Battery storage</h3>
              <Combobox
                value={selectedBatteryId}
                onChange={setSelectedBatteryId}
                options={batteryModels}
                formatOption={batteryLabel}
                subLabel={equipmentSubLabel}
                placeholder="Type to search…"
              />
              {selectedBatteryId && (
                <label>Quantity
                  <input type="number" min="1" value={batteryQty} onChange={(e) => setBatteryQty(e.target.value)} />
                </label>
              )}
              {batteryCapacityKwh > 0 && <div className="muted-label">Total capacity: {batteryCapacityKwh.toFixed(2)} kWh</div>}

              <h3>System efficiency</h3>
              <label>
                Derate for inverter/cable losses, shading and dirt (%)
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={Math.round(systemEfficiency * 100)}
                  onChange={(e) => setSystemEfficiency(Math.min(100, Math.max(50, Number(e.target.value))) / 100)}
                />
              </label>

              <h3>Warranty</h3>
              <label>
                Workmanship warranty (years)
                <input type="number" min="0" value={warrantyYears} onChange={(e) => setWarrantyYears(e.target.value)} />
              </label>

              <Section title="Rebates (STC / battery)" defaultOpen={Boolean(stcCount || batteryRebateAmount)}>
                <div className="field-row">
                  <label>STC zone
                    <select value={stcZone} onChange={(e) => setStcZone(Number(e.target.value))}>
                      {Object.entries(ZONE_RATINGS).map(([z, rating]) => (
                        <option key={z} value={z}>Zone {z} ({rating})</option>
                      ))}
                    </select>
                  </label>
                  <label>Expected install year
                    <input type="number" min={CURRENT_YEAR} max="2030" value={installYear} onChange={(e) => setInstallYear(Number(e.target.value))} />
                  </label>
                </div>
                <label>Assumed STC price ($/certificate)
                  <input type="number" min="0" step="0.5" value={stcPrice} onChange={(e) => setStcPrice(e.target.value)} />
                </label>
                <div className="inline-note">
                  Default zone is a starting point for {quote?.state ?? 'this state'} — confirm the exact zone for this
                  postcode against the CER's official list. STC prices float daily on the open market; this is your
                  own assumption, not a live quote.
                </div>
                <label>Battery rebate rate ($/kWh)
                  <input type="number" min="0" step="1" value={bstcRate} onChange={(e) => setBstcRate(e.target.value)} />
                </label>
                {batteryCapacityKwh > 0 ? (
                  <div className="inline-note">
                    Using {batteryCapacityKwh.toFixed(2)} kWh from the battery selected above. The federal battery
                    rebate scheme is newer and its parameters change more often — treat this as a rough estimate and
                    verify current figures before quoting a customer.
                  </div>
                ) : (
                  <div className="muted-label">Select a battery above to estimate a battery rebate.</div>
                )}
              </Section>
            </div>

            <div className="design-side panel">
              <h3 style={{ marginTop: 0 }}>Monthly production estimate</h3>
              {estimatedKwh > 0 ? (
                <div className="production-chart">
                  {monthlyKwh.map((kwh, i) => (
                    <div className="production-bar-col" key={i}>
                      <div className="production-bar-track">
                        <div className="production-bar" style={{ height: `${Math.max(4, (kwh / maxMonthlyKwh) * 100)}%` }} title={`${MONTH_LABELS[i]}: ${kwh.toLocaleString()} kWh`} />
                      </div>
                      <span className="production-bar-label">{MONTH_LABELS[i]}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Add roof faces and a panel model to see a production estimate.</div>
              )}
              <div className="inline-note">
                Modelled from the annual estimate using a typical Southern Hemisphere seasonal curve for
                {' '}{quote?.state ?? 'this state'} — a planning estimate, not a certified irradiance simulation.
              </div>

              <div className="design-summary">
                <div className="design-summary-row"><span>Total panels</span><span>{totalPanels}</span></div>
                <div className="design-summary-row"><span>System size (DC)</span><span>{systemKw ? `${systemKw.toFixed(2)} kW` : '—'}</span></div>
                {inverterAcKw > 0 && <div className="design-summary-row"><span>Inverter (AC)</span><span>{inverterAcKw.toFixed(2)} kW</span></div>}
                {batteryCapacityKwh > 0 && <div className="design-summary-row"><span>Battery storage</span><span>{batteryCapacityKwh.toFixed(2)} kWh</span></div>}
                <div className="design-summary-row"><span>Est. annual production</span><span>{estimatedKwh ? `${estimatedKwh.toLocaleString()} kWh` : '—'}</span></div>
                <div className="design-summary-row"><span>STCs</span><span>{stcCount ? `${stcCount} × $${stcPrice} = $${stcAmount.toLocaleString()}` : '—'}</span></div>
                {batteryRebateAmount > 0 && (
                  <div className="design-summary-row"><span>Battery rebate (est.)</span><span>${batteryRebateAmount.toLocaleString()}</span></div>
                )}
                <div className="design-summary-row design-summary-total"><span>Total rebates</span><span>${(stcAmount + batteryRebateAmount).toLocaleString()}</span></div>
                <div className="muted-label" style={{ marginTop: 6 }}>
                  Approximate — based on regional average solar yield, not a certified irradiance simulation.
                </div>
              </div>
            </div>
          </div>

          <div className="save-bar">
            <button type="button" className="ghost-btn" onClick={() => setStep('roof')}>← Back to roof design</button>
            <button type="button" className="primary-btn" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : 'Save design to quote'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
