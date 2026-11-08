// GitHub Pages: rota yenilemesi için 404.html = index.html (SPA geri dönüşü) ve Jekyll kapalı.
import { copyFileSync, existsSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const dist = join(resolve(dirname(fileURLToPath(import.meta.url)), ".."), "dist")
if (!existsSync(join(dist, "index.html"))) {
  console.error("dist/index.html yok: önce vite build")
  process.exit(1)
}
copyFileSync(join(dist, "index.html"), join(dist, "404.html"))
writeFileSync(join(dist, ".nojekyll"), "")
console.log("postbuild: 404.html ve .nojekyll yazıldı")
