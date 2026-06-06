# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


Project Console: https://console.firebase.google.com/project/my-kakeibo-1bde9/overview
Hosting URL: https://my-kakeibo-1bde9.web.app

# 開発

# 環境
Node v24.13.1
Vine

# ビルド
npm install

## 本番適用
# 1. プログラムを本番用の「軽量版」に変換する
npm run build

# 2. Firebase のサーバーにアップロードする
firebase deploy

## ディレクトリ構造一覧
my-kakeibo/
├── public/              # PWA用アイコンやマニフェストファイル
│   ├── icon-192.png
│   ├── icon-512.png
│   └── manifest.webmanifest
├── src/
│   ├── assets/          # 画像やアイコン（SVGなど）
│   ├── components/      # 【重要】再利用する小さな部品（ボタン、入力欄など）
│   │   ├── Calculator.jsx    # 電卓パネル
│   │   └── CategoryGrid.jsx  # カテゴリ選択
│   ├── screens/         # 【重要】画面ごとの大きな塊
│   │   ├── LoginScreen.jsx   # ログイン画面
│   │   ├── CalendarScreen.jsx# カレンダー画面（今作ってるやつ）
│   │   └── InputScreen.jsx   # 新規入力画面（これから作るやつ）
│   ├── firebase.js      # Firebaseの設定・初期化
│   ├── App.jsx          # 全体の交通整理（ログインチェック・画面切り替え）
│   ├── App.css          # 全体（#root）のレイアウト設定
│   └── main.jsx         # Reactの起動地点
├── index.html           # HTMLの土台（Viewportの設定など）
├── package.json         # ライブラリの管理（react-calendarなど）
└── vite.config.js       # Viteの設定

https://kabochanicomi.github.io/kakeibo-pwa/