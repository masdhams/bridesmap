// Logika Administrasi ↔ Checklist: tugas yang terhubung ke dokumen otomatis selesai
// kalau semua dokumennya berstatus "ada", dan dibuka lagi kalau ada yang dicabut.
import { DOC_TEMPLATES } from '../data/content'
import type { DocItem, Partner, Task } from './types'
import { uid } from './utils'

/** Dokumen yang terhubung ke satu tugas + progresnya. */
export function docProgress(taskId: string, docs: DocItem[]) {
  const linked = docs.filter((d) => d.taskId === taskId)
  return { linked, ready: linked.filter((d) => d.status === 'ada').length, total: linked.length }
}

/**
 * Samakan status tugas dengan dokumennya.
 * Tugas hanya dibuka lagi kalau tadinya selesai otomatis (`autoDone`), jadi centang manual pengguna tidak pernah diubah.
 */
export function syncTasks(tasks: Task[], prev: DocItem[], next: DocItem[], by?: Partner): Task[] {
  const complete = (id: string, docs: DocItem[]) => {
    const { total, ready } = docProgress(id, docs)
    return total > 0 && ready === total
  }
  return tasks.map((t) => {
    const now = complete(t.id, next)
    // Hanya saat dokumen BARU saja lengkap, supaya tugas yang dibuka manual tidak dicentang ulang sendiri.
    if (now && !complete(t.id, prev) && !t.done) return { ...t, done: true, doneBy: by, autoDone: true }
    if (!now && t.done && t.autoDone) return { ...t, done: false, doneBy: undefined, autoDone: false }
    return t
  })
}

/** Daftar dokumen awal, dihubungkan ke tugas checklist lewat judulnya. */
export function buildDocuments(tasks: Task[]): DocItem[] {
  return DOC_TEMPLATES.map((d) => ({
    id: uid(),
    name: d.name,
    group: d.group,
    owner: d.owner,
    status: 'belum' as const,
    taskId: d.taskTitle ? tasks.find((t) => t.title === d.taskTitle)?.id : undefined,
  }))
}
