import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 프로젝트 루트(..) 및 프론트엔드 폴더(.)의 .env 파일 로드
  const rootEnv = loadEnv(mode, '..', '')
  const localEnv = loadEnv(mode, '.', '')
  const env = { ...rootEnv, ...localEnv }

  const frontendPort = parseInt(env.FRONTEND_PORT || '5173', 10)
  const backendPort = env.BACKEND_PORT || '8080'
  const backendHost = env.BACKEND_HOST || '127.0.0.1'

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Docker 컨테이너 및 로컬 외부 바인딩
      port: frontendPort,
      proxy: {
        '/api': {
          target: `http://${backendHost}:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  }
})
