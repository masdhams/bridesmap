import { PublicPage } from '../components/PublicLayout'
import { BRAND, LEGAL } from '../data/content'

// TODO(product owner): semua teks di halaman ini adalah draf — tinjau sebelum rilis publik.
export default function About() {
  return (
    <PublicPage>
      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 space-y-12">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Tentang & kebijakan</p>
          <h1 className="mt-2 text-5xl font-semibold">Transparan sejak awal</h1>
          <p className="mt-3 text-muted-foreground">Kami percaya alat perencanaan pernikahan harus jelas soal siapa pembuatnya dan bagaimana data kalian dijaga.</p>
        </header>

        <section id="pembuat" className="scroll-mt-24">
          <h2 className="text-3xl font-semibold">Siapa pembuatnya</h2>
          <p className="mt-3 text-ink">
            {BRAND.product} dibuat oleh <strong>{LEGAL.maker}</strong>. Kami bukan wedding organizer dan tidak menerima komisi dari vendor mana pun. Pertanyaan, kritik, atau masalah: <a className="text-primary underline" href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
          </p>
        </section>

        <section id="privasi" className="scroll-mt-24">
          <h2 className="text-3xl font-semibold">Privasi data</h2>
          <ul className="mt-3 list-disc pl-5 space-y-1.5 text-ink">
            <li>Rencana pernikahan, tamu, vendor, dan foto yang kalian isi disimpan di server agar bisa dibuka dari perangkat mana pun. Data hanya bisa dibuka oleh akun kalian sendiri.</li>
            <li>Pengelola hanya membuka data kalian untuk keperluan teknis yang sangat terbatas, seperti memperbaiki masalah yang kalian laporkan, dan selalu atas izin kalian.</li>
            <li>Data dikirim lewat koneksi terenkripsi (HTTPS). Koneksi Google Calendar disimpan terenkripsi, dan hanya judul serta tanggal tugas yang dikirim ke Google. Nominal budget tidak pernah dikirim.</li>
            <li>Kami tidak menjual atau membagikan data ke pihak ketiga tanpa izin kalian.</li>
            <li>Kalian bisa mengekspor data kapan saja dari menu Pengaturan.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-3xl font-semibold">Yang bukan layanan kami</h2>
          <p className="mt-3 text-ink">
            Bridesmap <strong>bukan</strong> rekening bersama/escrow, bukan asuransi, dan tidak menjamin vendor. Fitur pelacakan pembayaran membantu kalian membayar sesuai jadwal dan menyimpan bukti — keputusan memilih vendor tetap di tangan kalian. Selalu periksa kontrak tertulis dan legalitas vendor sebelum membayar DP.
          </p>
        </section>
      </article>
    </PublicPage>
  )
}
