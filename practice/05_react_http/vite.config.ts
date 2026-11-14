import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * 只在本轮练习里用的 mock 服务端错误路由。
 * public/mock 下的静态 JSON 只能返回 200，无法演练“服务端 5xx”，
 * 所以用 dev server 中间件补一个真正返回 500 的路径。
 * 接真实后端后，这个插件可以整体删掉。
 */
function mockErrorRoute(): Plugin {
  return {
    name: 'practice-mock-error-route',
    configureServer(server) {
      server.middlewares.use('/mock/todos-error.json', (_req, res) => {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ message: '模拟服务端错误' }))
      })
    },
  }
}

// 模拟数据放在 public/mock 下，dev 时与页面同源（http://localhost:5173/mock/todos.json），
// 所以本轮不需要 proxy，也不涉及跨域配置。
export default defineConfig({
  plugins: [react(), mockErrorRoute()],
})
