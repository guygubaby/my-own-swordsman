// 央视网免费流的打包路径段。绝大多数节目都是这一段；
// 若某天失效，用 manifest.hls_enc_url / hls_url 的返回值兜底即可。
const STREAM_PATH = "0303000a/3/default"

export type CctvLine = {
  id: string
  label: string
  host: string
}

/** 同一条 360P 流的两个可用 CDN，作为「线路」让用户切换兜底。 */
export const cctvLines: CctvLine[] = [
  { id: "cctv-lxdns", label: "央视网 · 线路 A", host: "https://hls.cntv.lxdns.com" },
  { id: "cctv-qcloud", label: "央视网 · 线路 B", host: "https://newcntv.qcloudcdn.com" },
]

export function cctvStreamUrl(guid: string, host: string) {
  return `${host}/asp/hls/450/${STREAM_PATH}/${guid}/450.m3u8`
}

