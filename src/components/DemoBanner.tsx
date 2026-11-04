import { useEffect, useState } from 'react'
import { DEMO, exitDemo, useDemoNotice } from '../lib/demo'

/** Pita "Mode demo" di atas halaman, plus pesan singkat setiap kali pengunjung mencoba mengubah data. */
export function DemoBanner() {
  const at = useDemoNotice((s) => s.at)
  const [show, setShow] = useState(false)
  useEffect(() => {
    if (!at) return
    setShow(true)
    const t = setTimeout(() => setShow(false), 2600)
    return () => clearTimeout(t)
  }, [at])

  if (!DEMO) return null
  return (
    <>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary px-4 py-3 text-sm text-on-primary">
        <span>
          <strong>Mode demo.</strong> Ini contoh rencana yang sudah terisi, hanya untuk dilihat. Perubahan tidak disimpan.
        </span>
        <button type="button" className="btn btn-sm bg-white text-ink hover:bg-primary-soft" onClick={exitDemo}>
          Keluar demo
        </button>
      </div>
      {show && (
        <div role="status" className="no-print fixed inset-x-0 bottom-24 z-50 mx-auto w-fit max-w-[90vw] rounded-full bg-ink px-4 py-2.5 text-center text-sm text-white shadow-lg lg:bottom-8">
          Ini mode demo, perubahan tidak disimpan.
        </div>
      )}
    </>
  )
}
