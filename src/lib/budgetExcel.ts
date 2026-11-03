// Ekspor budget ke Excel (.xlsx) dengan desain Bridesmap. ExcelJS dimuat saat tombol ditekan supaya aplikasi tetap ringan.
import type { Borders, Cell, Fill, Font, Worksheet } from 'exceljs'
import { budgetSummary, paymentsPaid, vendorCost } from './selectors'
import type { PlanState } from './store'
import type { VendorStatus } from './types'
import { fmtDate, todayISO } from './utils'

// Warna mengikuti token di index.css.
const C = {
  primary: 'FF34432F',
  primarySoft: 'FFE6EBDD',
  cream: 'FFFBF8F2',
  muted: 'FFF3EEE4',
  border: 'FFE5DCCB',
  ink: 'FF22261F',
  body: 'FF4A4E43',
  grey: 'FF7A7D72',
  white: 'FFFFFFFF',
  danger: 'FFA3392C',
  dangerSoft: 'FFF6DEDA',
  success: 'FF3B5230',
  successSoft: 'FFDFE8D8',
  warning: 'FF7A4F12',
  warningSoft: 'FFF5E9D2',
}
const FONT = 'Calibri'
const RP = '"Rp" #,##0;[Red]-"Rp" #,##0'
const PCT = '0%'
const DATE = 'd mmm yyyy'

const fill = (argb: string): Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
const font = (o: Partial<Font> = {}): Partial<Font> => ({ name: FONT, size: 11, color: { argb: C.ink }, ...o })
const line = { style: 'thin' as const, color: { argb: C.border } }
const bottomLine: Partial<Borders> = { bottom: line }

const STATUS: Record<VendorStatus, string> = { kandidat: 'Kandidat', negosiasi: 'Negosiasi', booked: 'Booked', batal: 'Batal' }

type Col = { header: string; width: number; fmt?: string; align?: 'left' | 'right' | 'center' }

/** Judul dan subjudul di dua baris pertama setiap sheet. */
function heading(ws: Worksheet, title: string, sub: string, span: number) {
  ws.mergeCells(1, 1, 1, span)
  ws.mergeCells(2, 1, 2, span)
  const t = ws.getCell(1, 1)
  t.value = title
  t.font = font({ size: 18, bold: true, color: { argb: C.primary } })
  t.alignment = { vertical: 'middle' }
  ws.getRow(1).height = 30
  const s = ws.getCell(2, 1)
  s.value = sub
  s.font = font({ size: 10, color: { argb: C.grey } })
  ws.getRow(2).height = 18
}

/** Tabel dengan header hijau, baris belang, format angka, dan filter. Mengembalikan nomor baris pertama dan terakhir data. */
function table(ws: Worksheet, startRow: number, cols: Col[], rows: (string | number | Date | { formula: string } | null)[][], opts: { filter?: boolean } = {}) {
  const head = ws.getRow(startRow)
  cols.forEach((c, i) => {
    const cell = head.getCell(i + 1)
    cell.value = c.header
    cell.font = font({ bold: true, color: { argb: C.white } })
    cell.fill = fill(C.primary)
    cell.alignment = { vertical: 'middle', horizontal: c.align ?? (c.fmt ? 'right' : 'left'), wrapText: true }
  })
  head.height = 24
  rows.forEach((r, ri) => {
    const row = ws.getRow(startRow + 1 + ri)
    r.forEach((v, ci) => {
      const cell = row.getCell(ci + 1)
      cell.value = v as Cell['value']
      cell.font = font({ color: { argb: C.body } })
      if (cols[ci].fmt) cell.numFmt = cols[ci].fmt!
      cell.alignment = { vertical: 'middle', horizontal: cols[ci].align ?? (cols[ci].fmt ? 'right' : 'left'), wrapText: true }
      cell.border = bottomLine
      if (ri % 2 === 1) cell.fill = fill(C.cream)
    })
    row.height = 20
  })
  const first = startRow + 1
  const last = startRow + rows.length
  if (opts.filter && rows.length > 0) ws.autoFilter = { from: { row: startRow, column: 1 }, to: { row: last, column: cols.length } }
  return { first, last }
}

