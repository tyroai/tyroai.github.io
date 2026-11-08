import { cn } from "@/lib/utils"
import { FocusCard } from "@/features/myspace/FocusCard"
import { HelpOrbCard } from "@/features/myspace/HelpOrbCard"
import { MeetingRhythmCard } from "@/features/myspace/MeetingRhythmCard"
import { NextMeetingCard } from "@/features/myspace/NextMeetingCard"
import { AskWidget } from "./AskWidget"
import { BriefWidget } from "./BriefWidget"
import { FocusWindowWidget } from "./FocusWindowWidget"
import { HolidayWidget } from "./HolidayWidget"
import { FocusTimerWidget } from "./focustimer/FocusTimerWidget"
import { WorldClockWidget } from "./worldclock/WorldClockWidget"
import { HorizonWidget } from "./horizon/HorizonWidget"
import { IntroWidget } from "./IntroWidget"
import { LeaveBalanceWidget } from "./leave/LeaveBalanceWidget"
import { MarketWidget } from "./MarketWidget"
import { OutcomesWidget } from "./OutcomesWidget"
import { ReportDayWidget } from "./reports/ReportDayWidget"
import { TraderWidget } from "./trader/TraderWidget"
import { FxGate } from "./fx/FxGate"
import { TranslateGate } from "./translate/TranslateGate"
import { PendingMailWidget } from "./PendingMailWidget"
import { PlannerWidget } from "./PlannerWidget"
import { RequestsWidget } from "./requests/RequestsWidget"
import { TeamTodayWidget } from "./TeamTodayWidget"
import { TravelWidget } from "./TravelWidget"
import { WeatherWidget } from "./WeatherWidget"
import { RegionWeatherGate } from "./region/RegionWeatherGate"
import { SavedSearchGate } from "./saved/SavedSearchGate"
import { OneNoteGate } from "./onenote/OneNoteGate"
import { StickyGate } from "./sticky/StickyGate"
import { TyroDiscGate } from "./radio/disc/TyroDiscGate"
import { TyroStageGate } from "./radio/stage/TyroStageGate"
import { RmPulseGate } from "./rm/RmPulseGate"
import { TibotGate } from "./tibot/TibotGate"

/**
 * Widget kimliği → bileşen. Pano ve Anasayfa aynı çiziciyi kullanır; veriler
 * sayfanın (`env`): hava, takvim, posta, odak… Katalogdaki önizleme de bununla
 * çizilir. Bilinmeyen kimlik `null`.
 */
export function renderWidgetFor(env) {
  // `greeted`: sayfa kendi selamlamasını çiziyor (Anasayfa) — Karşılama kartı tekrarlamaz.
  const { weather, now, firstName, celebration, ctx, briefCta, onNewChat, load, greeted } = env
  const { cal, focus, pageAccess, board } = ctx
  // Kartın görünümü (Düzenle › Görünüm) çiziciye geçmez: widget'lar CSS'le (`data-widget-look`) okur.
  return function renderWidget(id, className) {
    switch (id) {
      case "weather":
        return (
          <WeatherWidget
            key={id}
            weather={weather}
            celebration={celebration}
            className={className}
          />
        )
      case "weather-plain":
        return <WeatherWidget key={id} plain weather={weather} className={className} />
      case "intro":
        return (
          <IntroWidget
            key={id}
            ctx={ctx}
            firstName={firstName}
            celebration={celebration}
            greeted={greeted}
            className={className}
          />
        )
      case "ask":
        return (
          <AskWidget key={id} briefCta={briefCta} onNewChat={onNewChat} className={className} />
        )
      case "help":
        return (
          <HelpOrbCard
            key={id}
            anchorRef={env.helpRef}
            scene={env.scene}
            ctx={ctx}
            className={className}
          />
        )
      case "brief":
        return <BriefWidget key={id} ctx={ctx} className={className} />
      case "next-meeting":
        return (
          <NextMeetingCard
            key={id}
            cal={cal}
            now={now}
            className={cn("min-h-[12.5rem]", className)}
          />
        )
      case "focus":
        return (
          <FocusCard
            key={id}
            focus={focus}
            board={board}
            canOpenTodo={pageAccess.todo}
            className={cn("min-h-[12.5rem]", className)}
          />
        )
      case "rhythm":
        return <MeetingRhythmCard key={id} cal={cal} load={load} now={now} className={className} />
      case "market":
        return <MarketWidget key={id} className={className} />
      case "pending-mail":
        return <PendingMailWidget key={id} className={className} />
      case "planner":
        return <PlannerWidget key={id} className={className} />
      case "focus-window":
        return <FocusWindowWidget key={id} ctx={ctx} className={className} />
      case "team-today":
        return <TeamTodayWidget key={id} className={className} />
      case "outcomes":
        return <OutcomesWidget key={id} ctx={ctx} className={className} />
      case "holiday":
        return <HolidayWidget key={id} ctx={ctx} className={className} />
      case "report-day":
        return <ReportDayWidget key={id} ctx={ctx} className={className} />
      case "trader":
        return <TraderWidget key={id} className={className} />
      case "tyro-fx":
        return <FxGate key={id} className={className} />
      case "tyro-translate":
        return <TranslateGate key={id} className={className} />
      case "region-weather":
        return <RegionWeatherGate key={id} className={className} />
      case "saved-search":
        return <SavedSearchGate key={id} className={className} />
      case "onenote":
        return <OneNoteGate key={id} className={className} />
      case "sticky":
        return <StickyGate key={id} className={className} />
      case "tyro-radio-stage":
        return <TyroStageGate key={id} className={className} />
      case "tyro-radio-disc":
        return <TyroDiscGate key={id} className={className} />
      case "rm-pulse":
        return <RmPulseGate key={id} className={className} />
      case "tibot-summary":
      case "tibot-rhythm":
      case "tibot-rings":
        return <TibotGate key={id} id={id} className={className} />
      case "tibot-intro":
        return <TibotGate key={id} id={id} firstName={firstName} className={className} />
      case "leave-balance":
        return <LeaveBalanceWidget key={id} ctx={ctx} className={className} />
      case "requests":
        return <RequestsWidget key={id} ctx={ctx} className={className} />
      case "focus-timer":
        return <FocusTimerWidget key={id} className={className} />
      case "world-clock":
        return <WorldClockWidget key={id} ctx={ctx} className={className} />
      case "horizon":
        return <HorizonWidget key={id} ctx={ctx} className={className} />
      case "travel":
        return <TravelWidget key={id} ctx={ctx} className={className} />
      default:
        return null
    }
  }
}
