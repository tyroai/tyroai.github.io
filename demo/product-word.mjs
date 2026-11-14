// Logonun ikinci kelimesi "ai": uygulamanın adı "tyro ai" (tyra·trade, tyra·cbot gibi iki kelimeli kilit: "tyro"
// kurumsal renkte, "ai" paletin renginde). Harfleri tyra logo üreteci (masaüstündeki tyra-logo-generator.html)
// dizdi: a (tyra logosundan), i (tyraSign logosundan), ikisi de resmi harf; ölçek 1.234, taban 793;
// "tyro"dan sonraki boşluk üretecin kelime boşluğu kuralı, harf arası harf boşluğu kuralı.
// Harfler bitişik üst üste binebilir: yol `fill-rule="nonzero"` ile çizilir (BrandText bunu yamar).
const PRODUCT = {
  right: 3733,
  d: "M3509 262l-93 531l-109 0l78-472c-46-14-97-17-144-7c-116 25-209 129-219 247c-2 21-1 41 3 62c4 14 9 28 17 41c14 21 36 36 61 42c70 18 125-20 171-68l-23 119c-1 3-1 5-3 7c-5 7-38 22-48 26c-55 23-123 23-178-2c-87-41-121-138-115-228c1-23 6-45 12-67c53-187 232-288 419-276c60 4 118 18 171 45zM3585 793l-115 0l99-563l115 0l-99 563zM3589 51c0-16 15-30 26-39c12-11 34-28 51-29c25 0 61 46 61 69c0 16-15 30-26 40c-12 11-33 28-50 28c-24 0-62-47-62-69z",
}

/** { d, right }: yol verisi ve kutunun sağ kenarı (logo düzlemi birimi). */
export function productWord() {
  return PRODUCT
}
