/* ============================================
   CSV Parser — reads spots.csv from disk
   No dependencies, pure JS
   ============================================ */

function parseCSVFile(csvText) {
  const allRows = [];
  let current = '';
  let inQuotes = false;
  let row = [];

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(current);
        current = '';
      } else if (char === '\n' || (char === '\r' && next === '\n')) {
        row.push(current);
        current = '';
        if (char === '\r') i++;
        allRows.push(row);
        row = [];
      } else {
        current += char;
      }
    }
  }

  row.push(current);
  if (row.length > 0 && !(row.length === 1 && row[0].trim() === '')) {
    allRows.push(row);
  }

  if (allRows.length < 2) return [];

  const headers = allRows[0];
  const spots = [];

  for (let i = 1; i < allRows.length; i++) {
    const r = allRows[i];
    if (r.length < headers.length || (r.length === 1 && r[0].trim() === '')) continue;

    const spot = {};
    for (let j = 0; j < headers.length; j++) {
      spot[headers[j].trim()] = (r[j] || '').trim();
    }
    spots.push(spot);
  }

  return spots;
}

async function loadSpots() {
  try {
    const resp = await fetch('data/spots.csv?_=' + Date.now());
    if (!resp.ok) throw new Error('Failed to load spots.csv');
    const text = await resp.text();
    return parseCSVFile(text);
  } catch (err) {
    console.error('Error loading CSV:', err);
    return [];
  }
}
