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
  // Takvim: "rahat saat ölçeği" açık başlasın (saat başı 64 px). Kapalıyken hafta tek ekrana sığdırılır
  // ve küçük pencerede toplantılar okunmayacak kadar daralır.
  if (!ls.getItem("tyro-calendar-tools-v1")) {
    ls.setItem("tyro-calendar-tools-v1", JSON.stringify({ comfort: true, hidePending: false }))
  }
  // Header: Tyrofy (radyo) ve Piyasa açık gelsin. İkisi de canlı çalışır (Radio Browser + gerçek akışlar;
  // Truncgil/Frankfurter kurları); kullanıcı kaldırır ya da başkasını ekler, o zaman bu tohum bir daha yazmaz.
  if (!ls.getItem("tyro-header-widgets-v1")) {
    ls.setItem("tyro-header-widgets-v1", JSON.stringify({ v: 1, items: ["radio", "market"], looks: {}, faces: {} }))
  }
  // Kişi fotoğrafları sonradan eklendi: uygulamanın 7 günlük "fotoğrafı yok" önbelleği eski ziyaretlerden
  // kalmış olabilir; sürüm damgası yoksa bir kez temizle (yeni ziyaretçide zaten boş).
  if (!ls.getItem("demo-people-photos-v1")) {
    ls.removeItem("tyro-nophoto-v1")
    ls.setItem("demo-people-photos-v1", "1")
  }
} catch {
  /* depo yok: rozet sıfır kalır, turlar zaten açılmaz */
}

await import("../src/main.jsx")
