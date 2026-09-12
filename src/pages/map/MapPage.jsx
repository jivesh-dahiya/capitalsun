import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useRealtimeJobs } from '../../lib/useRealtimeJobs';
import JobsMap from '../../components/JobsMap';
import { STAGES } from '../jobs/jobConstants';
import { geocodeAddress } from '../../lib/geocode';

const LEGEND = [
  { label: 'Site inspection / Planner', color: 'var(--sky)' },
  { label: 'In progress / Submitted', color: 'var(--primary)' },
  { label: 'Needs attention', color: 'var(--amber)' },
  { label: 'Complete / Approved', color: 'var(--success)' },
  { label: 'Cancelled / Failed', color: 'var(--danger)' },
];

export default function MapPage() {
  const { company } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);

  const loadJobs = useCallback(async () => {
    if (!company) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('jobs')
      .select('id, first_name, last_name, address_line, suburb, state, postcode, stage, lat, lng')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });
    setJobs(data ?? []);
    setLoading(false);
  }, [company]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useRealtimeJobs(company?.id, loadJobs);

  async function retryGeocode(job) {
    setRetrying(job.id);
    const coords = await geocodeAddress({
      addressLine: job.address_line,
      suburb: job.suburb,
      state: job.state,
      postcode: job.postcode,
    });
    if (coords) {
      await supabase.from('jobs').update({ lat: coords.lat, lng: coords.lng }).eq('id', job.id);
      loadJobs();
    }
    setRetrying(null);
  }

  const unmapped = jobs.filter((j) => j.lat == null || j.lng == null);

  return (
    <div>
      <div className="topbar">
        <div><h1>Job Map</h1></div>
      </div>

      {loading ? (
        <div className="panel empty-state">Loading map…</div>
      ) : (
        <>
          <div className="panel">
            <JobsMap jobs={jobs} onSelectJob={(id) => navigate(`/jobs?job=${id}`)} height={520} />
            <div className="map-legend">
              {LEGEND.map((l) => (
                <span className="map-legend-item" key={l.label}>
                  <span className="map-legend-dot" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>

          {unmapped.length > 0 && (
            <div className="panel" style={{ marginTop: 14 }}>
              <div className="panel-header"><h2>Not shown on map ({unmapped.length})</h2></div>
              <p className="help-text" style={{ marginBottom: 10 }}>
                These addresses couldn't be located automatically. Try again, or check the address on the job.
              </p>
              <ul className="unmapped-list">
                {unmapped.map((j) => (
                  <li key={j.id}>
                    <span>{j.first_name} {j.last_name} — {j.address_line || 'No address'}, {j.suburb} {j.state}</span>
                    <button className="chip-btn small" disabled={retrying === j.id} onClick={() => retryGeocode(j)}>
                      {retrying === j.id ? 'Locating…' : 'Retry'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
