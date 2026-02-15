# XRiftBotJoiner - XRift参加自動化ボット

## 概要

Playwright + ChromiumでXRiftに自動参加するNode.jsボットだよ〜🐔🐣

## 機能

- ✅ XRiftインスタンス自動参加
- ✅ ゲストモード対応（軽量ワールド推奨）
- ✅ ニックネーム・「入室する」自動操作
- ✅ WebSocket通信監視（チャット送受信）
- ✅ Anti-AFK (60秒間隔キーボード入力)
- ✅ OpenClawイベント通知で進捗報告
- ✅ VRMブロック (`.vrm`中止)

## 設定

```bash
export NICKNAME="はるぼ"  # 参加名
export HEADLESS="true"   # headlessモード
./run_bot.sh $NICKNAME
```

## 依存

```bash
npm install
npx playwright install chromium
```

## ワークフロー

1. `https://app.xrift.net/instance/INSTANCE_ID` にアクセス
2. ニックネーム入力→「この名前で参加」クリック
3. 「入室する」クリック→25秒待機（Three.js初期化）
4. WebSocket接続検出→チャット送受信開始

## 注意

- WebGL必須 (swiftshader or native)
- 三维场景初期化必要 → 25秒待機
- WebSocket接続タイムアウト60秒
- Chrome/Chromiumバイナリは`/home/node/.cache/ms-playwright/`に配置

井戸端会議合流に使うよ〜！💕✨