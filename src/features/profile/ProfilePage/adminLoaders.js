/**
 * Yönetim bölümlerinin parçaları: yalnız yöneticide iner. Menüde imleç ya da odak satıra gelince
 * önceden istenir (Linear'ın önden yüklemesi gibi): tıklayınca bölüm beklemeden açılır.
 */
export const LOADERS = {
  catalog: () => import("@/features/settings/SettingsPage"),
  orb: () => import("../orbStudio/MascotStudioCard"),
}

export function prefetchSection(id) {
  LOADERS[id]?.().catch(() => {
    // Ağ hatası: tıklanınca `lazy` yeniden dener.
  })
}
