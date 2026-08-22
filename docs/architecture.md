# Architecture

この文書は、現在のコードを読むための地図と、今後の整理で目指す方向を分けて記録する。新しい構造を既成事実として扱わない。

## 現在のModuleと依存方向

以下は理想の層ではなく、現在のimport依存を簡略化した図である。矢印の向きには、整理対象の結合も含まれる。

```text
React UI / scene / hooks
          ├──► gameStore（Zustand Adapter） ──► game/core
          │                                  └─► game/systems
          └──► game/systems / data / types / constants

gameStore ──► SaveSystem ──► StorageLike ──► browser localStorage

game/core ──► game/systems / data / types
game/systems ──► game/core / data / types / constants
```

- `src/game/types` は村、建物、住民、生産物などの型を定義する。
- `src/game/data` と `src/game/constants` は建物・魚・図鑑・レベルなどの定義とルール値を持つ。
- `src/game/core` は初期 `GameState` の生成と建物コレクションの整合性を担当する。
- `src/game/systems` は建築、作物、生産、住民、経済、釣り、保存などのゲームルールをModuleとして公開する。多くは `GameState` と入力を受け、更新後の状態または結果を返す。
- `src/store/gameStore.ts` はZustandのStore Adapterで、UIが使う状態と操作を公開し、`src/game/core` と多数の `src/game/systems` を一回の操作やtickへ束ねる。
- `src/hooks` はブラウザのタイマー・ライフサイクルをStore操作へ接続するAdapterである。
- `src/ui` と `src/scene` はStoreのInterfaceを読み、表示と入力を担当する。ただし現在はStoreだけでなく、表示名・定義・判定のために `src/game/systems`、`src/game/data`、`src/game/types`、`src/game/constants`、一部の `src/game/core` も直接importしている。Reactの描画やDOMをゲームSystemから参照する依存はない。
- `src/game/systems/SaveSystem.ts` は `StorageLike` Interfaceを介してlocalStorage Adapterへ接続し、ロード時の旧形式補正と保存時の正規化を担当する。

現在の依存には、`src/game/core/GameState.ts` が `ResidentSystem` と `EncyclopediaSystem` をimportし、`BuildingSystem.ts` と `SaveSystem.ts` などの一部Systemが `src/game/core` をimportする、`core` と `systems` の相互結合もある。これは現状の負債であり、現在の依存規則として固定するものではない。

また、Storeの通常の `set` は `game` を含む更新ごとに `normalizeGameState` を呼ぶ。ロード・保存の修復だけでなく通常更新でも正規化が走ることが、目標#2で進行処理と保存データ修復を分離する理由である。

### 現在のSeam

- ゲームルールとStoreのSeamは、各Systemが公開する関数と `GameState` である。SystemテストはこのInterfaceを直接呼び出す。
- StoreとUIのSeamは `GameStore` のセレクタと操作である。StoreテストはZustandのStoreを通じた観測結果を確認する。
- 保存のSeamは `StorageLike` である。テストはインメモリAdapterを渡し、ブラウザ環境に依存しない。
- UIのDOM/ブラウザAPIのSeamはjsdomプロジェクトである。UIテストはDOMから表示・操作結果を確認する。

## 目標（段階的に適用する）

1. Storeからゲーム進行の調整を取り出し、純粋な進行Moduleの小さなInterfaceを設ける。Storeは状態保持・永続化・UI操作のAdapterに近づける。
2. セーブデータの修復をロード時の専用Moduleへ集約し、通常のtickや状態更新で全体正規化を繰り返さない。
3. 家畜・工場など共通する生産ルールを生産定義と深いModuleへ集約する。新しい種類の追加が個別System、Store、UIへ同じ分岐を増やす形にならないようにする。
4. Interfaceを変更したときは、そのInterfaceからのテストを新しいテスト面とし、内部実装に結びついた古いテストを置き換える。Adapterを増やす必要がない箇所には新しいSeamを作らない。

目標へ進む際も、セーブ互換性、時間経過、在庫、UIの観測結果を既存テストで固定してから一段ずつ変更する。
