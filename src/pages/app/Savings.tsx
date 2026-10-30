import { addMonths, differenceInCalendarMonths, format, parseISO } from 'date-fns'
import { PiggyBank, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PanelBar, PanelStat } from '../../components/bento'
import { Amount, ConfirmButton, Empty, Field, Modal, MoneyInput, PageHeader, PartnerAvatar, Progress, Segmented, Stat } from '../../components/ui'
import { usePlan, useSession } from '../../lib/store'
import type { Partner, SavingsEntry } from '../../lib/types'
import { fmtDate, rupiah, todayISO, uid } from '../../lib/utils'

export default function Savings() {
  const { savings, setSavings, profile } = usePlan()
  const me = useSession((s) => s.me)
  const [draft, setDraft] = useState<Partial<SavingsEntry> | null>(null)
  const saved = savings.entries.reduce((a, e) => a + e.amount, 0)
  const remaining = Math.max(0, savings.target - saved)
  const monthsLeft = profile.weddingDate ? Math.max(1, differenceInCalendarMonths(parseISO(profile.weddingDate), new Date())) : 12
  const needPerMonth = remaining / monthsLeft
  const plan = savings.monthlyPlan
  const eta = plan > 0 && remaining > 0 ? addMonths(new Date(), Math.ceil(remaining / plan)) : null
  const onTime = eta ? eta <= parseISO(profile.weddingDate) : remaining === 0
  const byA = savings.entries.filter((e) => e.by === 'A').reduce((a, e) => a + e.amount, 0)
  const byB = saved - byA
  const name = (p: Partner) => (p === 'A' ? profile.partnerA : profile.partnerB)

  const save = () => {
    if (!draft?.amount) return
    setSavings({ entries: [...savings.entries, { id: uid(), date: draft.date ?? todayISO(), amount: draft.amount, by: draft.by ?? me, note: draft.note }] })
    setDraft(null)
  }

  return (
    <div>
      <PageHeader back="/app" title="Tabungan nikah" subtitle="Tetapkan target, catat setoran berdua, dan lihat perkiraan kapan target tercapai."
        actions={<button className="btn-primary btn-sm" onClick={() => setDraft({ by: me, date: todayISO(), amount: 0 })}><Plus className="size-4" aria-hidden /> Setoran</button>} />

      <div className="grid gap-4 lg:grid-cols-12">
      <section className="card p-5 lg:col-span-7 lg:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Terkumpul</p>
            <p className="text-3xl font-bold tabular-nums lg:font-serif lg:text-[52px] lg:leading-none">{rupiah(saved)}</p>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">dari {rupiah(savings.target)} · {savings.target ? Math.round((saved / savings.target) * 100) : 0}%</p>
        </div>
        <div className="mt-3"><Progress value={saved} max={savings.target} tone="accent" label="Progres tabungan" /></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Target dana" htmlFor="st"><MoneyInput id="st" value={savings.target} onChange={(n) => setSavings({ target: n })} /></Field>
          <Field label="Rencana nabung per bulan (berdua)" htmlFor="sm"><MoneyInput id="sm" value={savings.monthlyPlan} onChange={(n) => setSavings({ monthlyPlan: n })} /></Field>
        </div>
      </section>
      {/* Desktop: panel gelap kontribusi berdua. */}
      <section className="hidden flex-col gap-4 rounded-[28px] bg-primary p-6 text-white shadow-[var(--shadow-soft)] lg:col-span-5 lg:flex">
        <div className="flex items-start justify-between gap-3">
          <span className="flex flex-col">
            <span className="text-[17px] font-semibold">Kontribusi berdua</span>
            <span className="text-xs text-[#D5DCCB]">Dari {savings.entries.length} setoran</span>
          </span>
          <span className="font-serif text-[40px] leading-[0.9] tabular-nums">
            {saved ? Math.round((byA / saved) * 100) : 0}
            <span className="text-[22px] text-[#D5DCCB]">:{saved ? Math.round((byB / saved) * 100) : 0}</span>
          </span>
        </div>
        {(['A', 'B'] as const).map((p) => {
          const v = p === 'A' ? byA : byB
          return (
            <div key={p} className="flex flex-col gap-2 rounded-[18px] bg-white/[0.07] px-4 py-3">
              <span className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2.5">
                  <PartnerAvatar who={p} name={name(p)} size={28} />
                  <span className="truncate text-sm font-semibold">{name(p)}</span>
                </span>
                <span className="text-sm font-semibold tabular-nums">{rupiah(v)}</span>
              </span>
              <PanelBar value={v} max={saved} />
            </div>
          )
        })}
        <div className="mt-auto">
          <PanelStat
            label="Perkiraan tercapai"
            value={remaining === 0 ? 'Tercapai' : eta ? format(eta, 'MMM yyyy') : 'Isi rencana per bulan'}
            tone={remaining > 0 && eta && !onTime ? 'text-[#F2B8A8]' : undefined}
          />
        </div>
      </section>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <Stat label="Sisa target" value={<Amount value={remaining} compactOnMobile />} />
        <Stat label="Perlu per bulan" value={<Amount value={needPerMonth} compactOnMobile />} sub={`${monthsLeft} bulan ke hari-H`} />
        <Stat label="Perkiraan tercapai" value={remaining === 0 ? 'Tercapai' : eta ? format(eta, 'MMM yyyy') : 'Isi rencana'} sub={remaining > 0 && eta ? (onTime ? 'Sebelum hari-H' : 'Setelah hari-H') : undefined} tone={remaining > 0 && eta ? (onTime ? 'success' : 'danger') : undefined} />
        <div className="lg:hidden">
          <Stat label="Kontribusi" value={`${saved ? Math.round((byA / saved) * 100) : 0}% : ${saved ? Math.round((byB / saved) * 100) : 0}%`} sub={`${profile.partnerA} : ${profile.partnerB}`} />
        </div>
      </div>
      {plan > 0 && !onTime && remaining > 0 && (
        <p className="mt-3 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">Dengan {rupiah(plan)}/bulan target baru tercapai setelah hari-H. Tambah sekitar {rupiah(needPerMonth - plan)}/bulan, atau kurangi target.</p>
      )}

      <h2 className="mt-6 mb-3 text-2xl font-semibold">Riwayat setoran</h2>
      {savings.entries.length === 0 ? (
        <Empty icon={<PiggyBank className="size-6" />} title="Belum ada setoran">Catat setiap kali kalian menyisihkan dana nikah — sekecil apa pun.</Empty>
      ) : (
        <ul className="card divide-y divide-border/70">
          {[...savings.entries].sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
            <li key={e.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{name(e.by)}{e.note && <span className="font-normal text-muted-foreground"> · {e.note}</span>}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(e.date)}</p>
              </div>
              <span className="font-semibold tabular-nums text-success">+{rupiah(e.amount)}</span>
              <ConfirmButton onConfirm={() => setSavings({ entries: savings.entries.filter((x) => x.id !== e.id) })}><Trash2 className="size-4" /></ConfirmButton>
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!draft} onClose={() => setDraft(null)} title="Catat setoran"
        footer={<><button className="btn-ghost" onClick={() => setDraft(null)}>Batal</button><button className="btn-primary" onClick={save} disabled={!draft?.amount}>Simpan</button></>}>
        <Field label="Jumlah" htmlFor="sa"><MoneyInput id="sa" value={draft?.amount ?? 0} onChange={(n) => setDraft({ ...draft, amount: n })} /></Field>
        <div>
          <p className="label">Dari</p>
          <Segmented label="Dari" value={draft?.by ?? me} onChange={(by) => setDraft({ ...draft, by })} options={[{ value: 'A', label: profile.partnerA }, { value: 'B', label: profile.partnerB }]} />
        </div>
        <Field label="Tanggal" htmlFor="sd"><input id="sd" type="date" className="input" value={draft?.date ?? ''} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></Field>
        <Field label="Catatan" htmlFor="sn"><input id="sn" className="input" value={draft?.note ?? ''} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="mis. bonus akhir tahun" /></Field>
      </Modal>
    </div>
  )
}
