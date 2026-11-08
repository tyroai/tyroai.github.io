import {
  startConversation,
  resumeConversation,
  sendMessage,
  sendAction,
  resolveSuggestedAction,
  filesToAttachments,
  readConversationId,
} from "@/lib/copilot"
import {
  awaitWarmConversation,
  markConversationLive,
  markConversationCold,
  peekWarmBrief,
  subscribeWarm,
} from "@/lib/warmStart"
import { loadChatSession } from "@/lib/chatSession"
import { DAILY_BRIEF, markBriefUsed } from "@/lib/dailyBriefPolicy"

/**
 * Tur motorunun dış dünyaya açılan tek kapısı (port): Copilot Studio istemcisi, ön-ısıtma
 * ve kayıtlı oturum. Motor (`turnEngine`, `initConversation`) bunları doğrudan import etmez —
 * testler aynı biçimde sahte bir port verir.
 */
export const copilotPort = {
  startConversation,
  resumeConversation,
  sendMessage,
  sendAction,
  resolveSuggestedAction,
  filesToAttachments,
  readConversationId,
  awaitWarmConversation,
  markConversationLive,
  markConversationCold,
  peekWarmBrief,
  subscribeWarm,
  loadChatSession,
  markBriefUsed,
  dailyBrief: DAILY_BRIEF,
}

/**
 * Portun tamamı: tur motorunun kapısı (`turnEngine` › `ChatPort`) + başlatmanın
 * (`initConversation`) kapıları. `satisfies ChatPort` `lib/copilot` TS'e geçince: JS'ten
 * çıkarılan türler gevşek (`resolveSuggestedAction` › `kind: string`).
 */
export type CopilotPort = typeof copilotPort