/** Baris total tebal dengan latar Sage muda. */
function totalRow(ws: Worksheet, rowNo: number, span: number, label: string, values: Record<number, { formula: string } | number | string>, fmts: Record<number, string>) {
  const row = ws.getRow(rowNo)
  for (let i = 1; i <= span; i++) {
    const cell = row.getCell(i)
    cell.fill = fill(C.primarySoft)
    cell.font = font({ bold: true })
    cell.border = { top: { style: 'thin', color: { argb: C.primary } } }
    if (values[i] !== undefined) {
      cell.value = values[i] as Cell['value']
      cell.alignment = { horizontal: 'right' }
    }
    if (fmts[i]) cell.numFmt = fmts[i]
  }
  row.getCell(1).value = label
  row.height = 22
}

function setup(ws: Worksheet, cols: Col[], tab: string) {
  ws.columns = cols.map((c) => ({ width: c.width }))
  ws.properties.tabColor = { argb: tab }
  ws.views = [{ showGridLines: false }]
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } }
}

function statusRule(ws: Worksheet, ref: string, text: string, bg: string, fg: string) {
  ws.addConditionalFormatting({
    ref,
    rules: [{ type: 'containsText', operator: 'containsText', text, priority: 1, style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: bg } }, font: { color: { argb: fg }, bold: true } } }],
  })
}

