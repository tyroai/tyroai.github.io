// Sözlük (strings.<dil>.js) değer geçersiz kılmaları: Hakkımızda ve Ekibimiz sayfalarının gerçek
// şirket tanıtımı yerine kurgusal metin. Anahtarlar DÖNÜŞÜMDEN SONRAKİ adlarıyla yazılır.
// replace: var olan anahtarın değeri (yoksa uyarı) · drop: anahtarı sil · add: sona yeni anahtar ekle.

const tr = {
  replace: {
    "about.lead":
      "TYRO AI, kurgusal bir şirket olan TYRO Tech'in kurumsal yapay zekâ çalışma alanı. Bu site bir demodur: görünen kişilerin, kurumların ve rakamların tamamı kurgusaldır.",
    "about.tyro.desc":
      "Perakendeden lojistiğe, tarımdan enerjiye uzanan kurgusal bir şirketler grubu. Bu demoda grubun adı ve yapısı yalnızca ekranların gerçekçi görünmesi için uydurulmuştur.",
    "about.tyro.quote": "Doğru bilgiyi, doğru zamanda, doğru kişiye ulaştırmak.",
    "about.tyrotech.desc":
      "TYRO Tech, grubun teknoloji şirketi: kurumsal yazılım, yapay zekâ ve satış teknolojileri geliştirir. Satış, tedarik ve operasyon ekiplerinin günlük işini hızlandıran ürünler tasarlar (hepsi kurgusal).",
    "about.tyrotech.quote":
      "Teknolojiyi gösteriş için değil, ekiplerin işini kolaylaştırmak için kuruyoruz.",
    "about.fact.facilities": "Şehirde ofis",
    "about.fact.sourcing": "Ülkede iş ortağı",
    "about.fact.customers": "Ülkede müşteri",
    "about.teamCta.desc": "TYRO AI'yı tasarlayan ve geliştiren (kurgusal) ekip.",
    "about.source": "Tüm şirket bilgileri ve rakamlar kurgusaldır:",
    "team.subtitle": "TYRO Tech'te TYRO AI'yı tasarlayan ve geliştiren kurgusal ekip.",
  },
  drop: [
    "team.member.cenk.role",
    "team.member.cenk.bio",
    "team.member.pinar.role",
    "team.member.pinar.bio",
  ],
  add: {
    "team.member.deniz.role": "Ürün Yöneticisi",
    "team.member.deniz.bio":
      "TYRO AI'nın ürün yönünü belirliyor; satış ve operasyon ekipleriyle birlikte çalışıyor.",
    "team.member.elif.role": "Yapay Zekâ Mühendisi",
    "team.member.elif.bio":
      "TYRO AI'nın asistanlarını ve yapay zekâ servislerini geliştiriyor.",
  },
}

const en = {
  replace: {
    "about.lead":
      "TYRO AI is the enterprise AI workspace of TYRO Tech, a fictional company. This site is a demo: every person, company and figure you see is made up.",
    "about.tyro.desc":
      "A fictional group of companies spanning retail, logistics, agriculture and energy. In this demo the group's name and structure exist only to make the screens look realistic.",
    "about.tyro.quote": "Getting the right information to the right person at the right time.",
    "about.tyrotech.desc":
      "TYRO Tech is the group's technology company: it builds enterprise software, AI and sales technology that speeds up the daily work of sales, sourcing and operations teams (all fictional).",
    "about.tyrotech.quote":
      "We build technology to make teams' work easier, not to show off.",
    "about.fact.facilities": "Cities with offices",
    "about.fact.sourcing": "Partner countries",
    "about.fact.customers": "Countries with customers",
    "about.teamCta.desc": "The (fictional) team that designs and builds TYRO AI.",
    "about.source": "All company details and figures are fictional:",
    "team.subtitle": "The fictional team at TYRO Tech that designs and builds TYRO AI.",
  },
  drop: tr.drop,
  add: {
    "team.member.deniz.role": "Product Manager",
    "team.member.deniz.bio":
      "Sets the product direction for TYRO AI, working with sales and operations teams.",
    "team.member.elif.role": "AI Engineer",
    "team.member.elif.bio": "Builds TYRO AI's assistants and AI services.",
  },
}

export const DICT_OVERRIDES = {
  tr,
  en,
  // RU ve AR demo sayfalarında İngilizce metin gösterilir.
  ru: en,
  ar: en,
}
