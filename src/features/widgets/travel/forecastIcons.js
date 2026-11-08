import CloudAngledRainZapIcon from "@hugeicons/core-free-icons/CloudAngledRainZapIcon"
import CloudBigRainIcon from "@hugeicons/core-free-icons/CloudBigRainIcon"
import CloudFogIcon from "@hugeicons/core-free-icons/CloudFogIcon"
import CloudIcon from "@hugeicons/core-free-icons/CloudIcon"
import CloudLittleRainIcon from "@hugeicons/core-free-icons/CloudLittleRainIcon"
import CloudLittleSnowIcon from "@hugeicons/core-free-icons/CloudLittleSnowIcon"
import CloudMidRainIcon from "@hugeicons/core-free-icons/CloudMidRainIcon"
import CloudSnowIcon from "@hugeicons/core-free-icons/CloudSnowIcon"
import Sun03Icon from "@hugeicons/core-free-icons/Sun03Icon"
import SunCloud02Icon from "@hugeicons/core-free-icons/SunCloud02Icon"
import SunCloudLittleRain02Icon from "@hugeicons/core-free-icons/SunCloudLittleRain02Icon"

/** Hava türü (`lib/weather` › `KINDS`) → günün simgesi (gündüz; günlük tahmin öğle dilimi). */
export const FORECAST_ICON = {
  clear: Sun03Icon,
  partly: SunCloud02Icon,
  cloudy: CloudIcon,
  fog: CloudFogIcon,
  lightRain: CloudLittleRainIcon,
  showers: SunCloudLittleRain02Icon,
  rain: CloudMidRainIcon,
  sleet: CloudLittleSnowIcon,
  snow: CloudSnowIcon,
  heavyRain: CloudBigRainIcon,
  thunder: CloudAngledRainZapIcon,
}
