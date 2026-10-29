// State rencana pernikahan. Saat ini disimpan di localStorage (satu perangkat) dan
// disinkronkan antar-tab secara langsung. Untuk kolaborasi 2 akun real-time (PRD #8),
// ganti lapisan `persist` ini dengan backend (mis. Supabase Realtime) — bentuk datanya tetap.
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { DEFAULT_SESERAHAN, HIDDEN_COSTS, HONEYMOON_BOOKINGS, HONEYMOON_PACKING, RUNDOWN_TEMPLATES, TASK_TEMPLATES } from '../data/content'
import * as alloc from './allocation'
import { buildDocuments, syncTasks } from './documents'
import type {
  BudgetCategory,
  EventKind,
  WeddingEvent,
  BudgetItem,
  DeepTalkAnswer,
  DocItem,
  Guest,
  GuestWishEntry,
  InvitationSettings,
  Honeymoon,
  Partner,
  Profile,
  RsvpResponse,
  RundownEvent,
  SeatTable,
  SeserahanItem,
  Savings,
  Task,
  TimeCapsule,
  Moment,
  Vendor,
  VisionBoard,
  Website,
} from './types'
import { slugify, todayISO, uid } from './utils'

export interface Collections {
  events: WeddingEvent[]
  categories: BudgetCategory[]
  items: BudgetItem[]
  vendors: Vendor[]
  tasks: Task[]
  guests: Guest[]
  tables: SeatTable[]
  seserahan: SeserahanItem[]
  rundown: RundownEvent[]
  boards: VisionBoard[]
  capsules: TimeCapsule[]
  moments: Moment[]
  rsvps: RsvpResponse[]
  documents: DocItem[]
  wishes: GuestWishEntry[]
}

type CollKey = keyof Collections
type ItemOf<K extends CollKey> = Collections[K][number]

export interface PlanState extends Collections {
  profile: Profile
  savings: Savings
  honeymoon: Honeymoon
  website: Website
  invitation: InvitationSettings
  deepTalk: Record<number, Partial<Record<Partner, DeepTalkAnswer>>>
  setProfile: (p: Partial<Profile>) => void
  setSavings: (p: Partial<Savings>) => void
  setHoneymoon: (p: Partial<Honeymoon>) => void
  setWebsite: (p: Partial<Website>) => void
  setInvitation: (p: Partial<InvitationSettings>) => void
  setInvitationPhotos: (p: Partial<InvitationSettings['photos']>) => void
  answerDeepTalk: (index: number, who: Partner, text: string) => void
  add: <K extends CollKey>(key: K, item: ItemOf<K>) => void
  update: <K extends CollKey>(key: K, id: string, patch: Partial<ItemOf<K>>) => void
  remove: <K extends CollKey>(key: K, id: string) => void
  replace: <K extends CollKey>(key: K, list: Collections[K]) => void
  /** Administrasi: simpan/hapus dokumen sekaligus menyelaraskan tugas checklist yang terhubung. */
  saveDocument: (doc: DocItem, by: Partner) => void
  removeDocument: (id: string, by: Partner) => void
  seedDocuments: () => void
  initPlan: (input: Pick<Profile, 'partnerA' | 'partnerB' | 'weddingDate' | 'city' | 'totalBudget' | 'guestEstimate'> & { events?: { kind: EventKind; name?: string }[]; allocation?: alloc.AllocState }) => void
  /** Alokasi budget per acara (PRD #39) */
  setEventBudget: (eventId: string, budget: number) => void
  setCategoryAllocation: (categoryId: string, allocated: number) => void
  setTotalBudget: (total: number) => void
  addEvent: (kind: EventKind, name: string) => string
  removeEvent: (eventId: string) => boolean
  resetEventAllocation: (eventId: string) => void
  toggleHiddenCost: (key: string) => void
  loadDemo: () => void
  importData: (json: string) => boolean
  reset: () => void
}

const emptyProfile: Profile = {
  partnerA: '',
  partnerB: '',
  weddingDate: '',
  city: '',
  totalBudget: 0,
  guestEstimate: 0,
  onboarded: false,
  partnerInvited: false,
  createdAt: '',
}

