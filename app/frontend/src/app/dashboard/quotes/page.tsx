'use client';

import { FormEvent, useMemo, useState } from 'react';
import Header from '@/components/Header';
import styles from './quotes.module.css';

type Difficulty = 'easy' | 'medium' | 'hard';

interface QuoteLine {
  id: number;
  space: string;
  qty: number;
  minsPerUnit: number;
  difficulty: Difficulty;
}

interface Preset {
  name: string;
  icon: string;
  lines: Omit<QuoteLine, 'id'>[];
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const MARKUPS: Record<Difficulty, number> = {
  easy: 0,
  medium: 5,
  hard: 10,
};

const PRESETS: Preset[] = [
  {
    name: 'Deep Clean Home',
    icon: 'fas fa-house-user',
    lines: [
      { space: 'Bedroom', qty: 3, minsPerUnit: 35, difficulty: 'medium' },
      { space: 'Bathroom', qty: 2, minsPerUnit: 45, difficulty: 'hard' },
      { space: 'Living Room', qty: 1, minsPerUnit: 40, difficulty: 'medium' },
      { space: 'Kitchen', qty: 1, minsPerUnit: 70, difficulty: 'hard' },
      { space: 'Windows', qty: 8, minsPerUnit: 8, difficulty: 'easy' },
    ],
  },
  {
    name: 'Regular Clean',
    icon: 'fas fa-broom',
    lines: [
      { space: 'Bedroom', qty: 2, minsPerUnit: 20, difficulty: 'easy' },
      { space: 'Bathroom', qty: 1, minsPerUnit: 30, difficulty: 'medium' },
      { space: 'Living Room', qty: 1, minsPerUnit: 25, difficulty: 'easy' },
      { space: 'Kitchen', qty: 1, minsPerUnit: 35, difficulty: 'medium' },
    ],
  },
  {
    name: 'End of Tenancy',
    icon: 'fas fa-key',
    lines: [
      { space: 'Bedroom', qty: 2, minsPerUnit: 45, difficulty: 'hard' },
      { space: 'Bathroom', qty: 1, minsPerUnit: 55, difficulty: 'hard' },
      { space: 'Kitchen', qty: 1, minsPerUnit: 90, difficulty: 'hard' },
      { space: 'Oven', qty: 1, minsPerUnit: 60, difficulty: 'hard' },
      { space: 'Fridge', qty: 1, minsPerUnit: 25, difficulty: 'medium' },
      { space: 'Windows', qty: 6, minsPerUnit: 10, difficulty: 'medium' },
    ],
  },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);

const today = () => new Date().toISOString().slice(0, 10);

export default function QuotesPage() {
  const [quoteRef, setQuoteRef] = useState(`MHQ-${Date.now().toString().slice(-5)}`);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [jobAddress, setJobAddress] = useState('');
  const [quoteDate, setQuoteDate] = useState(today());
  const [validDays, setValidDays] = useState(30);
  const [hourlyRate, setHourlyRate] = useState(23);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('Thank you for the opportunity to quote for this job. We look forward to working with you.');
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [space, setSpace] = useState('');
  const [qty, setQty] = useState(1);
  const [minsPerUnit, setMinsPerUnit] = useState(30);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');

  const lineTotals = useMemo(() => {
    return lines.map((line) => {
      const minutes = line.qty * line.minsPerUnit;
      const base = (minutes / 60) * hourlyRate;
      const markup = base * (MARKUPS[line.difficulty] / 100);
      const total = base + markup;
      return { ...line, minutes, hours: minutes / 60, markup, total };
    });
  }, [hourlyRate, lines]);

  const totals = useMemo(() => {
    const minutes = lineTotals.reduce((sum, line) => sum + line.minutes, 0);
    const subtotal = lineTotals.reduce((sum, line) => sum + line.total, 0);
    const tax = subtotal * (taxRate / 100);
    return { minutes, hours: minutes / 60, subtotal, tax, grand: subtotal + tax };
  }, [lineTotals, taxRate]);

  const addLine = (event: FormEvent) => {
    event.preventDefault();
    const name = space.trim();
    if (!name) return;
    setLines((current) => [
      ...current,
      { id: Date.now(), space: name, qty: Math.max(1, qty), minsPerUnit: Math.max(1, minsPerUnit), difficulty },
    ]);
    setSpace('');
    setQty(1);
    setMinsPerUnit(30);
    setDifficulty('easy');
  };

  const applyPreset = (preset: Preset) => {
    setLines(preset.lines.map((line, index) => ({ ...line, id: Date.now() + index })));
  };

  const removeLine = (id: number) => setLines((current) => current.filter((line) => line.id !== id));

  const printQuote = () => window.print();

  const shareQuote = () => {
    const subject = encodeURIComponent(`Quote ${quoteRef} from Max-Hygiene`);
    const body = encodeURIComponent(
      `Hello ${clientName || 'there'},\n\nPlease find your Max-Hygiene quote summary below.\n\nReference: ${quoteRef}\nTotal: ${formatCurrency(totals.grand)}\n\nUse the Download PDF button in the dashboard to save the formal quote as a PDF.`
    );
    window.location.href = `mailto:${clientEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.screenOnly}>
        <Header title="Quote Generator" subtitle="Build cleaning quotes and export client-ready PDFs" />

        <div className={styles.summaryStrip}>
          <div>
            <span>Total</span>
            <strong>{formatCurrency(totals.grand)}</strong>
          </div>
          <div>
            <span>Hours</span>
            <strong>{totals.hours.toFixed(2)}</strong>
          </div>
          <div>
            <span>Line Items</span>
            <strong>{lines.length}</strong>
          </div>
          <div className={styles.summaryActions}>
            <button className="btn btn-outline" onClick={shareQuote} disabled={!clientEmail || lines.length === 0}>
              <i className="fas fa-envelope" /> Share
            </button>
            <button className="btn btn-primary" onClick={printQuote} disabled={lines.length === 0}>
              <i className="fas fa-file-pdf" /> Download PDF
            </button>
          </div>
        </div>

        <div className={styles.workspace}>
          <section className={styles.builder}>
            <div className="card">
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Quote Details</h2>
                  <p>Client, rate, VAT and validity information.</p>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setQuoteRef(`MHQ-${Date.now().toString().slice(-5)}`)}
                >
                  <i className="fas fa-sync-alt" /> New Ref
                </button>
              </div>

              <div className={styles.formGrid}>
                <label className="form-group">
                  <span className="form-label">Quote Ref</span>
                  <input className="form-control" value={quoteRef} onChange={(e) => setQuoteRef(e.target.value)} />
                </label>
                <label className="form-group">
                  <span className="form-label">Quote Date</span>
                  <input className="form-control" type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} />
                </label>
                <label className="form-group">
                  <span className="form-label">Client Name</span>
                  <input className="form-control" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Rose Iade" />
                </label>
                <label className="form-group">
                  <span className="form-label">Client Email</span>
                  <input className="form-control" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@email.com" />
                </label>
                <label className="form-group">
                  <span className="form-label">Client Phone</span>
                  <input className="form-control" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="0333..." />
                </label>
                <label className="form-group">
                  <span className="form-label">Valid For</span>
                  <input className="form-control" type="number" min="1" value={validDays} onChange={(e) => setValidDays(Number(e.target.value))} />
                </label>
                <label className={`form-group ${styles.fullSpan}`}>
                  <span className="form-label">Job Address</span>
                  <input className="form-control" value={jobAddress} onChange={(e) => setJobAddress(e.target.value)} placeholder="Property address" />
                </label>
                <label className="form-group">
                  <span className="form-label">Hourly Rate</span>
                  <input className="form-control" type="number" min="0" step="0.5" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} />
                </label>
                <label className="form-group">
                  <span className="form-label">VAT / Tax %</span>
                  <input className="form-control" type="number" min="0" step="0.5" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
                </label>
              </div>
            </div>

            <div className="card">
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Cleaning Presets</h2>
                  <p>Start from a typical clean, then adjust the line items.</p>
                </div>
              </div>

              <div className={styles.presetGrid}>
                {PRESETS.map((preset) => (
                  <button key={preset.name} className={styles.presetButton} onClick={() => applyPreset(preset)}>
                    <i className={preset.icon} />
                    <span>{preset.name}</span>
                    <small>{preset.lines.length} lines</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Add a Space</h2>
                  <p>Price by time, quantity and difficulty.</p>
                </div>
              </div>

              <form className={styles.lineForm} onSubmit={addLine}>
                <label className="form-group">
                  <span className="form-label">Space / Task</span>
                  <input className="form-control" value={space} onChange={(e) => setSpace(e.target.value)} placeholder="e.g. Bedroom" required />
                </label>
                <label className="form-group">
                  <span className="form-label">Quantity</span>
                  <input className="form-control" type="number" min="1" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
                </label>
                <label className="form-group">
                  <span className="form-label">Minutes / Unit</span>
                  <input className="form-control" type="number" min="1" value={minsPerUnit} onChange={(e) => setMinsPerUnit(Number(e.target.value))} />
                </label>
                <label className="form-group">
                  <span className="form-label">Difficulty</span>
                  <select className="form-control" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium +5%</option>
                    <option value="hard">Hard +10%</option>
                  </select>
                </label>
                <button className="btn btn-primary" type="submit">
                  <i className="fas fa-plus" /> Add Line
                </button>
              </form>
            </div>

            <div className="card">
              <div className={styles.sectionHeader}>
                <div>
                  <h2>Pricing</h2>
                  <p>{lines.length ? 'Review quote lines before exporting.' : 'Add a preset or custom space to begin.'}</p>
                </div>
                {lines.length > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setLines([])}>
                    <i className="fas fa-trash-alt" /> Clear
                  </button>
                )}
              </div>

              {lineTotals.length === 0 ? (
                <div className={styles.emptyLines}>
                  <i className="fas fa-file-invoice" />
                  <strong>No spaces added yet</strong>
                  <span>Select a preset or add a new space.</span>
                </div>
              ) : (
                <div className="table-wrap" style={{ padding: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Space</th>
                        <th>Qty</th>
                        <th>Mins/Unit</th>
                        <th>Difficulty</th>
                        <th>Total Mins</th>
                        <th>Line Total</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {lineTotals.map((line) => (
                        <tr key={line.id}>
                          <td>{line.space}</td>
                          <td>{line.qty}</td>
                          <td>{line.minsPerUnit}</td>
                          <td>{DIFFICULTY_LABELS[line.difficulty]}</td>
                          <td>{line.minutes}</td>
                          <td><strong>{formatCurrency(line.total)}</strong></td>
                          <td>
                            <button className="btn btn-ghost btn-sm" onClick={() => removeLine(line.id)} title="Remove line">
                              <i className="fas fa-times" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <label className="form-group">
                <span className="form-label">Quote Notes</span>
                <textarea className="form-control" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </label>
            </div>
          </section>

          <aside className={styles.previewPanel}>
            <div className={styles.stickyPreview}>
              <div className={styles.previewToolbar}>
                <span>Live Preview</span>
                <button className="btn btn-primary btn-sm" onClick={printQuote} disabled={lines.length === 0}>
                  <i className="fas fa-file-pdf" /> PDF
                </button>
              </div>
              <QuoteDocument
                quoteRef={quoteRef}
                clientName={clientName}
                clientEmail={clientEmail}
                clientPhone={clientPhone}
                jobAddress={jobAddress}
                quoteDate={quoteDate}
                validDays={validDays}
                notes={notes}
                hourlyRate={hourlyRate}
                taxRate={taxRate}
                lines={lineTotals}
                totals={totals}
              />
            </div>
          </aside>
        </div>
      </div>

      <div className={styles.printOnly}>
        <QuoteDocument
          quoteRef={quoteRef}
          clientName={clientName}
          clientEmail={clientEmail}
          clientPhone={clientPhone}
          jobAddress={jobAddress}
          quoteDate={quoteDate}
          validDays={validDays}
          notes={notes}
          hourlyRate={hourlyRate}
          taxRate={taxRate}
          lines={lineTotals}
          totals={totals}
        />
      </div>
    </div>
  );
}

function QuoteDocument({
  quoteRef,
  clientName,
  clientEmail,
  clientPhone,
  jobAddress,
  quoteDate,
  validDays,
  notes,
  hourlyRate,
  taxRate,
  lines,
  totals,
}: {
  quoteRef: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  jobAddress: string;
  quoteDate: string;
  validDays: number;
  notes: string;
  hourlyRate: number;
  taxRate: number;
  lines: Array<QuoteLine & { minutes: number; hours: number; markup: number; total: number }>;
  totals: { minutes: number; hours: number; subtotal: number; tax: number; grand: number };
}) {
  return (
    <article className={styles.quoteDocument}>
      <header className={styles.quoteHeader}>
        <div className={styles.brandBlock}>
          <img src="/images/logo2.jpeg" alt="Max-Hygiene" />
          <div>
            <h1>Max-Hygiene Ltd</h1>
            <p>Professional cleaning services across Scotland</p>
          </div>
        </div>
        <div className={styles.quoteMeta}>
          <strong>Service Quote</strong>
          <span>{quoteRef || 'Draft'}</span>
          <span>{quoteDate ? new Date(quoteDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</span>
        </div>
      </header>

      <section className={styles.clientGrid}>
        <div>
          <span className={styles.docLabel}>Prepared For</span>
          <strong>{clientName || 'Client Name'}</strong>
          <p>{clientEmail || 'client@email.com'}</p>
          <p>{clientPhone || 'Client phone'}</p>
        </div>
        <div>
          <span className={styles.docLabel}>Property</span>
          <p>{jobAddress || 'Property address'}</p>
        </div>
      </section>

      <section className={styles.docIntro}>
        <h2>Quote Summary</h2>
        <p>{notes}</p>
      </section>

      <table className={styles.quoteTable}>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Minutes</th>
            <th>Difficulty</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={5} className={styles.emptyDocLine}>No quote lines added yet.</td>
            </tr>
          ) : lines.map((line) => (
            <tr key={line.id}>
              <td>{line.space}</td>
              <td>{line.qty}</td>
              <td>{line.minutes}</td>
              <td>{DIFFICULTY_LABELS[line.difficulty]}</td>
              <td>{formatCurrency(line.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className={styles.docTotals}>
        <div>
          <span>Total minutes</span>
          <strong>{totals.minutes}</strong>
        </div>
        <div>
          <span>Total hours</span>
          <strong>{totals.hours.toFixed(2)}</strong>
        </div>
        <div>
          <span>Hourly rate</span>
          <strong>{formatCurrency(hourlyRate)}/hr</strong>
        </div>
        <div>
          <span>Net</span>
          <strong>{formatCurrency(totals.subtotal)}</strong>
        </div>
        <div>
          <span>VAT / Tax ({taxRate}%)</span>
          <strong>{formatCurrency(totals.tax)}</strong>
        </div>
        <div className={styles.grandTotal}>
          <span>Total</span>
          <strong>{formatCurrency(totals.grand)}</strong>
        </div>
      </section>

      <footer className={styles.quoteFooter}>
        <p>This quote is valid for {validDays || 30} days.</p>
        <p>Invoices can be paid by BACS, Direct Debit, or agreed payment method.</p>
      </footer>
    </article>
  );
}
