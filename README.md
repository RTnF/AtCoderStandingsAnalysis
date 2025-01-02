# AtCoderStandingsAnalysis

**念のため、コンテスト中にこのツールから得た情報はSNSに投稿しないでください。**  
順位表のjsonを集計し、上部にテーブルを追加します。  
使用は自己責任でお願いいたします。  
不具合やご要望は[issue](https://github.com/RTnF/AtCoderStandingsAnalysis/issues)か[twitter](https://twitter.com/RTnF_cp)にお願いいたします。  

## 項目

- 得点：自分の得点
- 人数：正解者数 / 提出者数
- 正解率：正解者数 ÷ 提出者数
- 平均ペナ：全提出者について何回間違えたかの平均（未ACを含む）
- ペナ率：1回以上間違えた人数 ÷ 提出者数（未ACを含む）
- レート：**内部レート**の分布（レーティングから灰色のpositivizeと参加回数補正を除いたもの。[ここ](https://qiita.com/anqooqie/items/92005e337a0d2569bdbd)のレート（第二段階）に相当）

## 更新履歴

### v0

#### v0.2.0

- (機能維持)
- [プロジェクトの再構築](https://zenn.dev/mkpoli/articles/10116a047cad1f)
- TypeScriptへの移行
- eslint, prettier, vite, tsconfig 初期設定
- 脱JQuery

### (old) v0

#### v0.1.3

- ac-predictorとの干渉を解消(thead > trを消去)
- 内部レートを固定幅に

#### v0.1.2

- 表の更新トリガーをsetIntervalからvm.$watchに変更
- 表のpaddingを狭く(8 -> 4 px)

#### v0.1.1

- 内部レートでNaNが発生していたのを修正

#### v0.1.0

- 順位表にフィルターをかけたとき、上の表も対応

#### v0.0.0

- 仮
