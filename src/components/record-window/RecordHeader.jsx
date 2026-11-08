import { HugeiconsIcon } from "@hugeicons/react"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import "./recordWindow.css"

/**
 * Kaydın başlığı: solda renkli simge kutusu (`icon`; `tone` brand · success · warning · danger ·
 * neutral) ya da onun yerine `lead` (ör. görevin tamamla kutusu), sağda kalın başlık
 * (`titleExtra`: yanına küçük gri ek, ör. kod), gri alt satır, etiket satırı (`tags`:
 * `RecordTag`lar, durum rozeti) ve en altta `children` (ör. `RecordOwner`). `titleAs`: başlığın
 * düzeyi (pencerede h2; Dialog başlığı ayrıysa da h2 kalır).
 */
export function RecordHeader({
  icon,
  tone,
  lead,
  title,
  titleExtra,
  titleLang,
  titleAs: Title = "h2",
  sub,
  subLang,
  tags,
  personal = false,
  children,
}) {
  return (
    <header className="rw-head" data-private={personal ? "" : undefined}>
      {lead ??
        (icon && (
          <span className="rw-head-icon" data-tone={tone} aria-hidden="true">
            <HugeiconsIcon icon={icon} strokeWidth={1.7} />
          </span>
        ))}
      <div className="rw-head-text">
        <Title className="rw-title" lang={titleLang}>
          {title}
          {titleExtra}
        </Title>
        {sub && (
          <p className="rw-sub" lang={subLang}>
            {sub}
          </p>
        )}
        {tags != null && <div className="rw-tags">{tags}</div>}
        {children}
      </div>
    </header>
  )
}

/**
 * Başlıktaki sakin etiket: köşeli gri kutu; `plain` zeminsiz (tarih, yer — simge + metin);
 * `tone` brand · success · warning · danger. `label`: alanın adı — ekran okuyucuya önek, gözle
 * `title` ipucunda (etiket yalnız simge ve değer gösterir). Uzun değer üç noktayla kısalır.
 */
export function RecordTag({ icon, children, plain = false, tone, title, label }) {
  return (
    <span className="rw-tag" data-plain={plain || undefined} data-tone={tone} title={title}>
      {icon && <HugeiconsIcon icon={icon} aria-hidden="true" strokeWidth={1.8} />}
      <span className="rw-tag-text">
        {label && <span className="sr-only">{label}: </span>}
        {children}
      </span>
    </span>
  )
}

/**
 * Kaydın sahibi (ya da düzenleyeni): fotoğraf · kalın ad · ince çizgiden sonra gri unvan.
 * `presence`: fotoğrafın köşesinde canlı Teams durumu. `onOpen` ya da `trigger` (`PersonPopover`un
 * tetik props'u) verilirse satır düğmedir (kişi kartını açar); erişilebilir ad görünen metinden
 * gelir, ne yaptığı `openTitle` ipucunda.
 */
export function RecordOwner({
  name,
  photo,
  role,
  presence,
  presenceLabel,
  onOpen,
  trigger,
  openTitle,
  className,
}) {
  if (!name) return null
  const body = (
    <>
      <PersonAvatar
        name={name}
        photo={photo}
        presence={presence}
        presenceLabel={presenceLabel}
        className="rw-owner-avatar"
      />
      <span className="rw-owner-name">{name}</span>
      {role && <span className="rw-owner-role">{role}</span>}
    </>
  )
  const cls = className ? `rw-owner ${className}` : "rw-owner"
  if (!onOpen && !trigger) return <p className={cls}>{body}</p>
  return (
    <button type="button" onClick={onOpen} {...trigger} title={openTitle} className={cls}>
      {body}
    </button>
  )
}
