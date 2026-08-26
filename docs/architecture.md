# Architecture

この文書は、現在のコードを読むための地図と、今後の整理で目指す方向を分けて記録する。新しい構造を既成事実として扱わない。

## 現在のModuleと依存方向

以下は理想の層ではなく、現在のimport依存を簡略化した図である。矢印の向きには、整理対象の結合も含まれる。

```text
React UI / scene / hooks
          ├──► gameStore（Zustand Adapter） ──► game/core
          │                                  └─► game/systems
          └──► game/systems / data / types / constants

gameStore ──► GameProgressSystem ──► game/systems
         └──► SaveSystem ──► StorageLike ──► browser localStorage

ProductCatalog ──► CraftingSystem / ProductDemandSystem / MarketOrderSystem
MarketOrderSystem ──► ProductCatalog + InventorySystem + EconomySystem
BuildingUpgradeSystem ──► miningInventory

BuildingSystem / SaveSystem / GameProgressSystem
          └──► ProductionRegistry ──► production Facade
                                      └──► LivestockProductionSystem / FactoryProductionSystem

FactoryProductionSystem ──► BuildingUpgradeSystem
ShopVisitorSystem ──► ProductDemandSystem / BuildingUpgradeSystem

game/core ──► game/systems / data / types
game/systems ──► game/core / data / types / constants
```

- `src/game/types` は村、建物、住民、生産物などの型を定義する。
- `src/game/data` と `src/game/constants` は建物・魚・図鑑・レベルなどの定義とルール値を持つ。`productCatalog.ts` は加工素材と料理の名前、材料、提供店舗、固定の基準価格、国別の好みをまとめた商品定義の正本である。
- `src/game/core` は初期 `GameState` の生成と建物コレクションの整合性を担当する。
- `src/game/systems` は建築、作物、生産、住民、経済、釣り、保存などのゲームルールをModuleとして公開する。多くは `GameState` と入力を受け、更新後の状態または結果を返す。
- `InventorySystem` は `GameState.inventory` のcanonical recordを生成・正規化し、意味のあるitem id単位の加算・消費・トランザクションを公開する。作物、家畜素材、加工素材、料理、魚を同じ在庫recordで扱い、種と採掘資源はそれぞれ専用のstateとして分離している。通常更新で全体をnormalizeせず、正規化はSaveSystemのload/save Seamから呼び出す。
- `ProductDemandSystem` はCatalogの料理定義を入力に、ローカル日付と店舗メニューから日替わり人気商品を決定する純粋なModuleである。来訪者の国別好みと日替わり人気を重み付けした商品選択、基準価格への販売プレミアムをここで計算する。日付と同じメニューなら日替わり商品は再計算しても安定する。
- `MarketOrderSystem` は解禁済み店舗の商品から注文を生成し、注文の正規化、常時3件の補充、在庫の原子的な消費、報酬の付与を担当する。注文には期限のfieldを持たず、納品後は即時に次の注文へ置き換える。報酬は通常販売価格の1.5倍を基準にし、コイン付与はEconomySystemの上限処理へ委譲する。
- `BuildingUpgradeSystem` は建物instanceごとの強化状態を管理する。工場は生産速度、店舗は販売速度と行列上限を対象とし、各trackはlevel 0から3までである。採掘在庫の素材が足りることを確認してから原子的に消費し、速度倍率、接客時間、行列容量を各生産・店舗Moduleへ提供する。
- 生産の共通mechanismは `LivestockProductionSystem` と `FactoryProductionSystem` が定義駆動の深いModuleとして持つ。`CowSystem`、`PigSystem`、`ChickenSystem` と3つのFactorySystemは、保存shapeと既存の公開関数を維持する薄いFacadeとして、定数・キー・product定義だけを配線する。
- 生産定義のgeneric Interfaceは、家畜ではproduction型に対応するGameState collectionとnumber型のreadyAt field、工場では既知ProductTypeに対応するstate/input/outputを型で連動させる。新しい未知ProductTypeでは共通のnumeric key unionへ退避するため、型パズルを追加せず拡張できる一方、既存6種のFacade配線ミスは `tsc`/buildで検出できる。
- 生産collectionのnormalizeは、通常更新では呼び出さず保存境界に限定する。Livestockは必須field・有限値・建物順が妥当なら、旧互換のためunknown fieldを含む既存recordと入力配列を再利用する。Factoryは保存shape（既知の3 field）がcanonicalな場合に入力配列とrecordを再利用し、shape補正や建物順の修復が必要な場合だけ新しい配列・recordを生成する。これは保存境界での不要なallocationを抑えるための挙動である。
- `ProductionRegistry` は6種類の生産の配置・撤去・保存時normalize・工場進行を一つのRegistryへ接続する。`BuildingSystem`、`SaveSystem`、`GameProgressSystem` は個別生産Systemを列挙せず、このRegistryのInterfaceを使う。工場進行の順序（wheat → milk → pork）はここで明示的に維持する。
- `src/store/gameStore.ts` はZustandのStore Adapterで、UIが使う状態と操作を公開する。時間経過の一回のtickは `GameProgressSystem` のInterfaceへ委譲し、Storeはその結果の保持と必要な保存だけを行う。建築・収穫・設定などの即時操作では、対応する各SystemをAdapterとして呼び出す。商品在庫の表示・収穫・生産・料理は `InventorySystem` を経由してcanonical inventoryを更新する。
- `src/hooks` はブラウザのタイマー・ライフサイクルをStore操作へ接続するAdapterである。
- `src/ui` と `src/scene` はStoreのInterfaceを読み、表示と入力を担当する。ただし現在はStoreだけでなく、表示名・定義・判定のために `src/game/systems`、`src/game/data`、`src/game/types`、`src/game/constants`、一部の `src/game/core` も直接importしている。Reactの描画やDOMをゲームSystemから参照する依存はない。
- `src/game/systems/SaveSystem.ts` は `StorageLike` Interfaceを介してlocalStorage Adapterへ接続し、ロード時の旧形式補正と保存時の正規化を担当する。`prepareGameStateForSave` が保存用canonical stateを一箇所で生成し、`saveGameState` はそれをストレージへ書き出して同じcanonical stateを返す。canonical inventory、market orders、building upgradesもこのSeamで正規化する。現在はテスト段階のため、従来のscalar在庫を持つ旧saveは移行せず、新しい初期GameStateへ戻す。ストレージ未提供または書き込み不可でも戻り値を返すため、Storeはゲーム内状態の進行を止めずに保持できる。
- `src/game/systems/GameProgressSystem.ts` は `GameState`、経済の端数、来訪客シミュレーション、経過時間、時刻、乱数源を受け取り、工場生産、経済、需要を利用する店舗来訪者、住民、村進行、お願いを順序どおりに進めた結果を返す。`ShopVisitorSystem` は `ProductDemandSystem` で商品と販売価格を決め、`BuildingUpgradeSystem` で店舗の接客時間と行列上限を参照する。`FactoryProductionSystem` は工場instanceの生産間隔を同じUpgrade Moduleから取得する。Zustand、ブラウザAPI、保存IOには依存しない。

