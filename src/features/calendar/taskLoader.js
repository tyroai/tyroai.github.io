// Yeni görev penceresinin tembel parçası (`LazyTaskDialog`).
export const loadTask = () => import("./task/TaskDialog")

/** "Yeni" menüsü açılınca parça önceden iner: "Görev"e basan beklemez. */
export const preloadTask = () => {
  loadTask().catch(() => {})
}
