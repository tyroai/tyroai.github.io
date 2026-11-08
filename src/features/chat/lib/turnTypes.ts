/**
 * Tur motorunun (`turnEngine`) sözleşmesi: port, refs, setters, effects ve bağlam. Yalnız tür:
 * pakete girmez. `useChatTurn` bu bağlamı her render'da kurar; testler sahte port verir.
 */
import type {
  ChatMessage,
  RetryDescriptor,
  SetMessages,
  StreamChunk,
  StreamResult,
  SuggestedAction,
} from "@/features/chat/lib/streamReply"
import type { Translate } from "@/lib/translate"
import type { findConsentCard } from "@/features/chat/consentCards"

export type Ref<T> = { current: T }
export type Bump = (update: (n: number) => number) => void

/** Copilot Studio istemcisi; motor yalnız porta geri verir, içine bakmaz. */
export type CopilotClient = unknown

/** Öneri çipinin çözümü: mesaj, eylem ya da yeni sekmede açılacak adres. */
export type ResolvedAction =
  | { kind: "message"; payload: unknown }
  | { kind: "action"; payload: unknown }
  | { kind: "url"; payload?: string }

/** Motorun dış dünyaya kapısı (`copilotPort`; testte sahte). */
export interface ChatPort {
  sendMessage(
    client: CopilotClient,
    text: string,
    attachments?: unknown[],
  ): AsyncIterable<StreamChunk>
  sendAction(client: CopilotClient, actionData: unknown): AsyncIterable<StreamChunk>
  /** Dosyalar yalnız bu aktivite için data-URI'ye. */
  filesToAttachments(files: File[]): Promise<unknown[]>
  resolveSuggestedAction(action: SuggestedAction): ResolvedAction
}

/** Work IQ onay kartı (`consentCards`). */
export type ConsentCard = NonNullable<ReturnType<typeof findConsentCard>>

/** Özet onay kutusu: bağlantının adı, kart ve kartı getiren tur. */
export interface ConsentPrompt {
  name: string
  card: ConsentCard
  gen: number
}

/** Sohbetin açık asistanı (kilit süzgecinden geçmiş katalog kaydı). */
export interface OpenAgent {
  agentId?: string
  name?: string
  description?: string
}

/** Bestecide seçilen dosya: balonda yalnız ad/boyut/tip, `file` yalnız tel için. */
export interface PickedFile {
  name: string
  size: number
  type: string
  file: File
}

export interface TurnRefs {
  /** Tur sayacı: her yeni tur artırır, eski akışlar kendini bırakır. */
  abortGenRef: Ref<number>
  copilotClientRef: Ref<{ client: CopilotClient; agentId: string } | null>
  startBadgeRef: Ref<unknown>
  /** true: otomatik onay · false: reddedildi · null: sorulmadı. */
  autoConsentRef: Ref<boolean | null>
  /** Başlatma (selamlama + otomatik tur) bitince çözülür. */
  conversationReadyRef: Ref<Promise<unknown> | null>
  resumedRef: Ref<boolean>
  recoveringRef: Ref<boolean>
  conversationIdRef: Ref<string | null>
  firstReplyNoticeRef: Ref<boolean>
}

export interface TurnSetters {
  setMessages: SetMessages
  setOrbState: (state: "idle" | "thinking" | "speaking") => void
  setBusy: (busy: boolean) => void
  setConsentPrompt: (prompt: ConsentPrompt | null) => void
  setConsentWait: (wait: boolean) => void
  setConversationTick: Bump
  setResetNonce: Bump
  setIsNearBottom: (near: boolean) => void
  setInput: (text: string) => void
}

/** Turun bildiricisi: cevap gelince (sekme arkadaysa) haber verir. */
export interface TurnNotifier {
  armTurn(text: string | undefined): void
  resolveTurn(result: { answer?: string; failed: boolean }): void
  cancelTurn(): void
}

export interface TurnEffects {
  isOffline(): boolean
  notifyOffline(): void
  showFirstReplyToast(options: { t: Translate; inDock?: boolean; duration: number }): void
  /** Hatanın asistan balonu (`chatFailure`). */
  chatFailureMessage(t: Translate, err: unknown, agent: string): Promise<ChatMessage>
  /** Masraf fişi: dosyanın kopyası HR MCP'ye, kimliği mesaja (`chatFileStaging`). */
  textWithStagedFiles(
    text: string,
    attachments: unknown[],
    agent: OpenAgent | null | undefined,
    t: Translate,
  ): Promise<string>
  openUrl(url: string): void
}

/** `useChatTurn`in her render'da verdiği bağlam. */
export interface TurnContext {
  port: ChatPort
  agent: string
  t: Translate
  notifier: TurnNotifier
  refs: TurnRefs
  setters: TurnSetters
  effects: TurnEffects
  consentPrompt: ConsentPrompt | null
  input: string
  schemaName?: string | null
  inDock?: boolean
  resolveOpenAgent(agent: string): OpenAgent | null | undefined
}

/** Biten (güncelliğini yitirmemiş) akış. */
export type Completed = Exclude<StreamResult, { aborted: true }>

/** Kullanıcı turunun tarifi (`runTurn`). */
export interface TurnSpec {
  before?: () => void
  makeGenerator: (client: CopilotClient) => AsyncIterable<StreamChunk>
  armText?: string
  retry: RetryDescriptor
  label: string
  recover?: boolean
}
