# Countryball Town agent guide

このリポジトリでは、変更の影響範囲を小さく保ち、既存のゲーム挙動を観測可能なテストで守る。

- ゲームルールの変更は `src/game` の Module として実装し、UIやStoreに同じルールを重複させない。
- 時間経過のゲームルールは `src/game/systems/GameProgressSystem.ts` の Interfaceへ集約し、Storeの `tick` に個別Systemの進行順序を再実装しない。
- 既存の Module の Interface と依存方向を確認してから、新しい分岐・状態・保存項目を追加する。
- テストは責務に応じた `tests/domain`、`tests/store`、`tests/ui` のプロジェクトへ置き、変更に対応する最小のsuiteを反復する。
- 通常の実装とスマホ確認用pushでは、変更責務の直接テストまたは `test:related` を実行する。全suiteはユーザーの明示指示を実行条件とし、push回数からは判断しない。
- 新しい `*.test.ts` は3つのテスト分類配下へ置き、配置確認の `npm run test:layout` を通す。
- 実装の詳細ではなく、ModuleのInterfaceから観測できる結果をテストする。
- 通常のStore更新でゲーム全体をnormalize/repairせず、修復と保存用canonicalizationは `SaveSystem` のload/save Seamへ限定する。
- 新しい家畜・工場などの生産種を追加する前に、既存の定義・共通Production Module・`ProductionRegistry` のInterfaceを確認し、個別Facadeへmechanismを複製しない。

## Context pointers

- ゲームのModule、Interface、Seam、Adapterの配置を変更するときは [`docs/architecture.md`](docs/architecture.md) を読む。
- テストを追加・移動・実行するときは [`docs/testing.md`](docs/testing.md) を読む。
- セーブ互換性や状態の正規化を変更するときは、上記architectureの保存Seam節と既存の `SaveSystem` テストを確認する。

## Code Review Rules

- 変更の責務に対応するテストプロジェクトが追加・更新されているか確認する。
- 既存のInterfaceを迂回して、同じゲームルールをUIやStoreへ複製していないか確認する。
- `GameProgressSystem` の時間・乱数注入と結果（進行状態、通知、即時保存シグナル）がInterfaceから決定論的にテストされ、Storeに進行順序が戻っていないか確認する。
- 新しい保存データや移行処理がある場合、旧データと壊れた入力を含む `SaveSystem` の観測可能な結果を確認する。
- 保存用canonicalizationの実装が `SaveSystem` とStoreや他のSystemに重複していないか確認する。
- 新しい生産種が共通Moduleの定義とRegistry経由でライフサイクルへ接続され、definitionのキー・定数・product配線を検出するFacadeテストがあるか確認する。共通mechanismのテストを個別Facadeへ単純に重ねない。
- 生産定義のgeneric key制約を迂回するFacade側の型castや、production型と異なるstate/readyAt/input/output keyを許す拡張を追加していないか確認する。
- テスト範囲を広げる変更では、依存を広げる理由と `test:related` の結果をレビュー報告またはPR説明で確認する。
- 文書は現状と目標を分け、まだ存在しない構造を現在の規則として扱わない。
