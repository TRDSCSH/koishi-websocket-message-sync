import { Server, WebSocket } from 'ws'
import { h, Context, Schema } from 'koishi'

export const name = 'websocket-message-sync'

export interface Config {}

export const Config: Schema<Config> = Schema.object({
    selfId: Schema.string().default('-100').description('群聊 ID'),
    port: Schema.number().default(8888).description('WebSocket 监听端口'),
}).description('Telegram 消息同步配置')

export function apply(ctx: Context, config: Config) {
  const platform = 'telegram'
  const selfId = config['selfId']
  const port = config['port']
  let wss

  if (!selfId) {
    console.error('未设置 selfId')
    return
  } else if (!port) {
    console.error('未设置 port')
    return
  }

  try {
    wss = new Server({ port: port })
  } catch (error) {
    console.error('WebSocket 服务器启动失败: %s', error)
    return
  }
  console.log('WebSocket server listening on port %d', port)

  wss.on('connection', (ws: WebSocket) => { // 监听客户端连接
    console.log('Connection open')

    ctx.on('message', (session) => { // 监听 TG 消息
      const authorId = session.author.id
      const content = session.content

      console.log(`[${authorId}] ${content}`)
      ws.send(`§3[群聊]§r §2<${authorId}>§r ${content}`)
    })
    
    ws.on('message', (message: string) => { // 监听客户端消息
      console.log('[WS消息] %s', message)
      ctx.broadcast([`${platform}:${selfId}`], h.text(`${message}`));
    })
  
    ws.on('close', () => { // 监听客户端关闭
      console.log('Connection closed.')
      ctx.broadcast([`${platform}:${selfId}`], `客户端掉线了`)
    })
  })
}