const normalizeHeader = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const parseRows = (source) => {
  const text = source.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && char === ',') {
      row.push(cell);
      cell = '';
    } else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      if (row.some((part) => part.trim())) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (quoted) throw new Error('The CSV has an unfinished quoted field.');
  row.push(cell);
  if (row.some((part) => part.trim())) rows.push(row);
  return rows;
};

const parseDate = (value) => {
  const raw = value.trim();
  let parts = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (parts) return `${parts[1]}-${parts[2].padStart(2, '0')}-${parts[3].padStart(2, '0')}`;

  parts = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (parts) return `${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  return '';
};

export const parseTransactionsCsv = (source, trips = []) => {
  const rows = parseRows(source);
  if (rows.length < 2) throw new Error('The CSV needs a header row and at least one transaction.');

  const headers = rows[0].map(normalizeHeader);
  const findColumn = (...candidates) => headers.findIndex((header) => candidates.includes(header));
  const dateColumn = findColumn('date', 'transactiondate');
  const amountColumn = findColumn('amount', 'amountinr', 'amountrs', 'value');
  const typeColumn = findColumn('type', 'transactiontype');
  const categoryColumn = findColumn('category', 'categoryname');
  const descriptionColumn = findColumn('description', 'notes', 'note', 'merchant');
  const paymentColumn = findColumn('paymentmode', 'paymentmethod', 'mode');
  const fromColumn = findColumn('fromaccount', 'frommode', 'sourceaccount');
  const toColumn = findColumn('toaccount', 'tomode', 'destinationaccount');
  const tripColumn = findColumn('eventtrip', 'trip', 'tripname');

  if (dateColumn < 0 || amountColumn < 0) {
    throw new Error('CSV must include Date and Amount columns.');
  }

  const imported = [];
  rows.slice(1).forEach((cells, index) => {
    const value = (column) => column < 0 ? '' : (cells[column] || '').trim();
    const amount = Number(value(amountColumn).replace(/[₹,\s]/g, '').replace(/^INR/i, ''));
    const date = parseDate(value(dateColumn));
    if (!date || !Number.isFinite(amount) || amount <= 0) return;

    const tripName = value(tripColumn);
    const trip = trips.find((item) => item.name.toLowerCase() === tripName.toLowerCase());
    const rawType = value(typeColumn).toLowerCase();
    const rawMode = value(paymentColumn).toLowerCase();
    const arrowModes = value(paymentColumn).split(/\s*→\s*/);
    const transfer = rawType === 'transfer';
    const fromMode = value(fromColumn) || (transfer ? arrowModes[0] : '');
    const toMode = value(toColumn) || (transfer ? arrowModes[1] : '');
    if (transfer && (!fromMode || !toMode || fromMode.toLowerCase() === toMode.toLowerCase())) return;
    const paymentMode = ['upi', 'credit card', 'debit card', 'cash', 'net banking']
      .find((mode) => mode === rawMode) || 'UPI';

    imported.push({
      amount,
      date,
      type: transfer ? 'transfer' : ['income', 'credit', 'received'].includes(rawType) ? 'income' : 'expense',
      category_name: transfer ? 'Transfer' : value(categoryColumn) || 'Food & Dining',
      description: value(descriptionColumn) || `Imported transaction ${index + 1}`,
      payment_mode: transfer ? fromMode || paymentMode : paymentMode,
      from_mode: transfer ? fromMode || paymentMode : null,
      to_mode: transfer ? toMode : null,
      trip_id: trip?.id || null,
      trip_name: trip?.name || null,
    });
  });

  if (!imported.length) throw new Error('No valid rows found. Check that dates and amounts are filled in.');
  return imported;
};
