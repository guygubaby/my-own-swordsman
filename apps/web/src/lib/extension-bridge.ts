/**
 * 把站内进度递给「同福弹幕」插件（如果装了）。
 * 插件的内容脚本在本站监听这个消息，写进 chrome.storage.local；
 * 打开央视网同一集时，插件据此把视频跳到上次的位置。
 */
export function sendProgressToExtension(episode: number, time: number, duration: number) {
  if (!Number.isFinite(episode) || !Number.isFinite(time) || time < 5) return
  window.postMessage(
    {
      type: "tongfu-extension:progress",
      episode,
      time,
      duration: Number.isFinite(duration) ? duration : 0,
      updatedAt: Date.now(),
    },
    window.location.origin,
  )
}
