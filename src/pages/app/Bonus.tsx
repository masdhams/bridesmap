import { Download } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../../components/ui'
import { accessToken } from '../../lib/auth'

interface BonusFile {
  file: string
  label: string
  note: string
}

interface BonusItem {
  id: string
  title: string
  text: string
  files: BonusFile[]
}

/** Dua bonus digital. Nama `file` harus sama dengan daftar FILES di api/bonus.js. */
const BONUSES: BonusItem[] = [
  {
    id: 'vendor',
    title: 'Vendor Negotiation Toolkit',
    text: '30 pertanyaan, 14 template chat WhatsApp, dan checklist sebelum DP, supaya kalian tidak kelewatan biaya tambahan saat deal dengan vendor.',
    files: [
      { file: 'Vendor Negotiation Toolkit.pdf', label: 'Panduan utama', note: 'PDF, 31 halaman' },
      { file: 'Vendor Negotiation Toolkit (Versi Cetak).pdf', label: 'Versi cetak', note: 'PDF, hemat tinta' },
      { file: 'WhatsApp Vendor Templates.docx', label: 'Template chat WhatsApp', note: 'Word, 14 template' },
      { file: 'Vendor Comparison Worksheet.xlsx', label: 'Worksheet perbandingan vendor', note: 'Excel, sampai 4 vendor' },
      { file: 'Final Vendor Checklist.pdf', label: 'Checklist sebelum DP', note: 'PDF, 2 halaman' },
    ],
  },
  {
    id: 'budget',
    title: 'Wedding Budget Saving Playbook',
    text: '30 cara hemat yang tetap menjaga bagian paling penting buat kalian, lengkap dengan worksheet prioritas, hitungan tamu, dan hidden cost.',
    files: [
      { file: 'Wedding Budget Saving Playbook.pdf', label: 'Panduan utama', note: 'PDF, 32 halaman' },
      { file: 'Wedding Budget Saving Playbook (Versi Cetak).pdf', label: 'Versi cetak', note: 'PDF, hemat tinta' },
      { file: 'Wedding Budget Priority Worksheet.xlsx', label: 'Worksheet prioritas budget', note: 'Excel, tamu dan hidden cost' },
      { file: '30 Wedding Saving Strategies.pdf', label: 'Checklist 30 strategi hemat', note: 'PDF, 5 halaman' },
      { file: 'Smart Budget Decision Worksheet.xlsx', label: 'Worksheet keputusan hemat', note: 'Excel, total penghematan' },
    ],
  },
]

/** Meminta link unduhan sementara dari server, lalu membukanya di tab baru. */
async function openFile(file: string) {
  // Tab dibuka dulu supaya tidak diblokir pop-up setelah menunggu jawaban server.
  const win = window.open('about:blank', '_blank')
  try {
    const token = await accessToken()
    const res = await fetch(`/api/bonus?file=${encodeURIComponent(file)}`, { headers: { authorization: `Bearer ${token ?? ''}` } })
    if (!res.ok) throw new Error(String(res.status))
    const body = (await res.json()) as { url: string }
    if (win) win.location.href = body.url
    else window.location.href = body.url
  } catch {
    win?.close()
    alert('File belum bisa dibuka. Coba lagi sebentar, ya.')
  }
}

export default function Bonus() {
  const [busy, setBusy] = useState<string | null>(null)

  const download = async (file: string) => {
    setBusy(file)
    await openFile(file)
    setBusy(null)
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PageHeader back="/app" title="Bonus" subtitle="Dua panduan tambahan khusus untuk pembeli Bridesmap. Unduh file yang kalian butuhkan kapan saja." />

      {BONUSES.map((b) => (
        <section key={b.id} aria-labelledby={`bonus-${b.id}`} className="card flex flex-col gap-5 p-5 sm:p-6">
          <div className="space-y-1.5">
            <h2 id={`bonus-${b.id}`} className="text-[26px]">
              {b.title}
            </h2>
            <p className="text-sm leading-relaxed text-body">{b.text}</p>
          </div>
          <ul className="flex flex-col divide-y divide-divider">
            {b.files.map((f) => (
              <li key={f.file} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-ink">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.note}</p>
                </div>
                <button className="btn-outline btn-sm shrink-0" onClick={() => download(f.file)} disabled={busy === f.file}>
                  <Download className="size-4" aria-hidden /> {busy === f.file ? 'Membuka…' : 'Unduh'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
