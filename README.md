# 世界のちいさな村

低ポリ3Dの箱庭で、国球たちを迎えながら村を育てる小さなゲームです。

## 開発

```bash
npm install
npm run dev
```

テストとproduction buildは次のコマンドで実行できます。

```bash
npm test
npm run lint
npm run build
```

Cloudflare Pagesでは、ビルドコマンドを `npm run build`、出力ディレクトリを `dist` に設定してください。

## 操作

- ドラッグ：カメラをパン
- ホイール：ズーム
- 「建築」から建物を選び、村のセルをクリック：配置
- 配置済みの建物をクリック：移動・撤去
- 住民をクリック：現在の状態を表示

ゲーム状態はブラウザのlocalStorageへ自動保存されます。