現在の依存には、`src/game/core/GameState.ts` が `ResidentSystem` と `EncyclopediaSystem` をimportし、`BuildingSystem.ts` と `SaveSystem.ts` などの一部Systemが `src/game/core` をimportする、`core` と `systems` の相互結合もある。これは現状の負債であり、現在の依存規則として固定するものではない。

Storeの通常の `set` はゲーム全体のnormalize/repairを行わない。壊れた入力の修復と保存用canonicalizationは `SaveSystem` のload/save Seamに限定し、進行中の状態は各ゲームSystemが返す不変条件を信頼する。

### 現在のゲーム要素の接続

- 商品定義は `ProductCatalog` を起点に、料理のレシピと店舗メニュー、在庫item id、基準価格、国別の好みへ分岐する。料理の追加時に各店舗Facadeへ商品ごとの材料判定を複製せず、Catalogの定義を `CraftingSystem` と店舗Systemが利用する。
- 店舗来訪者は解禁済み店舗の在庫と行列容量を確認して生成される。来訪者には解禁済みの国が割り当てられ、在庫のあるメニューから需要weightで商品を選択し、販売後に `GameProgressSystem` が在庫を消費してコインを付与する。
- 注文boardは `GameState.marketOrders` と `marketOrderSequence` に保持される。`createInitialGameState` とSaveSystemの正規化で、食品店舗が解禁されている場合に3件を維持する。`fulfillMarketOrder` は不足在庫を先に検査してから全明細を消費し、報酬をEconomySystem経由で加算する。
- 建物強化は `GameState.buildingUpgrades` に建物instance idをキーとして保持され、建物撤去時に対応するrecordを削除する。保存時は現存する建物と対応するtrack・levelだけを残すため、撤去済み建物や非対応強化が進行状態へ戻らない。

### 現在のSeam

- ゲームルールとStoreのSeamは、各Systemが公開する関数と `GameState` である。SystemテストはこのInterfaceを直接呼び出す。生産の共通mechanismは共通ModuleのInterfaceを直接テストし、個別Facadeは定義配線と既存公開契約をテストする。
- 時間経過のゲームルールとStoreのSeamは `GameProgressSystem.advanceGameProgress` である。結果には次のゲーム状態、経済の端数、来訪客シミュレーション、表示通知、即時保存の推奨が含まれ、永続化の副作用は含まれない。
- StoreとUIのSeamは `GameStore` のセレクタと操作である。StoreテストはZustandのStoreを通じた観測結果を確認する。
- 保存のSeamは `StorageLike` である。テストはインメモリAdapterを渡し、ブラウザ環境に依存しない。`saveGameState` の戻り値が保存可否にかかわらずcanonical stateであることも、このInterfaceから確認する。
- UIのDOM/ブラウザAPIのSeamはjsdomプロジェクトである。UIテストはDOMから表示・操作結果を確認する。

## 目標（段階的に適用する）

1. [適用済み] Storeからゲーム進行の調整を取り出し、純粋な進行Moduleの小さなInterfaceを設ける。Storeは状態保持・永続化・UI操作のAdapterに近づける。
2. [適用済み] セーブデータの修復をロード時の専用Moduleへ集約し、通常のtickや状態更新で全体正規化を繰り返さない。保存時のcanonicalizationも `prepareGameStateForSave` に集約する。
3. [適用済み] 家畜・工場など共通する生産ルールを `LivestockProductionSystem`、`FactoryProductionSystem`、`ProductionRegistry` と生産定義へ集約する。新しい種類の追加が個別System、Store、UIへ同じ分岐を増やす形にならないようにする。
4. Interfaceを変更したときは、そのInterfaceからのテストを新しいテスト面とし、内部実装に結びついた古いテストを置き換える。Adapterを増やす必要がない箇所には新しいSeamを作らない。

目標へ進む際も、セーブ互換性、時間経過、在庫、UIの観測結果を既存テストで固定してから一段ずつ変更する。
