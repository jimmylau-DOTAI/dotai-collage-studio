# 開發與 PR 流程

現階段係 private pre-release，owner：Jimmy Lau。

## 一個改動，一個 PR

1. 由最新 `main` 開 `codex/<feature>` branch。
2. 先寫可重現案例／測試，再實作最小改動。
3. `npm ci --ignore-scripts`，然後 `npm run check`。
4. `git diff --check`，逐一檢查要加入嘅檔案。唔用 `git add .` 將未知相片或私人檔一併提交。
5. 小步 commit；開 PR 寫明目的、測試證據、限制及截圖（只用生成示範圖）。
6. Review 及 CI 通過後由 owner 決定 merge。唔直接 push 功能到 `main`、唔 force-push、唔自動 deploy。

## 驗證準則

- 保留兩種尺寸、無拉伸裁切、四相流程及純本機處理。
- 改 export／geometry 必須測輸出尺寸、像素及無編輯線。
- jsdom 不會測 CSS 排版、真正 pointer capture、原生 file picker 或下載視窗；要另外做真人驗收。
- 新增 dependencies 要說明用途，更新 lockfile，檢查 package 授權及 audit 結果。
- 不提交真實活動相、第三方 app 截圖／UI 素材、credential、`.env`、generated HTML 或個人絕對路徑。
- `check:privacy` 係已知 pattern tripwire，不是完整 secret scanner 或法律保證；仍需 review diff。

## 開源 gate

未批准前保持 private；不將 repo 發佈成 npm package。改 licence、轉 public、首次 release／deploy 由 owner 明確批准。見 `docs/PROVENANCE.md`。
