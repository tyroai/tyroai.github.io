import { useSyncExternalStore } from "react"

/**
 * Dinlenme kipi — pencere odakta değilken ya da bir dakika dokunulmayınca SONSUZ döngülü süs
 * animasyonları (çentiğin camı, küre, hava efektleri…) olduğu yerde durur, kişi dönünce kaldığı
 * yerden sürer. Sekme açık bırakılıp başka işle uğraşılırken bunlar işlemciyi boşuna yakıyordu;
 * grafik hızlandırması olmayan makinede (uzak/sanal masaüstü) bir çekirdeği dolduracak kadar
 * (docs/performance.md). Bir kerelik animasyonlara (pencere açılışı, bildirim) dokunulmaz:
 * başka uygulamadayken gelen toplantı uyarısı görünür kalmalı. Gizli sekmeyi tarayıcı durdurur.
 *
 * ⚠️ Durdurma `pause()` değil HIZ 0: `pause()/play()` görmüş CSS animasyonu CSS'in
 * `animation-play-state` kuralını bir daha dinlemiyor (hava kartının `data-live`ı, okuma küresi,
 * çentik parıltısı bozulurdu — ölçüldü). Hız 0 kuralı bozmuyor, işlemciyi aynı biçimde sıfırlıyor.
 */
export const IDLE_MS = 60_000
const CHECK_MS = 5_000
const INPUT = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"]

let rest = false
let lastInput = 0
// Açılış sakinliği: sayfa odakta değilken açıldıysa (arka plan sekmesi, DevTools'tan Lighthouse)
// açılışın ilk saniyelerinde CSS animasyonları kare üretmez (`settle`). İlk odakla ya da en geç
// CALM_MS sonra biter: sınırsız kalsa geç odaklanan sayfada girişler hiç oynamazdı.
const CALM_MS = 15_000
// Bundan uzun tek seferlik animasyon süs değil zamanlayıcıdır (hikâye çubuğu 7 sn ve `animationend`
// ile ilerler): bitirilmez, yoksa hikâyeler art arda geçip görüntüleyici kendiliğinden kapanırdı.
const TIMER_MS = 3_000
let calm = null // { doc, win, timer, queue, pending, frame }
const held = new Map()
const subs = new Set()

function holdOne(a) {
  if (held.has(a) || a.effect?.getTiming?.().iterations !== Infinity) return false
  held.set(a, a.playbackRate)
  a.playbackRate = 0
  return true
}

function hold(doc) {
  // Öğesi silinen animasyon "idle" olur: tutulanlardan düşer, yoksa öğesiyle bellekte kalırdı.
  for (const a of held.keys()) if (a.playState === "idle") held.delete(a)
  for (const a of doc.getAnimations?.() ?? []) holdOne(a)
}

// Aynı karede başlayanlar o karenin rAF'ında topluca (olaylar gönderildikten sonra, boyamadan
// önce). Olay başına mikro görev toplamıyordu: her dinleyiciden hemen sonra koşuyor.
function settle(e) {
  if (!calm) return
  calm.queue.push(e)
  if (calm.pending) return
  calm.pending = true
  calm.frame = calm.win.requestAnimationFrame?.(flushCalm)
}

/**
 * Sakinlikte başlayanlar, karede bir kez: sonsuz döngü tutulur, kısa CSS girişi son hâline atlar.
 * Bakan yokken her kare boşa — DevTools açıkken ölçülen açılışta kare başına ~250 ms'lik görevler
 * oluyordu (kartların yükselişi, doldurma, küre girişi). `finish()` son hâli kalıcı yapar: odak
 * gelince tekrar oynamaz. Belgeden tek okuma, önce hepsi okunur, sonra yazılır: Chromium'da öğe
 * başına `getAnimations()` O(N) ve her `finish()` stili yeniden hesaplatıyor — aynı karede yüzlerce
 * girişte saniyeler (ölçüldü: 1000 öğe 2,4 sn → 0,1 sn altı). Geçişe (transition) ve JS animasyonuna,
 * hızı 0 olana (başkasının durdurduğu) ve zamanlayıcı uzunluğundakine dokunulmaz.
 */
