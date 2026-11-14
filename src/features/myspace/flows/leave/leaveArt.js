/**
 * İZİN TÜRÜ İLLÜSTRASYONLARI — tür seçimi, tür hapı ve izin sahnesi. Hepsi aynı aileden (Microsoft
 * Fluent Emoji 3B, MIT; 240 px WebP, saydam zemin): dosyalar `public/tyro-advance/leave/`, lisans
 * notu `public/tyro-advance/credits.txt`.
 */
const BASE = `${import.meta.env.BASE_URL}tyro-advance/leave/`

/** İzin türünün illüstrasyonu (şablondaki tür anahtarıyla: annual, excuse, sick…). */
export const leaveArt = (kind) => `${BASE}${kind}.webp`
