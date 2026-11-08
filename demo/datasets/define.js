// Veri seti tanımı: şimdilik yalnız kimlik işlevi (düz nesne). Şema için `sets/ana.js`e bak.
//
// ŞEMA ÖZETİ (hepsi isteğe bağlı; tarihler "bugüne" göre):
//   id, salesAgentDescription, agents[], apps[]                 → katalog (demo/catalog.js)
//   weather{now, base, amp, moods[]}, market{rates, bist}        → hava ve piyasa (demo/mock/external.js)
//   meetings[]   { title, recur:"weekly"|"daily"|"monthly", weekday(1=Pzt), dom, day(+/- gün), time:"HH:MM",
//                  minutes, allDay, span, where, teams, organizer, with[], status, body, private }
//   mail[]       { from | feed:"haberler|duyuru|ik|egitim|akademi|kulup", to[], cc[], subject, preview,
//                  body[]|string, at:{days,time}|{hoursAgo}|{minutesAgo}, unread, important, flagged }
//   todo.lists[] { name, default, tasks[]{ title, due(+/- gün)|null, importance, status, completedDaysAgo,
//                  steps[], note, createdDaysAgo } }
//   files[]      { name, folder, by, daysAgo, size }
//   notes[]      { title, notebook, section, daysAgo, body[] }
//   assistant    { office:{greeting,chips[]}, sales:{greeting,chips[]}, answers[]{ match, steps[], text, chips[] },
//                  fallback }
//   Kişi biçimi: "Selin Aydın" (kadro) | "Hakan Öz (Marmara Gıda Holding)" (dış müşteri) | {name,address}
export const defineDataset = (d) => d
