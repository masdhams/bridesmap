// Merakit hasil `vite build` jadi SATU file HTML untuk OrderHero > Custom HTML > File HTML.
// Pakai:  node orderhero-lp/build.mjs
// Opsional: orderhero-lp/images.json  { "/lp/hero-bundle.webp": "https://cdn..." }  -> alamat gambar dari Galeri OrderHero
//           env APP_ORIGIN=https://alamat-app-kalian  -> dipakai untuk tautan "Preview" undangan (/undangan/...)
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const dist = 'orderhero-lp/dist/assets'
const files = readdirSync(dist)
const js = readFileSync(join(dist, files.find((f) => f.endsWith('.js'))), 'utf8')
const css = readFileSync(join(dist, files.find((f) => f.endsWith('.css'))), 'utf8')

const images = existsSync('orderhero-lp/images.json') ? JSON.parse(readFileSync('orderhero-lp/images.json', 'utf8')) : {}
const origin = (process.env.APP_ORIGIN ?? '').replace(/\/$/, '')

let code = js
for (const [from, to] of Object.entries(images)) code = code.split(from).join(to)
if (origin) for (const p of ['taman-klasik', 'sage', 'noir', 'red-retro']) code = code.split(`/undangan/${p}`).join(`${origin}/undangan/${p}`)
code = code.replace(/<\/script/gi, '<\/script')

const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#FBF8F2" />
<title>Bridesmap — Your Wedding Planner, Made for Two</title>
<meta name="description" content="Atur budget per acara, catat biaya yang sering kelewat, pantau jadwal bayar vendor, sampai kirim undangan digital. Semua kebutuhan nikah kalian di satu tempat." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script type="module">${code}</script>
</body>
</html>`

mkdirSync('orderhero-lp/out', { recursive: true })
writeFileSync('orderhero-lp/out/bridesmap-lp.html', html)
const missing = Object.keys(images).length === 0 ? ' (belum ada images.json: gambar masih memakai alamat relatif)' : ''
console.log(`bridesmap-lp.html ${(html.length / 1024).toFixed(0)} KB, ${Object.keys(images).length} gambar dipetakan${missing}`)