const emptyState = () => ({
  profile: { ...emptyProfile },
  events: [] as WeddingEvent[],
  categories: [] as BudgetCategory[],
  items: [] as BudgetItem[],
  vendors: [] as Vendor[],
  tasks: [] as Task[],
  guests: [] as Guest[],
  tables: [] as SeatTable[],
  seserahan: [] as SeserahanItem[],
  rundown: [] as RundownEvent[],
  boards: [] as VisionBoard[],
  capsules: [] as TimeCapsule[],
  moments: [] as Moment[],
  rsvps: [] as RsvpResponse[],
  documents: [] as DocItem[],
  wishes: [] as GuestWishEntry[],
  savings: { target: 0, monthlyPlan: 0, entries: [] } as Savings,
  honeymoon: { destination: '', budget: 0, itinerary: [], bookings: [], packing: [] } as Honeymoon,
  website: {
    slug: '',
    theme: 'modern',
    story: '',
    akadTime: '08:00',
    akadPlace: '',
    resepsiTime: '11:00',
    resepsiPlace: '',
    mapsUrl: '',
    rsvpEnabled: false,
  } as Website,
  invitation: {
    template: 'sage',
    personA: {},
    personB: {},
    timezone: 'WIB',
    quote: { text: 'Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan untukmu dari jenismu sendiri, agar kamu merasa tenteram kepadanya.', by: 'QS. Ar-Rum: 21' },
    story: [],
    accounts: [],
    giftAddress: '',
    families: '',
    photos: { gallery: [] },
  } as InvitationSettings,
  deepTalk: {} as PlanState['deepTalk'],
})

const hiddenCategory = (key: string, budget: number, guests: number): BudgetCategory | null => {
  const h = HIDDEN_COSTS.find((x) => x.key === key)
  if (!h) return null
  return { id: uid(), name: h.name.replace(/ \(.+\)$/, ''), allocated: Math.round(h.estimate({ budget, guests }) / 10000) * 10000, hidden: true, hiddenKey: key }
}

export const STORAGE_KEY = 'bridesmap-plan-v1'
const LEGACY_STORAGE_KEY = 'bride-behavior-plan-v1'

// Rencana yang disimpan dengan nama lama (sebelum rename ke Bridesmap) dipindah ke kunci baru, sekali saja.
try {
  if (!localStorage.getItem(STORAGE_KEY) && localStorage.getItem(LEGACY_STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, localStorage.getItem(LEGACY_STORAGE_KEY) as string)
  }
} catch {
  /* penyimpanan tidak tersedia */
}

/** True kalau penyimpanan browser penuh (biasanya karena banyak foto) sehingga perubahan terbaru gagal tersimpan. */
export const useStorageStatus = create<{ full: boolean }>(() => ({ full: false }))

// localStorage dibungkus agar kuota penuh tidak melempar error di tengah aksi; pengguna diberi peringatan jelas.
const safeStorage: Storage = {
  get length() {
    return localStorage.length
  },
  clear: () => localStorage.clear(),
  key: (i) => localStorage.key(i),
  getItem: (k) => localStorage.getItem(k),
  removeItem: (k) => localStorage.removeItem(k),
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v)
      if (useStorageStatus.getState().full) useStorageStatus.setState({ full: false })
    } catch {
      useStorageStatus.setState({ full: true })
    }
  },
}

/** Perkiraan pemakaian penyimpanan rencana (byte). Kuota browser umumnya ±5 MB. */
export const storageUsageBytes = () => {
  try {
    return (localStorage.getItem(STORAGE_KEY) ?? '').length * 2 // UTF-16
  } catch {
    return 0
  }
}

