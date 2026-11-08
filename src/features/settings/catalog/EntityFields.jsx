import { HugeiconsIcon } from "@hugeicons/react"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { IconPicker } from "../IconPicker"
import { LogoUpload } from "../LogoUpload"
import { LogoBox } from "./CatalogRow"

/** Apple'ın gruplu listesi, sade giysiyle: küçük büyük harfli grup adı, çerçevesiz gövde. */
function Group({ title, children }) {
  const { locale } = useLocale()
  return (
    <section className="space-y-1.5">
      <h3
        lang={locale}
        className="px-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground"
      >
        {title}
      </h3>
      <div className="divide-y divide-border/60 rounded-2xl bg-muted/40 dark:bg-white/[0.04]">
        {children}
      </div>
    </section>
  )
}

/** Grup içindeki alan: etiket, denetim, satır içi hata. */
function Field({ id, label, error, hint, children }) {
  const { t } = useLocale()
  return (
    <div className="grid gap-1.5 px-4 py-3">
      <label htmlFor={id} className="text-[0.8125rem] font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger-ink">
          {t(error)}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

/** Kimlik alanı: tek aralıklı yazı; doluysa yanında kopyala. */
function IdInput({ id, value, placeholder, onChange, onCopy, label }) {
  const { t } = useLocale()
  return (
    <div className="relative">
      <Input
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        className={cn("font-mono text-xs pointer-coarse:h-11", value && "pe-10")}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onCopy(label, value)}
          aria-label={t("settings.catalog.row.copy").replace("{name}", label)}
          className="absolute end-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-2"
        >
          <HugeiconsIcon icon={Copy01Icon} className="size-3.5" strokeWidth={1.8} />
        </button>
      ) : null}
    </div>
  )
}

/** Açık/kapalı anahtarı — satırın tamamı dokunma hedefi. */
function ActiveSwitch({ checked, onChange }) {
  const { t } = useLocale()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[0.8125rem] font-medium">
          {t("settings.catalog.form.activeLabel")}
        </span>
        <span className="block text-xs text-muted-foreground">
          {t("settings.catalog.form.activeHint")}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition-colors",
          checked ? "bg-brand" : "bg-foreground/20",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[inset-inline-start]",
            checked ? "start-[1.125rem]" : "start-0.5",
          )}
        />
      </span>
    </button>
  )
}

/**
 * Kayıt formunun alanları, dört grupta: Kimlik · Bağlantı · Görünüm · Durum. Yalnız tablodaki
 * alanlar (ad, açıklama, adres ya da Tenant/Client/Agent ID, ikon, logo, açık/kapalı).
 */
export function EntityFields({ kind, form, errors, update, onCopy, onDelete }) {
  const { t } = useLocale()
  const isAgent = kind === "agents"
  const invalid = (k) =>
    errors[k] ? { "aria-invalid": true, "aria-describedby": `entity-${k}-error` } : {}
  return (
    <div className="space-y-6">
      <Group title={t("settings.catalog.form.groupIdentity")}>
        <Field id="entity-name" label={t("settings.field.name")} error={errors.name}>
          <Input
            id="entity-name"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder={isAgent ? "tyroOffice" : "tyroSign"}
            autoComplete="off"
            aria-required="true"
            className="pointer-coarse:h-11"
            {...invalid("name")}
          />
        </Field>
        <Field id="entity-description" label={t("settings.field.description")}>
          <Textarea
            id="entity-description"
            value={form.description ?? ""}
            onChange={(e) => update({ description: e.target.value })}
            placeholder={t("settings.field.descriptionPlaceholder")}
            rows={2}
          />
        </Field>
      </Group>

      <Group title={t("settings.catalog.form.groupConnection")}>
        {isAgent ? (
          [
            ["tenantId", "00000000-0000-0000-0000-000000000000"],
            ["clientId", "00000000-0000-0000-0000-000000000000"],
            ["agentId", "agent-id"],
          ].map(([k, ph]) => (
            <Field key={k} id={`entity-${k}`} label={t(`settings.field.${k}`)}>
              <IdInput
                id={`entity-${k}`}
                label={t(`settings.field.${k}`)}
                value={form[k]}
                placeholder={ph}
                onChange={(v) => update({ [k]: v })}
                onCopy={onCopy}
              />
            </Field>
          ))
        ) : (
          <Field id="entity-url" label={t("settings.field.url")} error={errors.url}>
            <Input
              id="entity-url"
              type="text"
              inputMode="url"
              value={form.url ?? ""}
              onChange={(e) => update({ url: e.target.value })}
              placeholder="https://"
              spellCheck={false}
              autoComplete="off"
              className="pointer-coarse:h-11"
              {...invalid("url")}
            />
          </Field>
        )}
      </Group>

      <Group title={t("settings.catalog.form.groupLook")}>
        {/* Önizleme: kartta nasıl görüneceği — logo ikonun yerine geçer. */}
        <div className="flex items-center gap-3 px-4 py-3" aria-hidden="true">
          <LogoBox item={form} kind={kind} className="size-11 rounded-xl" />
          <span className="min-w-0">
            <span
              className={cn(
                "block truncate text-sm font-medium",
                !form.name && "text-muted-foreground",
              )}
            >
              {form.name || t(`settings.catalog.new.${kind}`)}
            </span>
            {form.description && (
              <span className="block truncate text-xs text-muted-foreground">
                {form.description}
              </span>
            )}
          </span>
        </div>
        {/* Etiket denetime bağlı (grup): ekran okuyucu "Robot01Icon" yerine "İkon" bağlamını duyar. */}
        <div role="group" aria-labelledby="entity-icon-label" className="grid gap-1.5 px-4 py-3">
          <span id="entity-icon-label" className="text-[0.8125rem] font-medium">
            {t("settings.catalog.form.icon")}
          </span>
          <IconPicker value={form.iconName} onChange={(name) => update({ iconName: name })} />
        </div>
        <div role="group" aria-labelledby="entity-logo-label" className="grid gap-1.5 px-4 py-3">
          <span id="entity-logo-label" className="text-[0.8125rem] font-medium">
            {t("settings.field.logo")}
          </span>
          <LogoUpload value={form.logo} onChange={(logo) => update({ logo })} />
        </div>
      </Group>

      <Group title={t("settings.catalog.form.groupStatus")}>
        <ActiveSwitch checked={form.isActive !== false} onChange={(v) => update({ isActive: v })} />
      </Group>

      {onDelete && (
        // Tehlikeli iş formun sonunda, ayrı (Vercel/Shopify): kaydetme şeridinde değil.
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-[0.8125rem] font-medium text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 pointer-coarse:h-11"
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={1.8} />
          {t("settings.catalog.row.delete")}
        </button>
      )}
    </div>
  )
}
