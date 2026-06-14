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
http://localhost:5173/kakeibo-pwa/