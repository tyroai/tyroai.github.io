// Demo girişi: önce seçili veri setini yükle, sahte backend'i kur, sonra uygulamayı başlat.
// (Kaynak uygulamanın main.jsx'i değişmeden çalışır.)
import { loadDataset, pickDatasetId } from "./datasets/registry.js"
import { installMocks } from "./mock/install.js"

const id = pickDatasetId()
const dataset = await loadDataset(id)
window.__DEMO__ = { id, dataset }
installMocks(dataset)

// İlk açılış tohumları (yalnız yoksa): dil, Keşfet rozeti için "en son görülen" damgası (aksi hâlde rozet
// hiç yanmaz) ve rehber turlarının kapalı başlaması (Yardım › Rehber turları yine açabilir).
try {
  const ls = window.localStorage
  if (!ls.getItem("tyro-feed-seen-v1")) {
    ls.setItem("tyro-feed-seen-v1", new Date(Date.now() - 3 * 86400000).toISOString())
  }
  if (!ls.getItem("tyro-tours-v1")) ls.setItem("tyro-tours-v1", JSON.stringify({ off: true, seen: {} }))
  // Dil: seçim yoksa Türkçe (kaynakta giriş sayfası İngilizce açılır; içerik Türkçe olduğu için tutarsız dururdu).
  if (!ls.getItem("tyro-locale-v2")) ls.setItem("tyro-locale-v2", "tr")
} catch {
  /* depo yok: rozet sıfır kalır, turlar zaten açılmaz */
}

await import("../src/main.jsx")
