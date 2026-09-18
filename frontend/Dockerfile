FROM node:20-alpine

WORKDIR /app/frontend

# 패키지 매니페스트 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 파일 복사
COPY . .

EXPOSE 5173

# Vite 개발 서버 실행 (외부 바인딩)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
