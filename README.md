# Tria

**3つのフォーカスで、静かに日々を研ぎ澄ます**

Triaは、J.D. Meierが提唱した「Three Wins」メソッド（3のルール）を実践するためのmacOSメニューバーアプリです。

## 特徴

- **3つの目標設定** - 今日・今週・今月、それぞれ3つの目標を設定
- **メニューバー常駐** - いつでもワンクリックでアクセス
- **フローティングウィンドウ** - Stickiesのように画面上に常時表示
- **達成演出** - 目標達成時にConfetti（紙吹雪）アニメーション
- **振り返り機能** - 日々の振り返りで継続的改善をサポート

## 動作環境

- macOS 13.0 (Ventura) 以降

## インストール

### ビルド済みアプリ

1. [Releases](../../releases) から最新の `Tria.app.zip` をダウンロード
2. 解凍して `Tria.app` を `/Applications` にコピー
3. アプリを起動

### ソースからビルド

```bash
# リポジトリをクローン
git clone https://github.com/qluto/tria.git
cd tria

# ビルドスクリプトを実行
./scripts/build-app.sh

# アプリを実行
open build/Tria.app

# （オプション）アプリケーションフォルダにインストール
cp -r build/Tria.app /Applications/
```

## 開発

```bash
# ビルド
swift build

# 実行
swift run

# 停止
pkill -f Tria
```

## 使い方

1. アプリを起動すると、メニューバーに三角形のアイコンが表示されます
2. アイコンをクリックしてポップオーバーを開き、目標を設定
3. 「フローティングウィンドウを表示」で常時表示モードに
4. 目標を達成したらチェックボタンをクリック

## 技術スタック

| 項目 | 技術 |
|------|------|
| 言語 | Swift 5.9 |
| UI | SwiftUI + AppKit |
| フローティング | NSPanel |
| データ保存 | UserDefaults |
| アーキテクチャ | MVVM |

## ライセンス

MIT License

## 参考

- J.D. Meier『Getting Results the Agile Way』
- [Three Wins / Rule of 3 for Results](https://www.yourscrum.com/en/blog/the-rule-of-3/)
