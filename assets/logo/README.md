# 🎨 sogoods.net ロゴ配置ガイド

## 📁 ロゴファイル配置場所

```
assets/logo/ フォルダにロゴを配置してください
```

## 📐 推奨サイズ・形式

### **メインロゴ**
- **サイズ**: 120x80px 推奨
- **形式**: .png (透明背景), .svg (ベクター), .jpg
- **ファイル名例**: 
  - `sogoods-logo.png`
  - `logo-main.svg` 
  - `brand-logo.png`

### **デザイン指針**
- **シンプル**: 小さいサイズでも視認性良好
- **モノクロ対応**: 黒背景でも白背景でも映える
- **ブランドカラー**: 青系(#2196F3)のアクセント推奨

## 🔧 ロゴの適用方法

### **1. ファイル配置**
```bash
# ロゴファイルを配置
cp your-logo.png /path/to/webapp/assets/logo/sogoods-logo.png
```

### **2. HTMLでの使用**
```javascript
// JavaScript で動的に適用
document.getElementById('main-logo').innerHTML = 
    '<img src="/assets/logo/sogoods-logo.png" alt="sogoods.net">';
```

### **3. CSS適用**
```css
.logo {
    background-image: url('/assets/logo/sogoods-logo.png');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
}
```

## 🎯 現在の状態

- **プレースホルダー**: "LOGO" テキストを表示中
- **準備完了**: ロゴファイル配置後すぐに反映可能
- **フォールバック**: ロゴが無い場合はテキスト表示

## 💡 Tips

- **SVGファイル**: スケーラブルで最も推奨
- **ファビコン**: 同じロゴでfavicon.icoも作成推奨
- **ダークモード**: 将来的に白バージョンも準備
- **アニメーション**: CSS/JSでホバー効果も可能