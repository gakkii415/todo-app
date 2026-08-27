# Todo

今日やることを、迷わず追加して完了できるシンプルなTodoアプリです。Expo / React Nativeで動作します。

## できること

- Todoの追加、完了・未完了の切り替え
- タスク名をタップして編集
- 「すべて」「未完了」「完了」で絞り込み
- 削除前の確認
- Todoを端末内へ自動保存
- 残件数と完了状況の表示
- ライトモード・ダークモード対応

期限、通知、優先度、複数リスト、アカウント同期はあえて追加していません。毎日の短いリストを素早く扱うことを優先しています。

## 使い方

1. 入力欄にやることを入力し、「追加」を押します。
2. 終わったら左側の丸を押します。
3. タスク名を変更するときは、名前をタップします。
4. 表示を切り替えるときは、「すべて」「未完了」「完了」を選びます。

## ローカルで確認する

Node.jsを用意し、次のコマンドを実行します。

```bash
npm install
npm start
```

Expoの案内に従って、iPhone SimulatorまたはAndroid Emulatorで開いてください。

## 設計で参考にしたサービス

- [Todoist Quick Add](https://www.todoist.com/help/articles/use-keyboard-shortcuts-in-todoist-Wyovn2)：入力から追加までを短くする考え方
- [Microsoft To Do - My Day](https://support.microsoft.com/en-us/todo/plan-and-connect-with-microsoft-to-do)：今日やることへ集中させる構成
- [Apple Reminders](https://support.apple.com/guide/iphone/complete-reminders-iph3fb74d597/ios)：丸を使った完了操作と、完了済みの表示切り替え

大規模なプロジェクト管理機能は参考にせず、現在の最小構成に合う操作だけを採用しました。
