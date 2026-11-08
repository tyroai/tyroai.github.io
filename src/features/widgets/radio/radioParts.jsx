import { useEffect, useState } from "react"
import { initials } from "@/lib/radio"
import { cn } from "@/lib/utils"
import { stationFallbackArt } from "./stage/stageArt"
import "./radio.css"

const ART = {
  xs: { box: "size-7 rounded-lg text-[0.5625rem]", min: 16 },
  sm: { box: "size-9 rounded-lg text-[0.625rem]", min: 16 },
  md: { box: "size-14 rounded-xl text-[0.875rem]", min: 24 },
  lg: { box: "size-24 rounded-2xl text-[1.375rem]", min: 40 },
}

// Yüklenmiş kapaklar (adres → yeterince büyük mü): yeniden açılan yerde (hapın kartı) logo
// yedekten yeniden solarak gelmesin.
const LOADED = new Map()

/**
 * İstasyonun kapağı: logo, yedek kapağın ÜSTÜNDE ve ancak yüklenip yeterince büyük çıkınca
 * belirir (bozuk adres ya da bulanık kalacak kadar küçük favicon boş kutu bırakmaz). Yedek kapak
 * Tyrofy koleksiyonundan, istasyona göre sabit bir görsel ve üstünde baş harfleri — resimsiz
 * kanal yok (`stage/stageArt` › `stationFallbackArt`).
 */
export function StationArt({ station, size = "md", className }) {
  const s = ART[size]
  const src = station?.favicon || ""
  const [seen, setSeen] = useState(() => ({ src, ok: LOADED.get(src) ?? false }))
  const ok = Boolean(src) && (seen.src === src ? seen.ok : LOADED.get(src) === true)
  const fallback = stationFallbackArt(station)
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden font-bold tracking-tight text-brand-on-ramp ring-1 ring-(--r-edge)",
        ok ? "bg-(--r-tile)" : "radio-art-fallback",
        s.box,
        className,
      )}
    >
      {!ok && (
        <>
          <img
            src={fallback.src}
            alt=""
            loading="lazy"
            decoding="async"
            style={{ objectPosition: fallback.pos }}
            className="absolute inset-0 size-full object-cover"
          />
          <span className="radio-art-initials">{initials(station?.name)}</span>
        </>
      )}
      {src && (
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={(e) => {
            const ok = e.currentTarget.naturalWidth >= s.min
            LOADED.set(src, ok)
            setSeen({ src, ok })
          }}
          onError={() => {
            LOADED.set(src, false)
            setSeen({ src, ok: false })
          }}
          className={cn(
            "absolute inset-0 size-full transition-opacity duration-300",
            station?.art === "cover" ? "object-cover" : "object-contain p-[10%]",
            ok ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </span>
  )
}

const BARS = [0, 1, 2, 3]

/**
 * Çalarken dans eden çubuklar (süs); azaltılmış harekette durur, çalmıyorsa alçak. Dans CSS'te
 * (`radio.css` › `radio-eq-*`): bileştiricide döner ve dinlenme kipinde durur — `motion`un kare
 * döngüsü radyo çaldıkça her karede stil yazıyordu (docs/performance.md).
 */
export function Equalizer({ playing, className, bar = "bg-(--r-eq)" }) {
  return (
    <span
      aria-hidden="true"
      data-playing={playing ? "" : undefined}
      className={cn("radio-eq flex h-3.5 items-end gap-[2px]", className)}
    >
      {BARS.map((i) => (
        <span key={i} className={cn("h-full w-[3px] origin-bottom rounded-full", bar)} />
      ))}
    </span>
  )
}

/** "CANLI" hapı: kırmızı nabız (yayın dili) — koyu kartta. */
export function LiveBadge({ label }) {
  return (
    <span className="inline-flex h-5 shrink-0 items-center gap-1.5 rounded-full bg-(--r-hover) px-2 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-(--r-fg)">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 motion-reduce:animate-none" />
        <span className="relative inline-flex size-1.5 rounded-full bg-red-500" />
      </span>
      {label}
    </span>
  )
}

const pad = (n) => String(n).padStart(2, "0")

/** Dinleme süresi (d:ss, bir saatten sonra s:dd:ss) — saniyede bir, yalnız çalarken. */
export function Elapsed({ since, className }) {
  // Şimdiden başlar: sonradan açılan yerde (hapın kartı) bir an "0:00" görünmesin.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!since) return undefined
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [since])
  if (!since) return null
  const s = Math.max(0, Math.floor((now - since) / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor(s / 60) % 60
  const text = h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`
  return <span className={cn("tabular-nums", className)}>{text}</span>
}

/**
 * İnce canlı yayın çizgisi: paletin degradesi (Renkli görünümde zemin zaten degrade:
 * mürekkep renginde, `solid`); çalarken üzerinde ışık akar.
 */
export function LiveLine({ playing, solid, className }) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative block h-1 overflow-hidden rounded-full bg-(--r-track)", className)}
    >
      <span
        className={cn(
          "absolute inset-0 rounded-full transition-opacity duration-500",
          solid ? "bg-(--r-fg)" : "bg-gradient-to-r from-brand-from via-brand-via to-brand-to",
          playing ? "opacity-90" : "opacity-30",
        )}
      />
      {playing && (
        <span className="radio-live-sweep absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      )}
    </span>
  )
}
