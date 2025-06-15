# Smart Analyzer Pro - デプロイメントガイド

## 🌐 公開方法の選択肢

### 1. 完全なアプリケーション公開（推奨）

#### A. Heroku（簡単）
```bash
# Herokuアカウント作成後
heroku create smart-analyzer-pro-backend
heroku create smart-analyzer-pro-frontend

# バックエンドデプロイ
cd backend
git init
git add .
git commit -m "Initial commit"
heroku git:remote -a smart-analyzer-pro-backend
git push heroku main

# フロントエンドデプロイ
cd ../frontend
npm run build
# Heroku Buildpack for create-react-app使用
```

#### B. Vercel + Railway/Render（モダン）
```bash
# フロントエンド（Vercel）
vercel --prod

# バックエンド（Railway）
railway login
railway new
railway up
```

#### C. AWS/GCP（本格運用）
- AWS: EC2 + S3 + CloudFront
- GCP: App Engine + Cloud Storage

### 2. デモ版をGitHub Pagesで公開

**制限**: ファイルアップロード機能は無効、サンプルデータのみ表示

#### セットアップ手順

1. **フロントエンドをデモ用に改造**
2. **サンプルデータをハードコード**
3. **GitHub Pagesでホスト**

### 3. Docker Hubで配布

```bash
# イメージビルド
docker-compose build

# Docker Hubにプッシュ
docker tag smart-analyzer-pro_backend:latest username/smart-analyzer-pro-backend
docker tag smart-analyzer-pro_frontend:latest username/smart-analyzer-pro-frontend

docker push username/smart-analyzer-pro-backend
docker push username/smart-analyzer-pro-frontend
```

## 🚀 推奨デプロイメント

### Option 1: Vercel + Railway
- **フロントエンド**: Vercel（無料）
- **バックエンド**: Railway（月$5〜）
- **メリット**: 簡単、高速、スケーラブル

### Option 2: Heroku
- **フロントエンド**: Heroku（無料プランあり）
- **バックエンド**: Heroku（無料プランあり）
- **メリット**: 一つのプラットフォーム、Git連携

### Option 3: 自前サーバー
- **VPS**: DigitalOcean、Linode、さくらVPS
- **設定**: Nginx + PM2 + SSL証明書

## 📋 デプロイ準備チェックリスト

- [ ] 環境変数の設定
- [ ] CORS設定の更新
- [ ] API URLの設定
- [ ] エラーハンドリングの強化
- [ ] ログ設定
- [ ] セキュリティ設定
- [ ] SSL証明書設定

## 🔒 セキュリティ考慮事項

- ファイルアップロードサイズ制限
- CORS設定
- レート制限
- データ暗号化
- ユーザー認証（必要に応じて）

## 💰 コスト見積もり

| プラットフォーム | フロントエンド | バックエンド | 合計/月 |
|------------------|----------------|--------------|---------|
| Vercel + Railway | 無料 | $5-20 | $5-20 |
| Heroku | 無料 | $7-25 | $7-25 |
| AWS | $1-5 | $10-50 | $11-55 |
| 自前VPS | - | $5-20 | $5-20 |