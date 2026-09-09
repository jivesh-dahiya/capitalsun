import { useEffect, useRef } from 'react';
import L from '../lib/leafletSetup';
import 'leaflet-draw';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

const ESRI_IMAGERY_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_ATTRIBUTION = 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community';

const METERS_PER_DEG_LAT = 111320;
const LOCATOR_HALF_SIZE_M = 18;

export default function RoofDesignMap({ center, faces, drawing, onFaceDrawn, onDrawCancelled, onPanelToggle, height = 520 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef(null);
  const locatorRef = useRef(null);
  const drawHandlerRef = useRef(null);
  const fittedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(
      [center?.lat ?? -25.27, center?.lng ?? 133.77],
      center ? 19 : 4
    );
    // Esri's free imagery layer tops out around zoom 19 for most Australian
    // addresses — zoom 20 often serves a blank "not yet available" tile, which
    // reads as broken/low-quality. maxNativeZoom keeps deeper zoom-ins on the
    // browser upscaling the real zoom-19 tile instead of hitting that gap.
    L.tileLayer(ESRI_IMAGERY_URL, { attribution: ESRI_ATTRIBUTION, maxZoom: 22, maxNativeZoom: 19 }).addTo(map);
    layersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter once, when the address geocode first resolves.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center || fittedRef.current) return;
    map.setView([center.lat, center.lng], 19);
    fittedRef.current = true;
  }, [center]);

  // A light square locator around the geocoded address, so it's easy to spot
  // the right property before drawing — this is a fixed-size visual aid, not
  // a real cadastral/parcel boundary (we don't have that data).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;
    if (locatorRef.current) {
      map.removeLayer(locatorRef.current);
      locatorRef.current = null;
    }
    const dLat = LOCATOR_HALF_SIZE_M / METERS_PER_DEG_LAT;
    const dLng = LOCATOR_HALF_SIZE_M / (METERS_PER_DEG_LAT * Math.cos((center.lat * Math.PI) / 180));
    const bounds = [
      [center.lat - dLat, center.lng - dLng],
      [center.lat + dLat, center.lng + dLng],
    ];
    locatorRef.current = L.rectangle(bounds, {
      color: '#ffffff',
      weight: 2,
      fill: false,
      dashArray: null,
      interactive: false,
    }).addTo(map);
  }, [center]);

  // Toggle the polygon-draw handler on/off.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (drawing) {
      const handler = new L.Draw.Polygon(map, {
        shapeOptions: { color: '#c2410c', weight: 2, fillOpacity: 0.12 },
        showArea: false,
        allowIntersection: false,
        showLength: false,
      });
      handler.enable();
      drawHandlerRef.current = handler;

      const handleCreated = (e) => {
        const latlngs = e.layer.getLatLngs()[0].map((p) => [p.lat, p.lng]);
        onFaceDrawn(latlngs);
      };
      const handleStop = () => {
        if (drawHandlerRef.current) onDrawCancelled?.();
      };
      map.on(L.Draw.Event.CREATED, handleCreated);
      map.on(L.Draw.Event.DRAWSTOP, handleStop);
      return () => {
        map.off(L.Draw.Event.CREATED, handleCreated);
        map.off(L.Draw.Event.DRAWSTOP, handleStop);
        handler.disable();
        drawHandlerRef.current = null;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawing]);

  // Redraw roof outlines + panel rectangles whenever the face data changes.
  useEffect(() => {
    const map = mapRef.current;
    const group = layersRef.current;
    if (!map || !group) return;
    group.clearLayers();

    for (const face of faces) {
      L.polygon(face.latLngs, { color: '#c2410c', weight: 2, fillOpacity: 0.06, dashArray: '4 4' }).addTo(group);
      for (const panel of face.panels) {
        if (face.excludedKeys?.has(panel.key)) continue;
        const rect = L.polygon(panel.corners, {
          color: '#1e293b',
          weight: 1,
          fillColor: '#1d4ed8',
          fillOpacity: 0.55,
        }).addTo(group);
        rect.on('click', () => onPanelToggle(face.id, panel.key));
      }
    }
  }, [faces, onPanelToggle]);

  return <div ref={containerRef} className="roof-design-map" style={{ height }} />;
}
