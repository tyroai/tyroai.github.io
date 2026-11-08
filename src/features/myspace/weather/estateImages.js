// Anasayfa hava kartının arka planı: köşk fotoğrafı yerine, hava durumuna ve gündüz/geceye göre seçilen
// görseller (`public/images/weather/`: güneşli/bulutlu Imageory sanatı, yağmur/kar/sis Unsplash fotoğrafı; kaynaklar `CREDITS.md`). `pos` görselin kesim odağıdır:
// kart yatay ve geniş olduğu için görselin yalnız bir şeridi görünür; EstateLayer `object-position` verir.
const BASE = `${import.meta.env?.BASE_URL ?? "/"}images/weather/`

const scene = (name, y = 50, x = 50) => ({ src: `${BASE}${name}.jpg`, pos: `${x}% ${y}%` })

// [gündüz, gece]
const SCENES = {
  sunny: [scene("sunny-day", 55), scene("sunny-night", 30)],
  cloudy: [scene("cloudy-day", 30), scene("cloudy-night", 40)],
  rain: [scene("rain-day", 55), scene("rain-night", 55)],
  snow: [scene("snow-day", 35), scene("snow-night", 40)],
  fog: [scene("fog-day", 50), scene("fog-night", 72)],
}
SCENES.storm = SCENES.rain

const pick = (weather, isNight) => (SCENES[weather] ?? SCENES.cloudy)[isNight ? 1 : 0]

export function estateImage(weather, isNight) {
  return pick(weather, isNight).src
}

export function estatePosition(weather, isNight) {
  return pick(weather, isNight).pos
}
