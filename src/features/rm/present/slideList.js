import { CoverSlide, PortfolioSlide, SummarySlide } from "./deckA"
import { BusySlide, PeopleSlide, TeamsSlide } from "./deckB"
import { ForecastSlide, TimelineSlide, UpcomingSlide } from "./deckC"

// Sunumun sırası: kapak → özet → portföy → yoğun projeler → ekipler → kişiler → zaman çizelgesi →
// yaklaşanlar → kapasite öngörüsü (karar: yeni iş ne zaman alınır).
// Takvim riski ve takip (aksiyonlar, riskler) sunumda yok (sahibin ve direktörün kararı).
export const SLIDES = [
  { key: "cover", label: "rm.deck.t.cover", Comp: CoverSlide },
  { key: "summary", label: "rm.deck.t.summary", Comp: SummarySlide },
  { key: "portfolio", label: "rm.deck.t.portfolio", Comp: PortfolioSlide },
  { key: "busy", label: "rm.deck.t.busy", Comp: BusySlide },
  { key: "teams", label: "rm.deck.t.teams", Comp: TeamsSlide },
  { key: "people", label: "rm.deck.t.people", Comp: PeopleSlide },
  { key: "timeline", label: "rm.deck.t.timeline", Comp: TimelineSlide },
  { key: "upcoming", label: "rm.deck.t.upcoming", Comp: UpcomingSlide },
  { key: "forecast", label: "rm.deck.t.forecast", Comp: ForecastSlide },
]