function flushCalm() {
  if (!calm) return
  // Öğe → başlayan parçaları ("" öğenin kendisi, "::after" sözde öğe).
  const started = new Map()
  for (const e of calm.queue.splice(0)) {
    if (!started.has(e.target)) started.set(e.target, new Set())
    started.get(e.target).add(e.pseudoElement || "")
  }
  calm.pending = false
  const loops = []
  const intros = []
  for (const a of calm.doc.getAnimations?.() ?? []) {
    if (held.has(a)) continue
    if (a.effect?.getTiming?.().iterations === Infinity) loops.push(a)
    else if (
      "animationName" in a &&
      started.get(a.effect?.target)?.has(a.effect?.pseudoElement || "") &&
      a.playState === "running" &&
      a.playbackRate !== 0 &&
      (a.effect.getComputedTiming?.().activeDuration ?? 0) <= TIMER_MS
    )
      intros.push(a)
  }
  for (const a of loops) holdOne(a)
  for (const a of intros) {
    try {
      a.finish()
    } catch {
      // Bitirilemeyen (ör. arada hızı değişmiş) olduğu gibi oynar; bu bir süs, hata değil.
    }
  }
}

function endCalm() {
  if (!calm) return
  calm.doc.removeEventListener?.("animationstart", settle, true)
  calm.win.clearTimeout?.(calm.timer)
  if (calm.pending) calm.win.cancelAnimationFrame?.(calm.frame)
  calm = null
}

function release() {
  for (const [a, rate] of held) if (a.playbackRate === 0) a.playbackRate = rate || 1
  held.clear()
}

function setRest(next, doc) {
  if (next === rest) return
  rest = next
  if (next) hold(doc)
  else {
    endCalm()
    release()
  }
  for (const fn of subs) fn()
}

/**
 * Önyüklemede bir kez (`main.jsx`). Girdi olayları yalnız zaman damgası yazar; karar 5 sn'de bir
 * verilir. Dinlenirken yeni başlayan döngüler (sayfa değişti, küre yeniden kuruldu) de tutulur.
 * Odak sayfanın içindeki bir çerçeveye (dosya önizlemesi) geçerse sayfa odakta sayılır
 * (`hasFocus`).
 */
export function startRestMode(win = typeof window === "undefined" ? null : window) {
  if (!win) return () => {}
  const doc = win.document
  const now = () => win.performance.now()
  lastInput = now()
  const active = () => {
    lastInput = now()
    if (rest && doc.hasFocus()) setRest(false, doc)
  }
  const check = () => {
    const away = !doc.hasFocus() || now() - lastInput >= IDLE_MS
    if (away && rest) hold(doc)
    else setRest(away, doc)
  }
  for (const e of INPUT) win.addEventListener(e, active, { passive: true, capture: true })
  win.addEventListener("focus", active)
  win.addEventListener("blur", check)
  const timer = win.setInterval(check, CHECK_MS)
  // Odaksız açılış: ilk denetimi (5 sn) beklemeden dinlen — açılışın tamamı o boşluktaydı.
  if (!doc.hasFocus()) {
    calm = {
      doc,
      win,
      timer: win.setTimeout?.(endCalm, CALM_MS),
      queue: [],
      pending: false,
      frame: 0,
    }
    doc.addEventListener?.("animationstart", settle, true)
    setRest(true, doc)
  }
  return () => {
    for (const e of INPUT) win.removeEventListener(e, active, { capture: true })
    win.removeEventListener("focus", active)
    win.removeEventListener("blur", check)
    win.clearInterval(timer)
    endCalm()
    setRest(false, doc)
  }
}

/** Dinleniyor mu — kendi döngüsünü (rAF) çeviren bileşen için (ör. radyo çubukları). */
export const useRest = () =>
  useSyncExternalStore(
    (fn) => {
      subs.add(fn)
      return () => subs.delete(fn)
    },
    () => rest,
    () => false,
  )
