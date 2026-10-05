# 開發與 PR 流程

呢個係公開開源項目，maintainer：Jimmy Lau。

## 點樣參與

- 直接用工具：[線上版](https://jimmylau-dotai.github.io/dotai-collage-studio/)。
- 回報問題／提功能建議：[開 Issue](https://github.com/jimmylau-DOTAI/dotai-collage-studio/issues/new/choose)。請使用對應表單，交代操作步驟、預期同實際結果。
- 想修改程式：先 Fork 到自己 GitHub，再 clone 自己嘅 Fork、開分支、修改及測試，最後向本 repo 嘅 `main` 提交 PR。較大功能先用 Issue 討論範圍。
- 自己使用或分享修改版：依 MIT License 保留版權及授權聲明；DotAI 名稱及 Logo 不構成商標授權。

## 一個改動，一個 PR

1. 更新自己 Fork 嘅 `main`，由最新版本開一條具體功能分支；本 repo 嘅 Codex 工作沿用 `codex/<feature>`。
2. 功能／行為改動先寫可重現案例及適當測試，再實作最小改動；純文件修改核對內容及連結即可。
3. `npm ci --ignore-scripts`，然後 `npm run check`。
4. `git diff --check`，逐一檢查要加入嘅檔案。唔用 `git add .` 將未知相片或私人檔一併提交。
5. 小步 commit；開 PR 寫明目的、測試證據、限制及截圖（只用生成示範圖）。
6. Review 及 CI 通過後由 Jimmy 決定 merge。唔直接 push 功能到 `main`、唔 force-push。開 PR 本身唔會部署；合併至 `main` 會觸發已批准嘅 GitHub Pages 流程。

## 驗證準則

- 保留兩種尺寸、無拉伸裁切、四相流程及純本機處理。
- 改 export／geometry 必須測輸出尺寸、像素及無編輯線。
- jsdom 不會測 CSS 排版、真正 pointer capture、原生 file picker 或下載視窗；要另外做真人驗收。
- 新增 dependencies 要說明用途，更新 lockfile，檢查 package 授權及 audit 結果。
- 不提交真實活動相、第三方 app 截圖／UI 素材、credential、`.env`、generated HTML 或個人絕對路徑。
- `check:privacy` 係已知 pattern tripwire，不是完整 secret scanner 或法律保證；仍需 review diff。

## 發佈界線

本 repo 唔會自動發佈 npm package 或建立 Tag／Release。新增公開 asset、改 licence 或建立正式 release 前，先用 Issue／PR 說明來源及權利。見 `docs/PROVENANCE.md`。

Pages 只發布通過 `npm run check` 嘅建置；正式 Tag／Release 另按 [`docs/RELEASE.md`](docs/RELEASE.md) 驗收及取得 Jimmy 批准。
