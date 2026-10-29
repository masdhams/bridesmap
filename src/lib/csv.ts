// Impor daftar tamu dari CSV (Excel/Google Sheets) atau vCard (.vcf, ekspor kontak HP).

function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"'
        i++
      } else q = !q
    } else if (ch === sep && !q) {
      out.push(cur.trim())
      cur = ''
    } else cur += ch
  }
  out.push(cur.trim())
  return out
}

export interface ImportedGuest {
  name: string
  group?: string
  phone?: string
  pax?: number
}

const pick = (headers: string[], ...keys: string[]) => headers.findIndex((h) => keys.some((k) => h.includes(k)))

export function parseGuestCsv(text: string): ImportedGuest[] {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return []
  const sep = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ';' : ','
  const headers = splitCsvLine(lines[0], sep).map((h) => h.toLowerCase())
  let iName = pick(headers, 'nama', 'name')
  const iGroup = pick(headers, 'grup', 'group', 'kelompok', 'kategori')
  const iPhone = pick(headers, 'telepon', 'hp', 'phone', 'wa', 'nomor')
  const iPax = pick(headers, 'jumlah', 'pax', 'orang')
  const hasHeader = iName >= 0
  if (!hasHeader) iName = 0
  return lines
    .slice(hasHeader ? 1 : 0)
    .map((l) => splitCsvLine(l, sep))
    .filter((c) => c[iName])
    .map((c) => ({
      name: c[iName],
      group: iGroup >= 0 ? c[iGroup] || undefined : undefined,
      phone: iPhone >= 0 ? c[iPhone] || undefined : undefined,
      pax: iPax >= 0 ? Math.max(1, Number(c[iPax]) || 1) : 1,
    }))
}

export function parseVcf(text: string): ImportedGuest[] {
  return text
    .split(/END:VCARD/i)
    .map((card) => {
      const name = card.match(/^FN[^:]*:(.+)$/im)?.[1]?.trim()
      const phone = card.match(/^TEL[^:]*:(.+)$/im)?.[1]?.trim()
      return name ? { name, phone, pax: 1 } : null
    })
    .filter(Boolean) as ImportedGuest[]
}