export async function exportBudgetExcel(s: PlanState) {
  const { default: ExcelJS } = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Bridesmap'
  wb.created = new Date()

  const sum = budgetSummary(s)
  const total = s.profile.totalBudget
  const couple = `${s.profile.partnerA} & ${s.profile.partnerB}`
  const sub = `${couple} · Hari-H ${s.profile.weddingDate ? fmtDate(s.profile.weddingDate, 'd MMMM yyyy') : '-'} · diekspor ${fmtDate(todayISO(), 'd MMMM yyyy')}`
  const catById = new Map(s.categories.map((c) => [c.id, c]))
  const eventName = (catId: string) => {
    const c = catById.get(catId)
    if (!c) return 'Umum'
    if (c.hidden) return 'Hidden cost'
    return s.events.find((e) => e.id === c.eventId)?.name ?? 'Umum'
  }
  const catName = (catId: string) => catById.get(catId)?.name ?? 'Tanpa kategori'
  const eventOrder = (name: string) => {
    const i = s.events.findIndex((e) => e.name === name)
    return i >= 0 ? i : name === 'Umum' ? 98 : 99
  }
  // ExcelJS menyimpan tanggal dalam UTC; tengah malam UTC menjaga tanggalnya tidak bergeser karena zona waktu.
  const d = (iso?: string) => (iso ? new Date(`${iso}T00:00:00Z`) : null)
  const today = todayISO()

  /* ---------- 1. Ringkasan ---------- */
  const ws1 = wb.addWorksheet('Ringkasan')
  const cols1: Col[] = [
    { header: 'Acara', width: 28 },
    { header: 'Budget', width: 20, fmt: RP },
    { header: 'Disepakati', width: 20, fmt: RP },
    { header: 'Sudah dibayar', width: 20, fmt: RP },
    { header: 'Sisa', width: 20, fmt: RP },
    { header: 'Terpakai', width: 14, fmt: PCT },
  ]
  setup(ws1, cols1, C.primary)
  heading(ws1, `Budget pernikahan ${couple}`, sub, 6)

  // Kartu angka utama: label kecil di baris 4, angka besar di baris 5.
  const committedAll = sum.reduce((a, c) => a + c.committed, 0)
  const paidAll = sum.reduce((a, c) => a + c.paid, 0)
  const kpis: [string, Cell['value'], string][] = [
    ['TOTAL BUDGET', total, C.primary],
    ['DISEPAKATI', committedAll, C.ink],
    ['SUDAH DIBAYAR', paidAll, C.success],
    ['SISA BUDGET', { formula: 'A5-B5' } as Cell['value'], C.ink],
  ]
  kpis.forEach(([label, value, color], i) => {
    const l = ws1.getCell(4, i + 1)
    l.value = label
    l.font = font({ size: 9, bold: true, color: { argb: C.grey } })
    l.fill = fill(C.muted)
    l.alignment = { vertical: 'bottom', indent: 1 }
    const v = ws1.getCell(5, i + 1)
    v.value = value
    v.numFmt = RP
    v.font = font({ size: 16, bold: true, color: { argb: color } })
    v.fill = fill(C.muted)
    v.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    v.border = { bottom: { style: 'medium', color: { argb: color } } }
  })
  ws1.getRow(4).height = 20
  ws1.getRow(5).height = 32
  const st = ws1.getCell(6, 1)
  st.value = { formula: 'IF(B5>A5,"Status: Over budget",IF(B5>=A5*0.9,"Status: Mendekati batas","Status: Sesuai rencana"))' }
  st.font = font({ bold: true, color: { argb: C.primary } })
  ws1.getRow(6).height = 22
  statusRule(ws1, 'A6', 'Over budget', C.dangerSoft, C.danger)
  statusRule(ws1, 'A6', 'Mendekati', C.warningSoft, C.warning)

  const sec = ws1.getCell(8, 1)
  sec.value = 'Ringkasan per acara'
  sec.font = font({ size: 13, bold: true, color: { argb: C.primary } })
  const evRows = s.events.map((e) => {
    const cs = sum.filter((c) => catById.get(c.id)?.eventId === e.id)
    return [e.name, e.budget, cs.reduce((a, c) => a + c.committed, 0), cs.reduce((a, c) => a + c.paid, 0)]
  })
  const hidden = sum.filter((c) => c.hidden)
  if (hidden.length) evRows.push(['Hidden cost', hidden.reduce((a, c) => a + c.allocated, 0), hidden.reduce((a, c) => a + c.committed, 0), hidden.reduce((a, c) => a + c.paid, 0)])
  const t1 = table(
    ws1,
    9,
    cols1,
    evRows.map((r, i) => {
      const n = 10 + i
      return [...r, { formula: `B${n}-C${n}` }, { formula: `IF(B${n}=0,0,C${n}/B${n})` }]
    }),
  )
  const tr1 = t1.last + 1
  totalRow(ws1, tr1, 6, 'Total', { 2: { formula: `SUM(B${t1.first}:B${t1.last})` }, 3: { formula: `SUM(C${t1.first}:C${t1.last})` }, 4: { formula: `SUM(D${t1.first}:D${t1.last})` }, 5: { formula: `B${tr1}-C${tr1}` }, 6: { formula: `IF(B${tr1}=0,0,C${tr1}/B${tr1})` } }, { 2: RP, 3: RP, 4: RP, 5: RP, 6: PCT })
  ws1.addConditionalFormatting({ ref: `F${t1.first}:F${tr1}`, rules: [{ type: 'cellIs', operator: 'greaterThan', formulae: ['1'], priority: 1, style: { font: { color: { argb: C.danger }, bold: true } } }] })

  // Cara membaca, supaya file tetap jelas saat dibagikan ke orang lain.
  const notes = [
    'Cara membaca',
    'Disepakati: harga vendor yang sudah Booked ditambah biaya lain yang dicatat.',
    'Sudah dibayar: uang yang benar-benar sudah keluar.',
    'Sisa: budget dikurangi Disepakati. Angka merah berarti melewati budget.',
    'Detail ada di sheet Per kategori, Rincian biaya, Jadwal pembayaran, dan Vendor lain.',
  ]
  notes.forEach((n, i) => {
    const r = tr1 + 3 + i
    ws1.mergeCells(r, 1, r, 6)
    const c = ws1.getCell(r, 1)
    c.value = n
    c.font = i === 0 ? font({ bold: true, color: { argb: C.primary } }) : font({ size: 10, color: { argb: C.body } })
  })

  /* ---------- 2. Per kategori ---------- */
  const ws2 = wb.addWorksheet('Per kategori')
  const cols2: Col[] = [
    { header: 'Acara', width: 18 },
    { header: 'Kategori', width: 32 },
    { header: 'Alokasi', width: 18, fmt: RP },
    { header: 'Disepakati', width: 18, fmt: RP },
    { header: 'Sudah dibayar', width: 18, fmt: RP },
    { header: 'Sisa alokasi', width: 18, fmt: RP },
    { header: 'Terpakai', width: 12, fmt: PCT },
    { header: 'Status', width: 18, align: 'center' },
  ]
  setup(ws2, cols2, 'FFA9B59A')
  heading(ws2, 'Pemakaian per kategori', `${sub} · angka per acara`, 8)
  const catRows = [...sum]
    .map((c) => ({ c, ev: eventName(c.id) }))
    .sort((a, b) => eventOrder(a.ev) - eventOrder(b.ev))
    .map(({ c, ev }, i) => {
      const n = 5 + i
      return [ev, c.name, c.allocated, c.committed, c.paid, { formula: `C${n}-D${n}` }, { formula: `IF(C${n}=0,0,D${n}/C${n})` }, { formula: `IF(AND(C${n}>0,D${n}>C${n}),"Lewat",IF(D${n}=0,"Belum ada biaya","Aman"))` }]
    })
  const t2 = table(ws2, 4, cols2, catRows, { filter: true })
  const tr2 = t2.last + 1
  totalRow(ws2, tr2, 8, 'Total', { 3: { formula: `SUM(C${t2.first}:C${t2.last})` }, 4: { formula: `SUM(D${t2.first}:D${t2.last})` }, 5: { formula: `SUM(E${t2.first}:E${t2.last})` }, 6: { formula: `C${tr2}-D${tr2}` } }, { 3: RP, 4: RP, 5: RP, 6: RP })
  statusRule(ws2, `H${t2.first}:H${t2.last}`, 'Lewat', C.dangerSoft, C.danger)
  statusRule(ws2, `H${t2.first}:H${t2.last}`, 'Aman', C.successSoft, C.success)
  ws2.views = [{ showGridLines: false, state: 'frozen', ySplit: 4 }]

  /* ---------- 3. Rincian biaya ---------- */
  const ws3 = wb.addWorksheet('Rincian biaya')
  const cols3: Col[] = [
    { header: 'Acara', width: 16 },
    { header: 'Kategori', width: 26 },
    { header: 'Jenis', width: 10, align: 'center' },
    { header: 'Nama', width: 34 },
    { header: 'Jumlah', width: 17, fmt: RP },
    { header: 'Sudah dibayar', width: 17, fmt: RP },
    { header: 'Sisa bayar', width: 17, fmt: RP },
    { header: 'Status', width: 14, align: 'center' },
    { header: 'Catatan', width: 36 },
  ]
  setup(ws3, cols3, 'FF9A4E3B')
  heading(ws3, 'Rincian biaya', `${sub} · vendor Booked dan biaya yang dicatat`, 9)
  const lines = [
    ...s.vendors
      .filter((v) => v.status === 'booked')
      .map((v) => ({ cat: v.categoryId, jenis: 'Vendor', nama: v.name, amount: vendorCost(v), paid: paymentsPaid(v), note: [v.pic && `PIC ${v.pic}`, v.contact, v.notes].filter(Boolean).join(' · ') })),
    ...s.items.map((i) => ({ cat: i.categoryId, jenis: 'Biaya', nama: i.name, amount: i.amount, paid: i.paid ? i.amount : 0, note: i.note ?? '' })),
  ].sort((a, b) => eventOrder(eventName(a.cat)) - eventOrder(eventName(b.cat)) || catName(a.cat).localeCompare(catName(b.cat)))
  const t3 = table(
    ws3,
    4,
    cols3,
    lines.map((l, i) => {
      const n = 5 + i
      return [eventName(l.cat), catName(l.cat), l.jenis, l.nama, l.amount, l.paid, { formula: `E${n}-F${n}` }, { formula: `IF(G${n}<=0,"Lunas",IF(F${n}>0,"DP","Belum dibayar"))` }, l.note]
    }),
    { filter: true },
  )
  const tr3 = t3.last + 1
  totalRow(ws3, tr3, 9, 'Total', { 5: { formula: `SUM(E${t3.first}:E${t3.last})` }, 6: { formula: `SUM(F${t3.first}:F${t3.last})` }, 7: { formula: `E${tr3}-F${tr3}` } }, { 5: RP, 6: RP, 7: RP })
  statusRule(ws3, `H${t3.first}:H${t3.last}`, 'Lunas', C.successSoft, C.success)
  statusRule(ws3, `H${t3.first}:H${t3.last}`, 'DP', C.warningSoft, C.warning)
  statusRule(ws3, `H${t3.first}:H${t3.last}`, 'Belum', C.muted, C.body)
  ws3.views = [{ showGridLines: false, state: 'frozen', ySplit: 4 }]

  /* ---------- 4. Jadwal pembayaran ---------- */
  const ws4 = wb.addWorksheet('Jadwal pembayaran')
  const cols4: Col[] = [
    { header: 'Jatuh tempo', width: 15, fmt: DATE, align: 'left' },
    { header: 'Vendor', width: 30 },
    { header: 'Acara · kategori', width: 30 },
    { header: 'Termin', width: 16 },
    { header: 'Jumlah', width: 17, fmt: RP },
    { header: 'Status', width: 16, align: 'center' },
    { header: 'Tanggal bayar', width: 15, fmt: DATE, align: 'left' },
  ]
  setup(ws4, cols4, 'FFC9A227')
  heading(ws4, 'Jadwal pembayaran vendor', `${sub} · urut dari jatuh tempo terdekat`, 7)
  const pays = s.vendors
    .filter((v) => v.status === 'booked')
    .flatMap((v) => v.payments.map((p) => ({ v, p })))
    .sort((a, b) => a.p.dueDate.localeCompare(b.p.dueDate))
  const t4 = table(
    ws4,
    4,
    cols4,
    pays.map(({ v, p }) => [d(p.dueDate), v.name, `${eventName(v.categoryId)} · ${catName(v.categoryId)}`, p.label, p.amount, p.paidDate ? 'Lunas' : p.dueDate < today ? 'Terlambat' : 'Belum dibayar', d(p.paidDate)]),
    { filter: true },
  )
  const tr4 = t4.last + 1
  totalRow(ws4, tr4, 7, 'Total semua termin', { 5: { formula: `SUM(E${t4.first}:E${t4.last})` } }, { 5: RP })
  const label = (r: number, text: string, f: string) => {
    ws4.getCell(r, 4).value = text
    ws4.getCell(r, 4).font = font({ bold: true })
    const c = ws4.getCell(r, 5)
    c.value = { formula: f }
    c.numFmt = RP
    c.font = font({ bold: true })
  }
  label(tr4 + 1, 'Sudah dibayar', `SUMIF(F${t4.first}:F${t4.last},"Lunas",E${t4.first}:E${t4.last})`)
  label(tr4 + 2, 'Belum dibayar', `E${tr4}-E${tr4 + 1}`)
  statusRule(ws4, `F${t4.first}:F${t4.last}`, 'Lunas', C.successSoft, C.success)
  statusRule(ws4, `F${t4.first}:F${t4.last}`, 'Terlambat', C.dangerSoft, C.danger)
  statusRule(ws4, `F${t4.first}:F${t4.last}`, 'Belum', C.warningSoft, C.warning)
  ws4.views = [{ showGridLines: false, state: 'frozen', ySplit: 4 }]

  /* ---------- 5. Vendor lain ---------- */
  const ws5 = wb.addWorksheet('Vendor lain')
  const cols5: Col[] = [
    { header: 'Vendor', width: 30 },
    { header: 'Acara · kategori', width: 30 },
    { header: 'Status', width: 14, align: 'center' },
    { header: 'Penawaran', width: 18, fmt: RP },
    { header: 'PIC', width: 16 },
    { header: 'Kontak', width: 18 },
    { header: 'Catatan', width: 44 },
  ]
  setup(ws5, cols5, 'FF7A7D72')
  heading(ws5, 'Vendor yang belum booked', `${sub} · untuk dibandingkan`, 7)
  const others = s.vendors.filter((v) => v.status !== 'booked').sort((a, b) => catName(a.categoryId).localeCompare(catName(b.categoryId)) || a.quote - b.quote)
  const t5 = table(
    ws5,
    4,
    cols5,
    others.map((v) => [v.name, `${eventName(v.categoryId)} · ${catName(v.categoryId)}`, STATUS[v.status], v.quote, v.pic ?? '', v.contact ?? '', v.notes ?? '']),
    { filter: true },
  )
  statusRule(ws5, `C${t5.first}:C${Math.max(t5.first, t5.last)}`, 'Negosiasi', C.warningSoft, C.warning)
  statusRule(ws5, `C${t5.first}:C${Math.max(t5.first, t5.last)}`, 'Batal', C.muted, C.grey)
  ws5.views = [{ showGridLines: false, state: 'frozen', ySplit: 4 }]

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const slug = `${s.profile.partnerA}-${s.profile.partnerB}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  a.href = url
  a.download = `budget-${slug}-${todayISO()}.xlsx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
