# Testing

テストは責務別のVitest workspace projectに分けている。実行コマンドの正本は `package.json` のscriptsであり、ここでは選択基準だけを記録する。

## 3つのproject

- `domain`: `src/game`、定義、計算、描画に依存しないシーン補助など、Nodeで完結するModule。
- `store`: Zustand StoreとゲームSystemの接続、Store操作から見える状態遷移。Nodeで実行する。
- `ui`: React UI、DOM、ブラウザイベント、scene rendererなどjsdomが必要なテスト。

ゲーム要素を追加・変更するときは、次の責務でdomainの観測点を分ける。

- `ProductCatalog` と `InventorySystem` は、全item idの定義、canonical inventoryの生成・正規化、加算・消費・不足時のno-opを直接テストする。種と採掘資源が商品在庫へ混ざらないことも確認する。
- `ProductDemandSystem` は、同じ日付とメニューから同じ日替わり人気商品が得られること、国別favoriteと人気商品が選択weightと販売価格へ反映されること、在庫のない商品を選ばないことをテストする。
- `MarketOrderSystem` は、解禁済み店舗からの注文生成、3件維持、期限なしの納品後補充、全明細の原子的な在庫消費、不足時の状態不変、通常販売より高い報酬をテストする。
- `BuildingUpgradeSystem` は、建物種別ごとの対応track、level 0〜3、採掘素材の不足時no-op、購入時の原子的な消費、速度・接客時間・行列容量の算出、撤去時のupgrade削除をテストする。
- `ShopVisitorSystem` と `FactoryProductionSystem` は、上記Moduleの結果がそれぞれ商品選択・販売価格・接客時間・行列容量・工場生産間隔へ接続されることをテストする。共通ルール自体の同じケースをFacadeテストへ重複させない。

テストファイルを追加するときは、テスト対象の責務を基準に配置する。Storeを経由していてもDOMを描画しない接続テストは `store`、DOMやブラウザAPIを観測するテストは `ui` とする。1ファイル内で責務が混ざる場合は、先に分割できるInterfaceを検討する。

## 変更から実行範囲を選ぶ

| 変更 | 反復時 | push前 |
| --- | --- | --- |
| `src/game` のルール・定義 | `npm run test:domain`、必要なら `npm run test:related -- src/...` | 全suite、lint、build |
| `src/store` またはStore操作 | `npm run test:store` と関係する `domain` | 全suite、lint、build |
| `src/ui`、`src/scene`、DOM/ブラウザ接続 | `npm run test:ui` と関係するStore | 全suite、lint、build |
| テスト設定、分類、共通fixture | 変更したproject | 全suite、lint、build |

`GameProgressSystem` の変更では、まず `tests/domain/GameProgressSystem.test.ts` を時間・乱数を注入して反復し、通知・進行後状態・即時保存シグナルをInterfaceから確認する。Storeのtickを通すテストは、Zustandと保存Adapterの接続を確認する最小ケースに限定する。

生産の共通化では、`LivestockProductionSystem` と `FactoryProductionSystem` のdirect testで、登録・撤去・no-op identity・保存時normalize、収集または設定、工場のcatch-up・入力不足・複数生産の消費順を確認する。`CowSystem`、`PigSystem`、`ChickenSystem`、各FactorySystemのテストは、buildingId・state/inventory key・readyAt/interval・product定義などのFacade配線と既存公開契約に絞り、共通mechanismの同じケースを重複させない。生産変更時は共通Moduleの `test:related` と、代表Facade（Cow/MilkFactory）の `test:related` を記録する。
`ProductionRegistry` のdirect testでは、6種類すべてのregister/remove、unknown buildingのno-op、6 collectionのnormalize接続、3工場を一度に進行するAdapter契約をtable-drivenに確認する。

在庫・注文・強化の保存責務は `SaveSystem` のdomainテストで確認する。canonical inventoryの全item id、壊れた数量、無効な注文・重複注文、現存しない建物のupgrade、旧scalar在庫saveが新しい初期GameStateへ戻ることを、インメモリStorageLikeから観測する。通常のStore更新でrepairが実行されないことはStore側の最小接続テストに限定する。

`test:related` は変更したソースパスを引数に取り、VitestのModule graphから関連テストを選ぶ。選択結果が空、または依存関係を判断しづらい場合は、該当projectを実行する。

新しい `*.test.ts` は3つのproject配下へ置く。`npm run test:layout` が `tests/` 直下や未知の分類フォルダを検出するため、CIで分類漏れを検証できる。

## 完了条件

作業中は変更に対応するprojectが成功していることを確認する。push前は `npm run test:layout`、`npm test`、`npm run lint`、`npm run build`、必要に応じて `npm run secrets:scan` を実行し、ファイル数・テスト数が意図せず減っていないことを確認する。
