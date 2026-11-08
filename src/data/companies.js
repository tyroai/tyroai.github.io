/**
 * ŞİRKETLER — Hakkımızda (`/about`) ve Ekibimiz kartlarındaki şirket satırı. Demo için KURGUSAL:
 * grup, şirket adları ve rakamlar uydurmadır. Rol, tanıtım ve etiketler dört sözlükte (`about.*`).
 */
export const COMPANIES = [
  {
    id: "tyro",
    name: "TYRO Group",
    role: "parent",
    url: "https://tyroai.github.io",
    facts: [
      { id: "founded", value: "2009" },
      { id: "facilities", value: "12" },
      { id: "sourcing", value: "30" },
      { id: "customers", value: "100+" },
    ],
  },
  {
    id: "tyrotech",
    name: "TYRO Tech",
    role: "affiliate",
    parent: "tyro",
    url: "https://tyroai.github.io",
    focus: ["digital", "supplyChain", "ai"],
  },
]
