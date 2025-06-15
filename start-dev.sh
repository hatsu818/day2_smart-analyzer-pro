#!/bin/bash

echo "🚀 Smart Analyzer Pro 開発モード起動"
echo "==================================="

# バックエンド起動（バックグラウンド）
echo "🐍 バックエンドを起動中... (http://localhost:8000)"
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# 少し待機
sleep 3

# フロントエンド起動
echo "⚛️  フロントエンドを起動中... (http://localhost:3000)"
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ アプリケーションが起動しました！"
echo "   フロントエンド: http://localhost:3000"
echo "   バックエンドAPI: http://localhost:8000"
echo "   API文書: http://localhost:8000/docs"
echo ""
echo "停止するには Ctrl+C を押してください"

# シグナルハンドラ
cleanup() {
    echo ""
    echo "🛑 アプリケーションを停止中..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ 停止完了"
    exit 0
}

trap cleanup SIGINT SIGTERM

# プロセス監視
wait
