import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import { useAuth } from './lib/auth'
import { usePlan } from './lib/store'
import About from './pages/About'
import Landing from './pages/Landing'
import LupaSandi from './pages/LupaSandi'
import Masuk from './pages/Masuk'
import Onboarding from './pages/Onboarding'
import LiveInvitation from './pages/LiveInvitation'
import InvitationEditor from './pages/app/InvitationEditor'
import Allocation from './pages/app/Allocation'
import Berdua from './pages/app/Berdua'
import Budget from './pages/app/Budget'
import Checklist from './pages/app/Checklist'
import Administration from './pages/app/Administration'
import Dashboard from './pages/app/Dashboard'
import Guide from './pages/app/Guide'
import DeepTalk from './pages/app/DeepTalk'
import Guests from './pages/app/Guests'
import Honeymoon from './pages/app/Honeymoon'
import HoneymoonItinerary from './pages/app/HoneymoonItinerary'
import More from './pages/app/More'
import Rundown from './pages/app/Rundown'
import Savings from './pages/app/Savings'
import Seating from './pages/app/Seating'
import Seserahan from './pages/app/Seserahan'
import Settings from './pages/app/Settings'
import LetterWrite from './pages/app/LetterWrite'
import Letters from './pages/app/Letters'
import VendorDetail from './pages/app/VendorDetail'
import Vendors from './pages/app/Vendors'
import Vision from './pages/app/Vision'
import BudgetCalculator from './pages/tools/BudgetCalculator'
import FreeChecklist from './pages/tools/FreeChecklist'
import RedRetroInvitation from './pages/invitations/RedRetroInvitation'
import NoirInvitation from './pages/invitations/NoirInvitation'
import SageInvitation from './pages/invitations/SageInvitation'
import ToolsIndex from './pages/tools/ToolsIndex'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, ready, planReady } = useAuth()
  const { pathname, search } = useLocation()
  if (!ready || (session && !planReady)) return <div className="min-h-dvh" />
  if (!session) return <Navigate to={`/masuk?next=${encodeURIComponent(pathname + search)}`} replace />
  return <>{children}</>
}

function RequirePlan({ children }: { children: React.ReactNode }) {
  const onboarded = usePlan((s) => s.profile.onboarded)
  return onboarded ? <>{children}</> : <Navigate to="/mulai" replace />
}

/** Pengalihan rute lama yang tetap membawa query (mis. `?to=Nama+Tamu`). */
/** Tautan website lama (/w/:slug) diarahkan ke undangan digital (/u/:slug). */
function SlugRedirect() {
  const { slug } = useParams()
  return <KeepQueryRedirect to={`/u/${slug}`} />
}

function KeepQueryRedirect({ to }: { to: string }) {
  const { search } = useLocation()
  return <Navigate to={to + search} replace />
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/tentang" element={<About />} />
        <Route path="/masuk" element={<Masuk />} />
        <Route path="/lupa-sandi" element={<LupaSandi />} />
        <Route
          path="/mulai"
          element={
            <RequireAuth>
              <Onboarding />
            </RequireAuth>
          }
        />
        <Route path="/alat" element={<ToolsIndex />} />
        <Route path="/alat/kalkulator-budget" element={<BudgetCalculator />} />
        <Route path="/alat/checklist" element={<FreeChecklist />} />
        <Route path="/w/:slug" element={<SlugRedirect />} />
        <Route path="/u/:slug" element={<LiveInvitation />} />
        <Route path="/undangan/sage" element={<SageInvitation />} />
        <Route path="/undangan/noir" element={<NoirInvitation />} />
        <Route path="/undangan/red-retro" element={<RedRetroInvitation />} />
        <Route path="/undangan/kliping" element={<KeepQueryRedirect to="/undangan/red-retro" />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <RequirePlan>
                <AppLayout />
              </RequirePlan>
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="budget" element={<Budget />} />
          <Route path="budget/alokasi" element={<Allocation />} />
          <Route path="vendor" element={<Vendors />} />
          <Route path="vendor/:id" element={<VendorDetail />} />
          <Route path="tabungan" element={<Savings />} />
          <Route path="checklist" element={<Checklist />} />
          <Route path="administrasi" element={<Administration />} />
          <Route path="tamu" element={<Guests />} />
          <Route path="tempat-duduk" element={<Seating />} />
          <Route path="seserahan" element={<Seserahan />} />
          <Route path="rundown" element={<Rundown />} />
          <Route path="vision-board" element={<Vision />} />
          <Route path="berdua" element={<Berdua />} />
          <Route path="deep-talk" element={<DeepTalk />} />
          <Route path="surat" element={<Letters />} />
          <Route path="surat/tulis" element={<LetterWrite />} />
          <Route path="time-capsule" element={<Navigate to="/app/surat" replace />} />
          <Route path="time-capsule/tulis" element={<Navigate to="/app/surat/tulis" replace />} />
          <Route path="honeymoon" element={<Honeymoon />} />
          <Route path="honeymoon/itinerary" element={<HoneymoonItinerary />} />
          <Route path="website" element={<Navigate to="/app/undangan" replace />} />
          <Route path="undangan" element={<InvitationEditor />} />
          <Route path="lainnya" element={<More />} />
          <Route path="pengaturan" element={<Settings />} />
          <Route path="panduan" element={<Guide />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
