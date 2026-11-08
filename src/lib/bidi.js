/**
 * Veriden gelen adı çevresindeki metinden yalıtır (FSI…PDI): Arapça bir ad, ardındaki "· 5 sa. önce"
 * satırındaki rakamı ve noktalamayı kendi yönüne çekip sıralarını bozmasın.
 */
export const isolate = (text) => (text ? `⁨${text}⁩` : text)
