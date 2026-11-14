// Logo yazısını "tyra"dan "tyro"ya çevirir: yol verisinde üç alt yol var (t+y, a, r). Ortadaki 'a'
// atılır; yerine tyra logo üretecinin (masaüstündeki tyra-logo-generator.html) resmi "o" harfi gelir
// (tyraOffice logosundan; r'den sonraki aralık üretecin bant kuralıyla, ölçek 1.234, taban 793).
// Yol göreli `m` ile ilerlediği için 'r'nin başlangıcı mutlak koordinata çevrilir.
const O = "M2152 560c-1-155 116-293 263-333c130-36 279 7 327 144c11 30 15 62 15 94c0 158-125 297-275 332c-129 31-271-16-316-150c-10-28-14-57-14-87zM2642 463c0-19-2-38-8-56c-29-90-131-109-211-78c-93 36-156 133-156 233c0 18 3 37 9 54c29 88 127 107 206 78c94-35 160-132 160-231z"

/** Her alt yolun MUTLAK başlangıç noktası (yalnız M/m, C/c, L/l, H/h, V/v, S/s, Q/q, Z/z). */
function subpathStarts(d) {
  const t = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g)
  const starts = []
  let i = 0
  let cmd = ""
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  const num = () => parseFloat(t[i++])
  while (i < t.length) {
    if (/[a-zA-Z]/.test(t[i])) cmd = t[i++]
    const rel = cmd === cmd.toLowerCase()
    const C = cmd.toUpperCase()
    if (C === "M") {
      const nx = num()
      const ny = num()
      x = rel ? x + nx : nx
      y = rel ? y + ny : ny
      sx = x
      sy = y
      starts.push([x, y])
      cmd = rel ? "l" : "L"
    } else if (C === "Z") {
      x = sx
      y = sy
    } else if (C === "L") {
      const nx = num()
      const ny = num()
      x = rel ? x + nx : nx
      y = rel ? y + ny : ny
    } else if (C === "H") {
      const nx = num()
      x = rel ? x + nx : nx
    } else if (C === "V") {
      const ny = num()
      y = rel ? y + ny : ny
    } else if (C === "C" || C === "S" || C === "Q") {
      const n = C === "C" ? 3 : 2
      for (let k = 0; k < n; k++) {
        const nx = num()
        const ny = num()
        if (k === n - 1) {
          x = rel ? x + nx : nx
          y = rel ? y + ny : ny
        }
      }
    } else {
      throw new Error(`Logo yolunda beklenmeyen komut: ${cmd}`)
    }
  }
  return starts
}

export function tyroWord(d) {
  const pieces = d.split(/(?=[Mm])/)
  const starts = subpathStarts(d)
  if (pieces.length !== 3 || starts.length !== 3) {
    throw new Error(`Logo yolu beklenen biçimde değil (3 alt yol bekleniyordu, ${pieces.length} bulundu)`)
  }
  // 'r' parçasının ilk komutu göreli `m dx dy`: mutlak `M x y`e çevir
  const r = pieces[2].replace(/^[Mm]\s*-?\d*\.?\d+[\s,]*-?\d*\.?\d+/, `M${starts[2][0]} ${starts[2][1]}`)
  return pieces[0] + r + O
}
