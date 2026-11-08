// Yeni toplantı penceresinin tembel parçası (`LazyMeetingDialog`).
export const loadMeeting = () => import("./meeting/MeetingDialog")

/** "Yeni" menüsü açılınca parça önceden iner: "Toplantı"ya basan beklemez. */
export const preloadMeeting = () => {
  loadMeeting().catch(() => {})
}
