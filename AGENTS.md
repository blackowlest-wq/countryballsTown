# Countryball Town agent guide

このリポジトリでは、変更の影響範囲を小さく保ち、既存のゲーム挙動を観測可能なテストで守る。

- ゲームルールの変更は `src/game` の Module として実装し、UIやStoreに同じルールを重複させない。
- 既存の Module の Interface と依存方向を確認してから、新しい分岐・状態・保存項目を追加する。
- テストは責務に応じた `tests/domain`、`tests/store`、`tests/ui` のプロジェクトへ置き、変更に対応する最小のsuiteを反復する。
- 新しい `*.test.ts` は3つのテスト分類配下へ置き、配置確認の `npm run test:layout` を通す。
- 実装の詳細ではなく、ModuleのInterfaceから観測できる結果をテストする。

## Context pointers

- ゲームのModule、Interface、Seam、Adapterの配置を変更するときは [`docs/architecture.md`](docs/architecture.md) を読む。
- テストを追加・移動・実行するときは [`docs/testing.md`](docs/testing.md) を読む。
- セーブ互換性や状態の正規化を変更するときは、上記architectureの保存Seam節と既存の `SaveSystem` テストを確認する。

## Code Review Rules

- 変更の責務に対応するテストプロジェクトが追加・更新されているか確認する。
- 既存のInterfaceを迂回して、同じゲームルールをUIやStoreへ複製していないか確認する。
- 新しい保存データや移行処理がある場合、旧データと壊れた入力を含む `SaveSystem` の観測可能な結果を確認する。
- テスト範囲を広げる変更では、依存を広げる理由と `test:related` の結果をレビュー報告またはPR説明で確認する。
- 文書は現状と目標を分け、まだ存在しない構造を現在の規則として扱わない。
