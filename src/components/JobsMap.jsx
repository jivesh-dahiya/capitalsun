import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const STAGE_COLOR = {
  site_inspection: 'var(--sky)',
  in_progress: 'var(--primary)',
  missed: 'var(--danger)',
  parking_lot: 'var(--muted)',
  complete: 'var(--success)',
  submitted: 'var(--primary)',
  information_requested: 'var(--amber)',
  waiting_for_approval: 'var(--amber)',
  resubmitted: 'var(--amber)',
  failed: 'var(--danger)',
  cannot_trade: 'var(--danger)',
  approved: 'var(--success)',
  cancelled: 'var(--muted)',
  planner: 'var(--sky)',
};

function markerIcon(color) {
  return L.divIcon({
    className: 'map-marker',
    html: `<span style="background:${color}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function JobsMap({ jobs, onSelectJob, height = 420 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([-25.27, 133.77], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const located = jobs.filter((j) => j.lat != null && j.lng != null);
    located.forEach((job) => {
      const marker = L.marker([job.lat, job.lng], { icon: markerIcon(STAGE_COLOR[job.stage] ?? 'var(--muted)') }).addTo(map);
      marker.bindTooltip(
        `<strong>${job.first_name} ${job.last_name}</strong><br/>${job.address_line ?? ''}, ${job.suburb ?? ''} ${job.state ?? ''}<br/><span style="text-transform:capitalize">${job.stage.replace(/_/g, ' ')}</span>`,
        { direction: 'top', offset: [0, -8] }
      );
      if (onSelectJob) {
        marker.on('click', () => onSelectJob(job.id));
      }
      markersRef.current.push(marker);
    });

    if (located.length > 0) {
      const bounds = L.latLngBounds(located.map((j) => [j.lat, j.lng]));
      map.fitBounds(bounds.pad(0.35), { maxZoom: 10 });
    } else {
      map.setView([-25.27, 133.77], 4);
    }
  }, [jobs, onSelectJob]);

  return <div ref={containerRef} className="jobs-map" style={{ height }} />;
}
