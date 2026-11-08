import { useEffect, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { useAgentAccess } from "@/hooks/useAgentAccess"
import { useIsInGroup } from "@/hooks/useIsInGroup"
import { isMsalConfigured } from "@/lib/msal"
import { ADMIN_GROUP_ID } from "@/lib/constants"
import { loadChatSession } from "@/lib/chatSession"
import { WARM_START } from "@/lib/warmStartPolicy"
import {
  DAILY_BRIEF,
  briefPromptFor,
  briefWindowId,
  canArmBrief,
  markBriefArmed,
  releaseBriefArm,
  resolveBriefWindow,
} from "@/lib/dailyBriefPolicy"
import { useLocale } from "@/hooks/useLocale"
import {
  prewarmTransport,
  prewarmConversation,
  getWarmTimings,
  getWarmState,
  WARM_COLD,
} from "@/lib/warmStart"

/**
 * Sohbeti kullanıcı açmadan ÖNCE ısıtır. Kendi çizmez.
 *
 * `DashboardLayout`ta mount edilir — bir sayfada DEĞİL, çünkü kullanıcı nereye
 * düşerse düşsün (dashboard, takvim, bir uygulama kartı) ısınma başlamalı.
 *
 * Politika (kim · hangi asistan · açık mı) `WARM_START`ta; burada yalnız onu
 * UYGULAYAN kod var. Mekanizma ise `warmStart.js`te — üçü ayrı, çünkü "ısıtma
 * nasıl yapılır" ile "kime yapılır" bağımsız sorular ve biri değişince öteki
 * okunmamalı.
 */
const norm = (v) => (v ?? "").trim().toLowerCase()

// Isınma sayfa yüklenip oturduktan SONRA (load + 3 sn): Copilot istemcisi (~53 KB), görüşme ve gün
// özeti yanıtı (~196 KB) açılışın ilk çizimi ve veri istekleriyle yarışıyordu (Anasayfa ölçümünde
// 1–2. saniyede). O arada sohbete giren kullanıcı için sohbet bugünkü gibi kendisi başlatır.
const SETTLE_MS = 3000

function usePageSettled() {
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    let timer = 0
    const arm = () => {
      timer = window.setTimeout(() => setSettled(true), SETTLE_MS)
    }
    if (document.readyState === "complete") arm()
    else window.addEventListener("load", arm, { once: true })
    return () => {
      window.removeEventListener("load", arm)
      window.clearTimeout(timer)
    }
  }, [])
  return settled
}

