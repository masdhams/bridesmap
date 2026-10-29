// Ikon fitur & menu: Phosphor Icons (lisensi MIT), gaya duotone supaya terasa seperti ilustrasi kecil dua nada.
// Warnanya mengikuti `currentColor`, jadi diatur oleh warna teks pemakainya (Sirih/Sage/Mawar sesuai guideline).
// Ikon aksi kecil (panah, silang, plus, pensil) tetap memakai lucide-react.
import {
  AirplaneTilt,
  Armchair,
  BookOpenText,
  Buildings,
  CalendarCheck,
  Camera,
  Car,
  ChatsCircle,
  Dress,
  Envelope,
  EnvelopeSimple,
  FileText,
  FolderOpen,
  Flower,
  ForkKnife,
  GearSix,
  Gift,
  Globe,
  Heart,
  House,
  ListChecks,
  MusicNotes,
  Palette,
  PiggyBank,
  ShieldCheck,
  SquaresFour,
  Storefront,
  UsersThree,
  Wallet,
  WarningCircle,
  type Icon as PhIcon,
} from '@phosphor-icons/react'
import type { ComponentType, CSSProperties } from 'react'

export interface IconProps {
  className?: string
  style?: CSSProperties
  /** Diterima agar sejajar dengan pemakaian ikon lucide; tidak dipakai oleh Phosphor. */
  strokeWidth?: number
  'aria-hidden'?: boolean | 'true' | 'false'
}

/** Tipe ikon yang dipakai menu & kartu: menerima ikon Phosphor (lewat pembungkus di bawah) maupun lucide. */
export type AppIcon = ComponentType<IconProps>

function duo(I: PhIcon, name: string): AppIcon {
  const C = ({ className, style }: IconProps) => <I weight="duotone" className={className ? `ic-duo ${className}` : 'ic-duo'} style={style} aria-hidden />
  C.displayName = name
  return C
}

// Menu & fitur
export const IcHome = duo(House, 'IcHome')
export const IcChecklist = duo(ListChecks, 'IcChecklist')
export const IcDocs = duo(FolderOpen, 'IcDocs')
export const IcRundown = duo(CalendarCheck, 'IcRundown')
export const IcBudget = duo(Wallet, 'IcBudget')
export const IcVendor = duo(Storefront, 'IcVendor')
export const IcSavings = duo(PiggyBank, 'IcSavings')
export const IcSeserahan = duo(Gift, 'IcSeserahan')
export const IcGuests = duo(UsersThree, 'IcGuests')
export const IcSeating = duo(Armchair, 'IcSeating')
export const IcWebsite = duo(Globe, 'IcWebsite')
export const IcLove = duo(Heart, 'IcLove')
export const IcDeepTalk = duo(ChatsCircle, 'IcDeepTalk')
export const IcLetter = duo(Envelope, 'IcLetter')
export const IcVision = duo(Palette, 'IcVision')
export const IcHoneymoon = duo(AirplaneTilt, 'IcHoneymoon')
export const IcSettings = duo(GearSix, 'IcSettings')
export const IcAllFeatures = duo(SquaresFour, 'IcAllFeatures')
export const IcGuide = duo(BookOpenText, 'IcGuide')

// Kategori budget
export const IcVenue = duo(Buildings, 'IcVenue')
export const IcCatering = duo(ForkKnife, 'IcCatering')
export const IcDecor = duo(Flower, 'IcDecor')
export const IcAttire = duo(Dress, 'IcAttire')
export const IcPhoto = duo(Camera, 'IcPhoto')
export const IcInvitation = duo(EnvelopeSimple, 'IcInvitation')
export const IcTransport = duo(Car, 'IcTransport')
export const IcAdmin = duo(FileText, 'IcAdmin')
export const IcEntertainment = duo(MusicNotes, 'IcEntertainment')
export const IcReserve = duo(ShieldCheck, 'IcReserve')
export const IcHiddenCost = duo(WarningCircle, 'IcHiddenCost')
