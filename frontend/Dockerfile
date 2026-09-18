FROM node:20-alpine

WORKDIR /app/frontend

# 패키지 매니페스트 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 파일 복사 및 정적 빌드 산출물 생성
COPY . .
RUN npm run build

EXPOSE 5173

# Vite 개발 서버 실행 (볼륨 마운트 시 의존성 보장)
CMD ["sh", "-c", "if [ ! -d node_modules/vite ]; then npm install; fi; npm run dev -- --host 0.0.0.0"]
