# 版本發布流程

Maintainer：Jimmy Lau。呢份係發布程序及首版 Release 文案草稿，唔表示已建立 Tag／Release。

## Pages 同正式版本

- 合併已審閱 PR 至 `main`：GitHub Pages 會跑完整 `npm run check`，成功先部署。
- Tag／GitHub Release：由 Jimmy 另行批准，記低一個可追溯版本；唔由 CI 自動建立。
- 下一個版本號候選為 `v0.1.0`，對應現時 `package.json`；發布前再核對 GitHub 是否已有同名 Tag。

## 發布前

1. 確認指定 commit 嘅 PR 已審閱及合併；Node 22、24 CI 通過，Pages 部署通過。
2. 按 `docs/ACCEPTANCE.md` 做適用 Chrome／Safari／mobile 人手驗收，將實際裝置、結果及未完成項記返 `docs/STATUS.md`。自動測試唔代替觸控、選檔及下載驗收。
3. 核對本版改動、已知限制、MIT 授權同品牌資產界線；向 Jimmy 展示確切 commit、版本號及 Release 文案。
4. Jimmy 批准後，先為指定 commit 建 Tag，再建立 GitHub Release。避免用日後可能已改變嘅 `main` 代替已批准 commit。
5. 讀回 Tag 對應 commit、Release URL 同公開文案。只有實際建置及驗證過嘅檔案先作附件；GitHub 自動提供嘅 source ZIP 並唔係已建置嘅獨立 HTML。

## 首版 Release 文案草稿

**DotAI Postframe v0.1.0｜拼圖工具**

將活動相片排成可以出 IG／Facebook 嘅 JPG。

- 加入 1–9 張相片；支援 1:1 同 4:5。
- 調整相片大小、位置、交換相片、相框比例及斜切。
- 加入自己嘅 Logo；支援復原／重做。
- 相片喺本機瀏覽器處理，無帳戶或相片上傳。

使用：[線上工具](https://jimmylau-dotai.github.io/dotai-collage-studio/)。
參與：[回報問題／功能建議](https://github.com/jimmylau-DOTAI/dotai-collage-studio/issues/new/choose)，或按 `CONTRIBUTING.md` Fork 及提交 PR。

已知限制：未支援儲存完整可編輯作品；刷新／關閉前請先下載 JPG。儲存品牌設定唔會儲存活動相片。極大圖片可能超出低記憶體裝置能力。

驗證結果：發布時填入確切 commit、CI 及實際人手驗收結果，唔沿用舊記錄當本版已驗收。

程式碼採用 MIT License；DotAI 名稱及 Logo 不構成商標授權。
