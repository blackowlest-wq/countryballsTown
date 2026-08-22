# Testing

テストは責務別のVitest workspace projectに分けている。実行コマンドの正本は `package.json` のscriptsであり、ここでは選択基準だけを記録する。

## 3つのproject

- `domain`: `src/game`、定義、計算、描画に依存しないシーン補助など、Nodeで完結するModule。
- `store`: Zustand StoreとゲームSystemの接続、Store操作から見える状態遷移。Nodeで実行する。
- `ui`: React UI、DOM、ブラウザイベント、scene rendererなどjsdomが必要なテスト。

テストファイルを追加するときは、テスト対象の責務を基準に配置する。Storeを経由していてもDOMを描画しない接続テストは `store`、DOMやブラウザAPIを観測するテストは `ui` とする。1ファイル内で責務が混ざる場合は、先に分割できるInterfaceを検討する。

## 変更から実行範囲を選ぶ

| 変更 | 反復時 | push前 |
| --- | --- | --- |
| `src/game` のルール・定義 | `npm run test:domain`、必要なら `npm run test:related -- src/...` | 全suite、lint、build |
| `src/store` またはStore操作 | `npm run test:store` と関係する `domain` | 全suite、lint、build |
| `src/ui`、`src/scene`、DOM/ブラウザ接続 | `npm run test:ui` と関係するStore | 全suite、lint、build |
| テスト設定、分類、共通fixture | 変更したproject | 全suite、lint、build |

`GameProgressSystem` の変更では、まず `tests/domain/GameProgressSystem.test.ts` を時間・乱数を注入して反復し、通知・進行後状態・即時保存シグナルをInterfaceから確認する。Storeのtickを通すテストは、Zustandと保存Adapterの接続を確認する最小ケースに限定する。

`test:related` は変更したソースパスを引数に取り、VitestのModule graphから関連テストを選ぶ。選択結果が空、または依存関係を判断しづらい場合は、該当projectを実行する。

新しい `*.test.ts` は3つのproject配下へ置く。`npm run test:layout` が `tests/` 直下や未知の分類フォルダを検出するため、CIで分類漏れを検証できる。

## 完了条件

作業中は変更に対応するprojectが成功していることを確認する。push前は `npm run test:layout`、`npm test`、`npm run lint`、`npm run build`、必要に応じて `npm run secrets:scan` を実行し、ファイル数・テスト数が意図せず減っていないことを確認する。
