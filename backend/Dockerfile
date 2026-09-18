FROM ubuntu:24.04

# 기본 시스템 빌드 도구 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    build-essential \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# elan 환경변수 설정
ENV ELAN_HOME="/root/.elan"
ENV PATH="/root/.elan/bin:${PATH}"

WORKDIR /app/backend

# toolchain 파일 복사 및 지정된 Lean 버전 설치
COPY lean-toolchain ./
RUN curl -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none \
    && elan toolchain install $(cat lean-toolchain) \
    && elan default $(cat lean-toolchain)

# 프로젝트 소스 복사
COPY lakefile.lean Backend.lean Main.lean ./
COPY Backend/ ./Backend/

# 사전 빌드 완료 후 시스템 바이너리 디렉토리에 보존
RUN lake build && cp ./.lake/build/bin/backend /usr/local/bin/lean4-backend

EXPOSE 8080

# 시작 시 사전 빌드된 바이너리로 즉시 포트 오픈 (빌드 대기시간 제거)
CMD ["sh", "-c", "if [ -f ./.lake/build/bin/backend ]; then ./.lake/build/bin/backend ${BACKEND_PORT:-8080}; else /usr/local/bin/lean4-backend ${BACKEND_PORT:-8080}; fi"]
