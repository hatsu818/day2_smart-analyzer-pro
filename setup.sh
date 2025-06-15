#!/bin/bash

# Smart Analyzer Pro Setup Script
# このスクリプトは開発環境のセットアップを自動化します

set -e

echo "🚀 Smart Analyzer Pro セットアップ開始"
echo "=================================="

# 関数定義
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 がインストールされていません"
        echo "   インストール方法: $2"
        exit 1
    else
        echo "✅ $1 が見つかりました"
    fi
}

# 依存関係チェック
echo "📋 依存関係をチェック中..."
check_command "python3" "https://www.python.org/downloads/ からPython 3.8+をインストールしてください"
check_command "node" "https://nodejs.org/ からNode.js 16+をインストールしてください"
check_command "npm" "Node.jsと一緒にインストールされます"

# Dockerの確認（オプション）
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "✅ Docker & Docker Compose が見つかりました（オプション機能利用可能）"
    DOCKER_AVAILABLE=true
else
    echo "⚠️  Docker が見つかりません（開発モードのみ利用可能）"
    DOCKER_AVAILABLE=false
fi

echo ""

# バックエンドセットアップ
echo "🐍 バックエンド（Python/FastAPI）をセットアップ中..."
cd backend

# 仮想環境作成
if [ ! -d "venv" ]; then
    echo "   仮想環境を作成中..."
    python3 -m venv venv
fi

# 仮想環境アクティベート
echo "   仮想環境をアクティベート中..."
source venv/bin/activate

# 依存関係インストール
echo "   Python依存関係をインストール中..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ バックエンドセットアップ完了"
cd ..

echo ""

# フロントエンドセットアップ
echo "⚛️  フロントエンド（React/TypeScript）をセットアップ中..."
cd frontend

# Node.js依存関係インストール
echo "   Node.js依存関係をインストール中..."
npm install

echo "✅ フロントエンドセットアップ完了"
cd ..

echo ""

# 起動スクリプト作成
echo "📝 起動スクリプトを作成中..."

# 開発モード起動スクリプト
cat > start-dev.sh << 'EOF'
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
EOF

chmod +x start-dev.sh

# Docker起動スクリプト（Dockerが利用可能な場合）
if [ "$DOCKER_AVAILABLE" = true ]; then
    cat > start-docker.sh << 'EOF'
#!/bin/bash

echo "🐳 Smart Analyzer Pro Docker起動"
echo "==============================="

# Docker Composeでアプリケーション起動
echo "コンテナをビルド・起動中..."
docker-compose up --build

echo "✅ Dockerアプリケーションが起動しました！"
echo "   フロントエンド: http://localhost:3000"
echo "   バックエンドAPI: http://localhost:8000"
echo "   API文書: http://localhost:8000/docs"
EOF

    chmod +x start-docker.sh
fi

# 停止スクリプト
cat > stop.sh << 'EOF'
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
EOF

chmod +x stop.sh

echo ""

# セットアップ完了
echo "🎉 セットアップ完了！"
echo "=================="
echo ""
echo "📖 利用方法:"
echo "   開発モード: ./start-dev.sh"
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "   Dockerモード: ./start-docker.sh"
fi
echo "   停止: ./stop.sh または Ctrl+C"
echo ""
echo "🌐 アクセス先:"
echo "   フロントエンド: http://localhost:3000"
echo "   バックエンドAPI: http://localhost:8000"
echo "   API文書: http://localhost:8000/docs"
echo ""
echo "📁 サンプルデータは data/ フォルダにあります"
echo ""
echo "🚀 今すぐ起動するには: ./start-dev.sh"