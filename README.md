# Smart Analyzer Pro - 高度な増減理由分析アプリ

🚀 **次世代の増減理由分析プラットフォーム** - React + FastAPI構成による高度で美しいUIの分析アプリです。

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-green.svg)
![React](https://img.shields.io/badge/react-18+-blue.svg)
![FastAPI](https://img.shields.io/badge/fastapi-0.104+-green.svg)

## ✨ 主な特徴

### 🎨 モダンなUI/UX
- **React + TypeScript** による型安全で保守性の高いフロントエンド
- **Ant Design** による美しく統一されたデザインシステム
- **ドラッグ&ドロップ** ファイルアップロード機能
- **リアルタイム** データ検証とフィードバック

### 🧠 高度な分析機能
- **統計的検定** (正規性検定、t検定)
- **分散分析** と変動係数計算
- **相関分析** (多変量データ対応)
- **時系列トレンド分析** (日付データ自動検出)
- **AI生成インサイト** による要因推測

### 📊 豊富な可視化
- **インタラクティブ棒グラフ** (Recharts使用)
- **散布図** (差額 vs 差異率)
- **ヒストグラム** (変化の分布)
- **トレンドチャート** (時系列データ)

### ⚡ パフォーマンス最適化
- **データ型最適化** によるメモリ使用量削減
- **非同期処理** による高速レスポンス
- **最大100万行** のデータ処理対応
- **チャンク処理** による大容量ファイル対応

## 🚀 クイックスタート

### 自動セットアップ（推奨）

```bash
# プロジェクトをクローン/ダウンロード
cd smart_analyzer_pro

# 自動セットアップ実行
./setup.sh

# アプリケーション起動
./start-dev.sh
```

### 手動セットアップ

#### 1. 依存関係の確認
- Python 3.8+ 
- Node.js 16+
- npm

#### 2. バックエンドセットアップ
```bash
cd backend

# 仮想環境作成
python3 -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate

# 依存関係インストール
pip install -r requirements.txt

# サーバー起動
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 3. フロントエンドセットアップ
```bash
cd frontend

# 依存関係インストール
npm install

# 開発サーバー起動
npm start
```

### Docker利用（オプション）

```bash
# Docker Compose起動
docker-compose up --build

# バックグラウンド実行
docker-compose up -d
```

## 🌐 アクセス先

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8000
- **API文書**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📖 使用方法

### 1. データアップロード
1. **期首データ** と **期末データ** のCSVファイルをドラッグ&ドロップ
2. 自動でデータ品質分析が実行され、結果が表示されます
3. 重複行の削除や型最適化が自動実行されます

### 2. 分析設定
1. **比較粒度**: 集計単位（部門、商品など）を選択
2. **値列**: 分析対象の数値列（売上、数量など）を選択
3. **集計方法**: 合計/平均/件数から選択
4. **増減理由の粒度**: 詳細分析する下位項目を複数選択
5. **高度なオプション**: 統計検定やトレンド分析の有効/無効

### 3. 結果確認
- **サマリーカード**: 分析概要の数値表示
- **AIインサイト**: 自動生成された要因分析
- **インタラクティブグラフ**: 複数の可視化オプション
- **詳細テーブル**: フィルタリング・ソート・検索機能付き

## 📊 分析機能詳細

### 基本分析
- **差分集計**: 期首期末の数値比較
- **変化率計算**: パーセンテージでの変動表示
- **重要度判定**: 変化の大きさに基づく5段階評価

### 高度な分析
- **統計的有意性**: t検定による変化の統計的検証
- **分散分析**: 変動の均質性評価
- **相関分析**: 複数指標間の関係性分析
- **トレンド分析**: 時系列パターンの検出

### ブレイクダウン分析
- **下位粒度分析**: 指定した項目での詳細要因分析
- **寄与度計算**: 各要因の影響度定量化
- **自動テキスト化**: 増減理由の自然言語生成

## 🔧 技術仕様

### フロントエンド
- **React 18** + **TypeScript**
- **Ant Design 5** (UIコンポーネント)
- **Recharts** (データ可視化)
- **Styled Components** (スタイリング)
- **React Query** (API状態管理)
- **Axios** (HTTP通信)

### バックエンド
- **FastAPI** (高性能WebAPI)
- **pandas** (データ処理)
- **NumPy** (数値計算)
- **SciPy** (統計処理)
- **Pydantic v2** (データ検証)
- **uvicorn** (ASGIサーバー)

### インフラ
- **Docker** + **Docker Compose**
- **Nginx** (本番環境リバースプロキシ)
- **Multi-stage builds** (最適化されたイメージ)

## 📁 プロジェクト構造

```
smart_analyzer_pro/
├── backend/                 # FastAPI バックエンド
│   ├── main.py             # メインAPIアプリケーション
│   ├── requirements.txt    # Python依存関係
│   └── Dockerfile          # バックエンドDockerfile
├── frontend/               # React フロントエンド
│   ├── src/
│   │   ├── components/     # Reactコンポーネント
│   │   ├── services/       # API通信
│   │   ├── types/          # TypeScript型定義
│   │   ├── utils/          # ユーティリティ関数
│   │   ├── App.tsx         # メインアプリケーション
│   │   └── index.tsx       # エントリーポイント
│   ├── package.json        # Node.js依存関係
│   ├── Dockerfile          # フロントエンドDockerfile
│   └── nginx.conf          # Nginx設定
├── data/                   # サンプルデータ
├── docs/                   # ドキュメント
├── docker-compose.yml      # Docker Compose設定
├── setup.sh               # 自動セットアップスクリプト
└── README.md              # このファイル
```

## 🎯 利用シーン

### ビジネス分析
- **売上分析**: 前年同期比、予算実績差異
- **顧客分析**: セグメント別パフォーマンス
- **商品分析**: 品目別売上変動

### 財務分析
- **収益分析**: 事業部別業績評価
- **コスト分析**: 費用項目別変動要因
- **予算管理**: 計画実績差異分析

### オペレーション分析
- **在庫分析**: 品目別在庫変動
- **生産分析**: 工程別効率変化
- **品質分析**: 不良率変動要因

## 🔍 データ要件

### ファイル形式
- **CSV形式** (UTF-8エンコーディング推奨)
- **最大ファイルサイズ**: 200MB
- **最大行数**: 100万行

### データ構造
- **同一構造**: 期首・期末データは同じ列構成が必要
- **必須列**: 最低1つのカテゴリ列と1つの数値列
- **日付列**: トレンド分析用（オプション）

## 📈 パフォーマンス

### 処理性能
- **10万行**: 1-3秒
- **50万行**: 5-10秒
- **100万行**: 10-30秒

### メモリ最適化
- **データ型最適化**: 自動で最適なデータ型に変換
- **カテゴリ化**: 重複の多い文字列列を自動最適化
- **チャンク処理**: 大容量データの分割処理

## 🛠️ 開発・カスタマイズ

### 開発環境起動
```bash
# バックエンド（開発モード）
cd backend
source venv/bin/activate
uvicorn main:app --reload

# フロントエンド（開発モード）
cd frontend
npm start
```

### API文書
FastAPIの自動生成文書が利用可能：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### カスタマイズポイント
1. **分析ロジック**: `backend/main.py` の分析関数
2. **UI コンポーネント**: `frontend/src/components/`
3. **チャート設定**: `AnalysisResults.tsx` のRecharts設定
4. **スタイリング**: `styled-components` によるカスタムスタイル

## 🚀 今後の拡張予定

- [ ] **ウォーターフォールチャート** 対応
- [ ] **多期間比較** 機能
- [ ] **レポート自動生成** (PDF出力)
- [ ] **ダッシュボード機能** (複数分析の並列表示)
- [ ] **機械学習予測** 機能
- [ ] **リアルタイムデータ** 連携
- [ ] **ユーザー認証** システム
- [ ] **データベース連携** (PostgreSQL/MySQL)

## 🤝 貢献

プルリクエストや課題報告は歓迎します！

### 開発ガイドライン
1. TypeScript の型安全性を保つ
2. コンポーネントの再利用性を重視
3. API レスポンス時間の最適化
4. ユーザビリティテストの実施

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 📞 サポート

- **GitHub Issues**: バグ報告・機能要望
- **Documentation**: 詳細な技術文書は `/docs` フォルダ
- **API Reference**: http://localhost:8000/docs

---

**Smart Analyzer Pro** - データドリブンな意思決定を加速する次世代分析プラットフォーム 🚀