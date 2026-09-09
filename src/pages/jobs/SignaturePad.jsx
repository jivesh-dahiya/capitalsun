import { useRef, useState } from 'react';

export default function SignaturePad({ label, existingDataUrl, onSave }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }

  function start(e) {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
    setHasDrawn(true);
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  function save() {
    onSave(canvasRef.current.toDataURL('image/png'));
  }

  return (
    <div className="signature-block">
      <span className="muted-label">{label}</span>
      {existingDataUrl ? (
        <div className="signature-saved">
          <img src={existingDataUrl} alt={`${label} signature`} />
          <button type="button" className="chip-btn" onClick={() => onSave(null)}>Re-sign</button>
        </div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            width={480}
            height={140}
            className="signature-canvas"
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={start}
            onTouchMove={move}
            onTouchEnd={end}
          />
          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={clear}>Clear</button>
            <button type="button" className="primary-btn" disabled={!hasDrawn} onClick={save}>
              Save signature
            </button>
          </div>
        </>
      )}
    </div>
  );
}
