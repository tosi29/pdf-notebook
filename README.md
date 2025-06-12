# pdf-notebook

React + Tailwind CSS による最小限の構成

## 開発環境のセットアップ

```bash
npm install
```

## 開発サーバーの起動

```bash
npm run dev
```

## ビルド

```bash
npm run build
```

## プレビュー

```bash
npm run preview
```

## デプロイメント

このプロジェクトは GitHub Actions を使用して自動デプロイされます：

### 本番環境
- **GitHub Pages**: `main` ブランチにマージされると自動的にデプロイされます
- **URL**: https://tosi29.github.io/pdf-notebook/

### プレビュー環境
- **PR プレビュー**: Pull Request を作成すると、独立したプレビュー環境がデプロイされます
- **Surge.sh**: 各PRに対して `https://pdf-notebook-pr-{PR番号}.surge.sh` でアクセス可能
- プレビューURLはPRのコメントに自動投稿されます

### セットアップが必要なシークレット
PR プレビューを有効にするために、以下のシークレットをリポジトリに設定してください：

- `SURGE_TOKEN`: Surge.sh のアクセストークン（https://surge.sh から取得）

## 技術構成

- **React 18** - UI フレームワーク
- **Tailwind CSS 3** - ユーティリティファーストのCSS フレームワーク  
- **Vite 5** - 高速なビルドツール
- **PostCSS** - CSS後処理
- **Autoprefixer** - ベンダープレフィックスの自動付与
- **GitHub Actions** - CI/CD パイプライン
- **GitHub Pages** - 本番環境ホスティング
- **Surge.sh** - プレビュー環境ホスティング