export function WarmStart() {
  const settled = usePageSettled()
  const { accounts } = useMsal()
  // Yalnız kişiye AÇIK asistanlar ve kilit cevabı geldikten sonra: ısıtma ücretli bir tur ve
  // sohbet ilk açık asistanı açıyor — kilitli asistanı ısıtmak devralınmayacak bir konuşmaya tur
  // harcamaktı. Kilit çözülmeden `openAgents` hepsini sayar (arayüz için fail-open), burada beklenir.
  const { openAgents: agents, ready: lockReady } = useAgentAccess()
  // Hook KOŞULSUZ çağrılır (React kuralı) — kararı aşağıda okuyoruz. Üç
  // değerli: `true` üye, `false` değil, `undefined` henüz çözülmedi. Kapı
  // KATI `=== true`: çözülmemiş bir cevabı "üye" saymak, ısıtmayı yetkisiz
  // kullanıcıda da başlatırdı (fail-closed).
  const isAdmin = useIsInGroup(ADMIN_GROUP_ID)
  const upn = norm(accounts[0]?.username)
  const { locale } = useLocale()

  // Gün özetinin KENDİ kapısı — ısıtmanınkinden ayrı, çünkü ikisi farklı
  // sorular: ısıtma "hızlansın mı", özet "bu kişiye faturalı bir AĞIR tur
  // harcayalım mı". Aynı şaltere bağlamak, birini açmak isteyeni öteki
  // maliyeti de kabul etmeye zorlardı.
  const briefAudienceOk =
    DAILY_BRIEF.enabled &&
    (DAILY_BRIEF.audience === "*"
      ? true
      : DAILY_BRIEF.audience === "admins"
        ? isAdmin === true
        : DAILY_BRIEF.audience.map(norm).includes(upn))

  const enabled =
    settled &&
    isMsalConfigured &&
    WARM_START.enabled &&
    // Oturum HER dalda şart: ısıtma bir Copilot Studio belirteci istiyor ve
    // hesap yoksa Aşama 1 zaten sessizce `false` dönerdi — ama o zaman "neden
    // ısınmıyor" sorusu politikada değil mekanizmada aranırdı.
    !!accounts.length &&
    (WARM_START.audience === "*"
      ? true
      : WARM_START.audience === "admins"
        ? isAdmin === true
        : WARM_START.audience.map(norm).includes(upn))

  useEffect(() => {
    if (!enabled) return
    // AŞAMA 1 — taşıma. Ajanla konuşulmaz, tur harcanmaz; bu yüzden
    // katalogun yüklenmesini de beklemez.
    prewarmTransport()
  }, [enabled])

  useEffect(() => {
    if (!enabled || !lockReady || !agents?.length) return
    // AŞAMA 2 — konuşma. Katalog geldikten SONRA: `agentId` (schemaName)
    // Dataverse'ten geliyor; katalog gelmeden liste boş ya da önbellekteki.
    const selected =
      WARM_START.agents === "*"
        ? agents
        : agents.filter((a) => WARM_START.agents.map(norm).includes(norm(a.name)))
    const targets = selected.slice(0, WARM_START.maxAgents)
    for (const agent of targets) {
      // ⚠️ Kayıtlı oturumun kuralı ve tek istisnası aşağıda, kararın
      // verildiği dalda yazılı. Buradaki not ölçüm: "devam eden konuşmada
      // kazanılacak bir şey yok" iddiası tyrotrade'de ölçüldü (2026-09-08)
      // ve YANLIŞLANDI — saatler sonra devam eden konuşmalarda MCP
      // başlatması bazen tekrar oluyor (init=3-4), bazen hiç olmuyor
      // (init=0). Hangi koşulda soğuduğu BİLİNMİYOR.
      const saved = loadChatSession(agent.id)

      // ── Gün özeti: bu pencerede sorulacak mı? ──
      const win = resolveBriefWindow()
      const windowId = win ? briefWindowId(new Date(), win) : null
      const question =
        briefAudienceOk &&
        windowId &&
        // Tek şalter tek anlam taşısın: ısıtma turu kapalıysa özet de yok.
        WARM_START.warmTurn &&
        // ⚠️ Uçaktakine faturalı tur attırma.
        navigator.onLine !== false &&
        canArmBrief(windowId) &&
        // ⚠️ Zaten ısınmakta olan bir asistana özet EKLENEMEZ (konuşma
        // kuruldu, sorusu gitti). Damgayı boşa yakmamak için önce bakılır.
        getWarmState(agent.agentId) === WARM_COLD
          ? briefPromptFor(agent.name, windowId, locale)
          : null

      // ⚠️ **KAYITLI OTURUM VARSA ISITMA YOK — TEK İSTİSNASIYLA.**
      // `resumeConversation` var olan konuşmaya HİÇ AĞ İSTEĞİ YAPMADAN
      // bağlanıyor ve ChatScreen kayıtlı olanı tercih ediyor; ısıtmak ASLA
      // DEVRALINMAYACAK ikinci bir konuşma açardı. Konuşma açmak bir yan
      // etkidir, bedelsiz sanılmamalı.
      //
      // ⚠️ İSTİSNA — **YENİ GÜN, YENİ SOHBET** (karar: 2026-09-19). Döküm
      // 24 saat yaşıyor, yani her gün giren kullanıcı — özelliğin tam hedef
      // kitlesi — sabah hep "kayıtlı oturumu var" dalına düşer ve özeti
      // HİÇBİR ZAMAN hazır bulamazdı. Dünkü bir döküm bugünün özetini
      // engellememeli: pencerede ve döküm GEÇEN GÜNE aitse ısıtma yapılır.
      // Dünkü döküm SİLİNMEZ — sidebar'daki "Sohbet" onu aynen açar; yalnız
      // özet düğmesine basan kişi temiz konuşmaya düşer (bkz. ChatScreen'in
      // brief dalı). İki giriş, iki niyet.
      const midnight = new Date()
      midnight.setHours(0, 0, 0, 0)
      const savedIsFromToday = !!saved && (saved.updatedAt ?? 0) >= midnight.getTime()
      if (saved?.conversationId && (savedIsFromToday || !question)) continue

      if (question) {
        // ⚠️ **İŞARET İŞTEN ÖNCE** (`silentSso.js`in dersi): yazılamıyorsa
        // deneme HİÇ yapılmaz. Kaybolan bir işaret, her sekmede bir AĞIR tur
        // demek.
        if (!markBriefArmed(windowId)) {
          prewarmConversation(agent.agentId)
          continue
        }
        prewarmConversation(agent.agentId, { brief: { question } })
        // Taşıma hiç kurulamadıysa (belirteç/SDK düştü) HİÇBİR tur
        // harcanmadı — denemeyi geri ver, BUGÜNKÜ pencere yeniden
        // denenebilsin.
        prewarmTransport().then((ok) => {
          if (!ok) releaseBriefArm(windowId)
        })
        continue
      }

      prewarmConversation(agent.agentId)
    }

    if (import.meta.env.DEV) {
      // ⚠️ SESSİZ KAPANMA SESSİZ KALMAZ. Özet istemi asistan ADINA göre
      // çözülüyor (`promptKeyForAgent`) ve bugün yalnız `office` için yazılı.
      // Bir yönetici `/settings`te katalog sırasını değiştirirse ilk açık
      // asistan Trader olur, istem bulunamaz ve özellik o kullanıcıda
      // hiçbir iz bırakmadan kapanır — düğme bile değişmez. Sabitlemek
      // (ADLA "TYRO Office") çözüm değil: sohbetin AÇACAĞI asistan başkaysa
      // özet zaten devralınamaz. Doğrusu, kapandığını SÖYLEMEK.
      const first = targets[0]
      if (first && briefAudienceOk && resolveBriefWindow()) {
        const wid = briefWindowId()
        if (wid && !briefPromptFor(first.name, wid, locale)) {
          console.warn(
            `[dailyBrief] İlk açık asistan "${first.name}" — onun için özet istemi yok` +
              " (DAILY_BRIEF.prompts). Gün özeti bu kullanıcıda kapalı.",
          )
        }
      }
      if (targets.length === 0) {
        console.warn(
          "[warmStart] Isıtılacak asistan yok — katalogda açık asistan" +
            " bulunmuyor ya da WARM_START.agents listesi eşleşmiyor.",
        )
      } else if (selected.length > targets.length) {
        // Sessiz kısıtlama YAZILIR: "hepsi ısındı" sanmak, ölçümü ve
        // beklentiyi birden yanıltırdı.
        console.info(
          `[warmStart] ${selected.length} asistan uygun, ilk ${targets.length} tanesi` +
            ` ısıtılıyor (WARM_START.maxAgents).`,
        )
      }
    }
  }, [enabled, lockReady, agents, briefAudienceOk, locale])

  // Ölçüm dökümü (AŞAMA 0). Konsola YAZILIR, ekrana değil: bu bir teşhis
  // aracı ve kullanıcı arayüzünde yeri yok. Buradaki rakamlar "hangi saniye
  // nereye gitti" sorusu için.
  useEffect(() => {
    if (!enabled) return
    const id = window.setInterval(() => {
      const t = getWarmTimings()
      if (t.sdkMs == null) return
      window.clearInterval(id)
      console.info("[warmStart] fazlar (ms):", t)
    }, 500)
    return () => window.clearInterval(id)
  }, [enabled])

  return null
}