export const usePlan = create<PlanState>()(
  persist(
    (set, get) => ({
      ...emptyState(),
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setSavings: (p) => set((s) => ({ savings: { ...s.savings, ...p } })),
      setHoneymoon: (p) => set((s) => ({ honeymoon: { ...s.honeymoon, ...p } })),
      setWebsite: (p) => set((s) => ({ website: { ...s.website, ...p } })),
      setInvitation: (p) => set((s) => ({ invitation: { ...s.invitation, ...p } })),
      setInvitationPhotos: (p) => set((s) => ({ invitation: { ...s.invitation, photos: { ...s.invitation.photos, ...p } } })),
      answerDeepTalk: (index, who, text) =>
        set((s) => ({ deepTalk: { ...s.deepTalk, [index]: { ...s.deepTalk[index], [who]: { text, at: new Date().toISOString() } } } })),
      add: (key, item) => set((s) => ({ [key]: [...s[key], item] }) as Partial<PlanState>),
      update: (key, id, patch) =>
        set((s) => ({ [key]: (s[key] as { id: string }[]).map((x) => (x.id === id ? { ...x, ...patch } : x)) }) as Partial<PlanState>),
      remove: (key, id) => set((s) => ({ [key]: (s[key] as { id: string }[]).filter((x) => x.id !== id) }) as Partial<PlanState>),
      replace: (key, list) => set({ [key]: list } as Partial<PlanState>),

      saveDocument: (doc, by) =>
        set((s) => {
          const stamped = { ...doc, updatedAt: new Date().toISOString(), updatedBy: by }
          const documents = s.documents.some((d) => d.id === doc.id) ? s.documents.map((d) => (d.id === doc.id ? stamped : d)) : [...s.documents, stamped]
          return { documents, tasks: syncTasks(s.tasks, s.documents, documents, by) }
        }),
      removeDocument: (id, by) =>
        set((s) => {
          const documents = s.documents.filter((d) => d.id !== id)
          return { documents, tasks: syncTasks(s.tasks, s.documents, documents, by) }
        }),
      seedDocuments: () =>
        set((s) => (s.profile.docsSeeded || !s.profile.onboarded ? s : { documents: buildDocuments(s.tasks), profile: { ...s.profile, docsSeeded: true } })),

      initPlan: (input) => {
        const { events: picks, allocation, ...profileInput } = input
        const { totalBudget: budget, guestEstimate: guests } = profileInput
        const hidden = HIDDEN_COSTS.filter((h) => h.defaultOn)
          .map((h) => hiddenCategory(h.key, budget, guests))
          .filter(Boolean) as BudgetCategory[]
        // Biaya tersembunyi yang dicentang dari awal disisihkan dulu; sisanya dibagi ke acara → kategori (PRD #39).
        const reserved = hidden.reduce((a, c) => a + c.allocated, 0)
        // Alokasi dari langkah "Atur alokasi" di onboarding dipakai apa adanya; kalau tidak ada, dibuat dari default.
        const plan = allocation ?? alloc.buildAllocation(Math.max(0, budget - reserved), picks ?? [])
        const tasks: Task[] = TASK_TEMPLATES.map((t) => ({ id: uid(), ...t, done: false, assignee: 'both' as const }))
        // Rundown mengikuti acara yang dipilih: template akad/resepsi dipakai bila ada, selain itu mulai kosong.
        const rundown: RundownEvent[] = plan.events.map((e) => {
          const tpl = RUNDOWN_TEMPLATES[e.kind === 'akad' ? 'Akad nikah' : e.kind === 'resepsi' ? 'Resepsi' : '']
          return { id: uid(), name: e.name, date: profileInput.weddingDate, items: (tpl ?? []).map((i) => ({ id: uid(), ...i })) }
        })
        set({
          ...emptyState(),
          profile: { ...emptyProfile, ...profileInput, onboarded: true, docsSeeded: true, createdAt: new Date().toISOString() },
          events: plan.events,
          categories: [...plan.categories, ...hidden],
          tasks,
          documents: buildDocuments(tasks),
          rundown,
          seserahan: DEFAULT_SESERAHAN.map((s) => ({ id: uid(), ...s, from: 'A' as Partner, ready: false })),
          boards: [{ id: uid(), name: 'Inspirasi utama', colors: ['#FBF8F2', '#E6EBDD', '#A9B59A', '#9A4E3B'], items: [] }],
          savings: { target: budget, monthlyPlan: 0, entries: [] },
          honeymoon: {
            destination: '',
            budget: 0,
            itinerary: [],
            bookings: HONEYMOON_BOOKINGS.map((label) => ({ id: uid(), label, done: false })),
            packing: HONEYMOON_PACKING.map((label) => ({ id: uid(), label, done: false })),
          },
          website: { ...emptyState().website, slug: slugify(`${profileInput.partnerA}-${profileInput.partnerB}`) || uid() },
          tables: Array.from({ length: 6 }, (_, i) => ({ id: uid(), name: `Meja ${i + 1}`, capacity: 8 })),
        })
      },

      setEventBudget: (eventId, budget) => {
        const s = get()
        const next = alloc.setEventBudget({ events: s.events, categories: s.categories }, eventId, budget)
        set({ events: next.events, categories: next.categories })
      },
      setCategoryAllocation: (categoryId, allocated) => set((s) => ({ categories: s.categories.map((c) => (c.id === categoryId ? { ...c, allocated: Math.max(0, Math.round(allocated)) } : c)) })),
      setTotalBudget: (total) => {
        const s = get()
        const next = alloc.setTotal({ events: s.events, categories: s.categories }, s.profile.totalBudget, total)
        set({ events: next.events, categories: next.categories, profile: { ...s.profile, totalBudget: total } })
      },
      addEvent: (kind, name) => {
        const s = get()
        const reserved = s.categories.filter((c) => c.hidden).reduce((a, c) => a + c.allocated, 0)
        const free = alloc.allocTotals(s.profile.totalBudget, s.events, reserved).free
        const r = alloc.addEvent({ events: s.events, categories: s.categories }, kind, name, free)
        set({ events: r.state.events, categories: r.state.categories })
        return r.id
      },
      // Acara yang masih punya vendor tidak dihapus supaya data pembayaran tidak ikut hilang.
      removeEvent: (eventId) => {
        const s = get()
        const ids = new Set(s.categories.filter((c) => c.eventId === eventId).map((c) => c.id))
        if (s.vendors.some((v) => ids.has(v.categoryId))) return false
        const next = alloc.removeEvent({ events: s.events, categories: s.categories }, eventId)
        set({ events: next.events, categories: next.categories, items: s.items.filter((i) => !ids.has(i.categoryId)) })
        return true
      },
      resetEventAllocation: (eventId) => {
        const s = get()
        const next = alloc.resetEvent({ events: s.events, categories: s.categories }, eventId)
        set({ categories: next.categories })
      },

      toggleHiddenCost: (key) => {
        const s = get()
        const existing = s.categories.find((c) => c.hiddenKey === key)
        if (existing) {
          set({ categories: s.categories.filter((c) => c.id !== existing.id), items: s.items.filter((i) => i.categoryId !== existing.id) })
        } else {
          const c = hiddenCategory(key, s.profile.totalBudget, s.profile.guestEstimate)
          if (c) set({ categories: [...s.categories, c] })
        }
      },

      loadDemo: () => {
        const s = get()
        const cat = (name: string) => s.categories.find((c) => c.name === name)?.id ?? s.categories[0]?.id ?? ''
        const wd = s.profile.weddingDate || todayISO()
        const shift = (days: number) => {
          const d = new Date(wd)
          d.setDate(d.getDate() + days)
          return d.toISOString().slice(0, 10)
        }
        const vendors: Vendor[] = [
          {
            id: uid(), categoryId: cat('Venue'), name: 'Gedung Serbaguna Melati (contoh)', contact: '0812-0000-0001', quote: 19500000, agreedPrice: 18000000, status: 'booked',
            payments: [
              { id: uid(), label: 'DP 30%', amount: 5400000, dueDate: shift(-275), paidDate: shift(-276) },
              { id: uid(), label: 'Termin 2', amount: 6300000, dueDate: shift(-60) },
              { id: uid(), label: 'Pelunasan', amount: 6300000, dueDate: shift(-14) },
            ],
          },
          {
            id: uid(), categoryId: cat('Katering'), name: 'Katering Rasa Nusantara (contoh)', contact: '0812-0000-0002', quote: 27000000, agreedPrice: 25000000, status: 'booked',
            payments: [
              { id: uid(), label: 'DP', amount: 7500000, dueDate: shift(-265) },
              { id: uid(), label: 'Pelunasan', amount: 17500000, dueDate: shift(-7) },
            ],
          },
          { id: uid(), categoryId: cat('Dokumentasi'), name: 'Studio Cahaya (contoh)', contact: '0812-0000-0003', quote: 6500000, status: 'negosiasi', payments: [] },
          { id: uid(), categoryId: cat('Dokumentasi'), name: 'Lensa Kita Photo (contoh)', contact: '0812-0000-0004', quote: 7500000, status: 'kandidat', payments: [] },
        ]
        const names = ['Bu Sri', 'Pak Darto', 'Rina', 'Dimas', 'Tante Lia', 'Om Hendra', 'Sarah', 'Fajar', 'Kak Nadia', 'Yoga']
        const groups = ['Keluarga', 'Keluarga', 'Teman kuliah', 'Teman kantor', 'Keluarga', 'Keluarga', 'Teman kantor', 'Teman kuliah', 'Keluarga', 'Teman SMA']
        const rsvp = ['hadir', 'hadir', 'belum', 'hadir', 'ragu', 'tidak', 'belum', 'hadir', 'hadir', 'belum'] as const
        const guests: Guest[] = names.map((name, i) => ({
          id: uid(), name: `${name} (contoh)`, group: groups[i], side: i % 2 ? 'B' : 'A', pax: i % 3 === 0 ? 2 : 1, rsvp: rsvp[i],
        }))
        set({ vendors: [...s.vendors, ...vendors], guests: [...s.guests, ...guests] })
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json)
          if (!data?.profile) return false
          set({ ...emptyState(), ...data })
          return true
        } catch {
          return false
        }
      },

      reset: () => set(emptyState()),
    }),
    { name: STORAGE_KEY, version: 1, storage: createJSONStorage(() => safeStorage) },
  ),
)

// Sinkron antar-tab: perubahan dari tab lain langsung terlihat (simulasi kolaborasi di satu perangkat).
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) usePlan.persist.rehydrate()
  })
}

/** Sesi aktif: siapa yang sedang memakai app di perangkat/tab ini. */
interface SessionState {
  me: Partner
  setMe: (p: Partner) => void
}
export const useSession = create<SessionState>()(
  persist((set) => ({ me: 'A', setMe: (me) => set({ me }) }), { name: 'bridesmap-session', storage: createJSONStorage(() => sessionStorage) }),
)

export function exportData() {
  const s = usePlan.getState()
  const data = Object.fromEntries(Object.entries(s).filter(([, v]) => typeof v !== 'function'))
  return JSON.stringify(data, null, 2)
}
