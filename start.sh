#!/bin/bash

# 기존 실행 중인 서버 프로세스 종료 (server.js, vite 6978 포트 등)
echo "Existing process cleanup..."
pkill -f "tsx server.js" 2>/dev/null || true
pkill -f "vite.*6978" 2>/dev/null || true

# 3001, 6978 포트를 사용 중인 프로세스가 있다면 추가 kill
for PORT in 3001 6978; do
  PORT_PID=$(lsof -ti:$PORT 2>/dev/null)
  if [ -n "$PORT_PID" ]; then
    kill -9 $PORT_PID 2>/dev/null || true
  fi
done

sleep 1

echo "Starting server and dev client..."
npx tsx server.js &
npm run dev -- --port=6978

