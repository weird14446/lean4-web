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
COPY lakefile.lean ./
COPY Backend.lean ./
COPY Backend/ ./Backend/
COPY Main.lean ./

# 초기 바이너리 빌드
RUN lake build

EXPOSE 8080

# 컨테이너 실행 시 lake build(볼륨 변경사항 반영) 후 백엔드 실행
CMD ["sh", "-c", "lake build && ./.lake/build/bin/backend ${BACKEND_PORT:-8080}"]
