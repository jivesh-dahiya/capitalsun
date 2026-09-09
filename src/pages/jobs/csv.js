function escapeCell(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function downloadCsv(filename, columns, rows) {
  const header = columns.map((c) => c.label).join(',');
  const lines = rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(','));
  const csv = [header, ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const JOB_EXPORT_COLUMNS = [
  { label: 'Name', value: (j) => `${j.first_name} ${j.last_name}` },
  { label: 'Address', value: (j) => j.address_line },
  { label: 'Suburb', value: (j) => j.suburb },
  { label: 'State', value: (j) => j.state },
  { label: 'Postcode', value: (j) => j.postcode },
  { label: 'Stage', value: (j) => j.stage },
  { label: 'Status', value: (j) => j.job_status },
  { label: 'Installation date', value: (j) => j.installation_date },
];

export const STC_EXPORT_COLUMNS = [
  { label: 'Name', value: (j) => `${j.first_name} ${j.last_name}` },
  { label: 'Address', value: (j) => j.address_line },
  { label: 'Suburb', value: (j) => j.suburb },
  { label: 'State', value: (j) => j.state },
  { label: 'Postcode', value: (j) => j.postcode },
  { label: 'Installation date', value: (j) => j.installation_date },
  { label: 'System size (kW)', value: (j) => j.system_size_kw },
  { label: 'STC count', value: (j) => j.stc_count },
  { label: 'STC price per', value: (j) => j.stc_price_per },
  { label: 'STC amount', value: (j) => j.stc_amount },
  { label: 'STC paid', value: (j) => (j.stc_paid ? 'Yes' : 'No') },
];

export const BSTC_EXPORT_COLUMNS = [
  { label: 'Name', value: (j) => `${j.first_name} ${j.last_name}` },
  { label: 'Address', value: (j) => j.address_line },
  { label: 'Suburb', value: (j) => j.suburb },
  { label: 'State', value: (j) => j.state },
  { label: 'Postcode', value: (j) => j.postcode },
  { label: 'Installation date', value: (j) => j.installation_date },
  { label: 'BSTC count', value: (j) => j.bstc_count },
  { label: 'BSTC price per', value: (j) => j.bstc_price_per },
  { label: 'BSTC amount', value: (j) => j.bstc_amount },
  { label: 'BSTC paid', value: (j) => (j.bstc_paid ? 'Yes' : 'No') },
];
