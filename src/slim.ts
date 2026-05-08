type Row = Record<string, unknown>;

export function slim(data: Row | Row[], map: Record<string, string>): Row | Row[] {
  if (Array.isArray(data)) return data.map(row => slimOne(row, map));
  return slimOne(data, map);
}

function slimOne(row: Row, map: Record<string, string>): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    out[map[k] ?? k] = v;
  }
  return out;
}
