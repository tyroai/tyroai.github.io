/**
 * Konuşma tanıma hata kodu → kullanıcıya söylenen metnin anahtarı (`useSpeechRecognition`'ın
 * `onError` kodları). Anlat ve Çevir'in diktesi ortak kullanır; bilinmeyen kod
 * `chat.mic.error.unknown`.
 */
export const DICTATION_ERRORS = {
  "not-allowed": "chat.mic.error.permission",
  "no-speech": "chat.mic.error.noSpeech",
  "audio-capture": "chat.mic.error.noMic",
  network: "chat.mic.error.network",
  "language-not-supported": "chat.mic.error.lang",
  "not-supported": "chat.mic.error.unsupported",
}
