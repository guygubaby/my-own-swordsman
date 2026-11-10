import { authClient } from "./auth-client"

const nicknames = [
  "同福临时工",
  "后院扫地僧",
  "七侠镇路人甲",
  "客栈试菜员",
  "郭芙蓉的沙袋",
  "莫小贝的跟班",
  "邢捕头的线人",
  "燕小六的七舅姥爷",
  "白展堂的跑鞋",
]

export function randomNickname() {
  return nicknames[Math.floor(Math.random() * nicknames.length)]
}

export async function signInGuest() {
  const result = await authClient.signIn.anonymous()
  if (!result.error) {
    await authClient.updateUser({ name: randomNickname() })
  }
  return result
}
