// Anasayfa hava kartının arka planı: köşk fotoğrafı yerine sahne koleksiyonundan (`public/tyro-stage/`)
// hava durumuna ve gündüz/geceye göre seçilen görseller. `pos` görselin kesim odağıdır
// (`stageArt.js` ile aynı değerler); EstateLayer onu `object-position` olarak uygular.
const BASE = `${import.meta.env?.BASE_URL ?? "/"}tyro-stage/`

const scene = (name, x = 50, y = 50) => ({ src: `${BASE}${name}.webp`, pos: `${x}% ${y}%` })

// [gündüz, gece]
const SCENES = {
  sunny: [scene("spring-hill", 100, 50), scene("starry-lake", 65, 50)],
  cloudy: [scene("coast-road", 35, 50), scene("swirl-tree", 50, 55)],
  rain: [scene("sunset-boat", 45, 60), scene("sea-ripples", 50, 56)],
  snow: [scene("mist-embrace", 45, 40), scene("moon-road", 50, 30)],
  fog: [scene("mist-embrace", 45, 40), scene("sea-ripples", 50, 56)],
}
SCENES.storm = SCENES.rain

const pick = (weather, isNight) => (SCENES[weather] ?? SCENES.cloudy)[isNight ? 1 : 0]

export function estateImage(weather, isNight) {
  return pick(weather, isNight).src
}

export function estatePosition(weather, isNight) {
  return pick(weather, isNight).pos
}
