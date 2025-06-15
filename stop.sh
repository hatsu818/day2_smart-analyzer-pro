#!/bin/bash

echo "🛑 Smart Analyzer Pro を停止中..."

# 開発プロセス停止
pkill -f "uvicorn main:app" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true

# Docker停止
if command -v docker-compose &> /dev/null; then
    docker-compose down 2>/dev/null || true
fi

echo "✅ 停止完了"
