import type { SVGProps } from 'react'
import { cn } from '../../lib/utils'

/** Bintang empat sudut, ornamen pembuka bagian dan penanda garis waktu. Warna mengikuti `text-*`. */
export default function Sparkle({ className, ...rest }: SVGProps<SVGSVGElement> & { 'data-reveal'?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" className={cn('size-4 flex-none', className)} {...rest}>
      <path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0Z" />
    </svg>
  )
}
