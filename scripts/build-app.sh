#!/bin/bash
set -e

# 設定
APP_NAME="Tria"
BUNDLE_ID="com.qluto.tria"
VERSION="1.0.0"
BUILD_NUMBER="1"
MIN_MACOS="13.0"

# ディレクトリ設定
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_DIR/build"
APP_BUNDLE="$BUILD_DIR/$APP_NAME.app"

echo "=== $APP_NAME.app ビルド開始 ==="

# クリーンアップ
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Releaseビルド
echo ">>> Swift Package をビルド中..."
cd "$PROJECT_DIR"
swift build -c release

# バイナリのパスを取得
BINARY_PATH=$(swift build -c release --show-bin-path)/$APP_NAME

if [ ! -f "$BINARY_PATH" ]; then
    echo "エラー: バイナリが見つかりません: $BINARY_PATH"
    exit 1
fi

echo ">>> バイナリ: $BINARY_PATH"

# .appバンドル構造を作成
echo ">>> .appバンドルを作成中..."
mkdir -p "$APP_BUNDLE/Contents/MacOS"
mkdir -p "$APP_BUNDLE/Contents/Resources"

# バイナリをコピー
cp "$BINARY_PATH" "$APP_BUNDLE/Contents/MacOS/$APP_NAME"

# Info.plistを生成
cat > "$APP_BUNDLE/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>ja</string>
    <key>CFBundleExecutable</key>
    <string>$APP_NAME</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>$BUNDLE_ID</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>$VERSION</string>
    <key>CFBundleVersion</key>
    <string>$BUILD_NUMBER</string>
    <key>LSMinimumSystemVersion</key>
    <string>$MIN_MACOS</string>
    <key>LSUIElement</key>
    <true/>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSPrincipalClass</key>
    <string>NSApplication</string>
</dict>
</plist>
EOF

# PkgInfo を作成
echo -n "APPL????" > "$APP_BUNDLE/Contents/PkgInfo"

# アイコンがあればコピー
if [ -f "$PROJECT_DIR/Resources/AppIcon.icns" ]; then
    cp "$PROJECT_DIR/Resources/AppIcon.icns" "$APP_BUNDLE/Contents/Resources/"
    echo ">>> アイコンをコピーしました"
fi

# 署名（オプション）
if [ "${SIGN_APP:-false}" = "true" ] && [ -n "$DEVELOPER_ID" ]; then
    echo ">>> アプリに署名中..."
    codesign --force --deep --sign "$DEVELOPER_ID" "$APP_BUNDLE"
else
    echo ">>> 署名をスキップ（ローカル実行用）"
    # ad-hoc署名（ローカル実行用）
    codesign --force --deep --sign - "$APP_BUNDLE"
fi

echo ""
echo "=== ビルド完了 ==="
echo "出力: $APP_BUNDLE"
echo ""
echo "実行方法:"
echo "  open \"$APP_BUNDLE\""
echo ""
echo "アプリケーションフォルダにコピー:"
echo "  cp -r \"$APP_BUNDLE\" /Applications/"
