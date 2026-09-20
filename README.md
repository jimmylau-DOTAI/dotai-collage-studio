# DotAI Collage Studio

本機運行嘅 1–9 相拼圖工具：一次揀相、自動配合張數排版、框內裁切，再下載 JPG。

**狀態：private development / pre-release。** 正準備日後開源，目前未選擇開源 licence，亦未部署公開網站。

## 開始使用

需要 Node.js **22.22.2+（22.x）、24.15.0+（24.x）或 26+**、npm 及 Git（跟 jsdom 測試依賴嘅支援範圍）。

```sh
npm ci --ignore-scripts
npm run check
```

然後用 Chrome／Safari 開啟 `dist/index.html`。建置後係一個獨立 HTML，唔需要 server，亦唔需要網絡。

1. 按「一次加入全部相片」選 1–9 張 JPG／PNG／WebP，每張最多 40 MB，整組最多 120 MB。重新選取會替換整組，可復原。
2. 揀適合目前張數嘅排版，設定背景色及 1:1／4:5 比例；四張時保留 29 款排版。
3. 雙擊縮圖或畫布相片可換單張；放大後拖圖片揀人物位置，相框預設鎖定。要移框／改大小／四格斜切，先勾選「調整相框（進階）」。
4. 做錯按「復原」，完成按「下載 JPG」。

初始畫面係程式生成嘅數字示範圖，**唔包含真人活動相**。程式只在本機讀取你選擇嘅相；沒有 upload endpoint、analytics 或外部字體。

## 現有功能

- 1–9 張自動排版；單張全圖、平均分格、橫直排、主相配小相；四張保留 29 款結構。
- 1:1：1080×1080；4:5：1080×1350。框內放大裁切，不拉闊原相，拖圖片不會改相框大小。
- 進階移框／改大小、四格共用斜切；「還原排版相框」可修復自由移框造成的重疊。
- 白色預設，另有亮藍、淺藍、深海藍及自選底色；最多保存八隻命名底色，可改名及移除。
- 深海藍工具介面與官方方形標誌；作品可自行加入正方形或全名標誌，放左上／中上／中下。
- 最近 60 個狀態可復原／重做，整組換相只需一步復原。JPEG 不含編輯選框及控制點，會包含自行加入的作品標誌。

## 已知限制

- 未有專案保存／載入，刷新或關閉前要先下載；下載 JPG 不能重新載入成可編輯專案。
- 換版式會重設手動相框；重新加入整組相片會重設相片構圖，保留底色、畫布比例及標誌。兩者都可復原。
- 超過九張不會靜默刪走相片，會提示重新選取；任何一張失敗則整組不變。新一輪換相會取代仍在載入的舊選擇。
- 未提供 Facebook／Instagram 發布、API、排程或廣告功能。
- 自動測試使用 jsdom + native Canvas，**不等同 Chrome／Safari／手機實測**。跨瀏覽器、觸控及下載提示需按下方 checklist 驗收。

## 開發方式

```sh
npm run build          # 輸出 dist/index.html
npm test               # 先有 build，再執行所有測試
npm run check:privacy  # 私人路徑／憑證 pattern 及 staged 檔案檢查
npm run check          # build + test + privacy
```

```text
src/       Canvas 幾何、互動邏輯、HTML 模板及介面 CSS
assets/    限定官方標誌及來源記錄（與日後程式碼授權分開）
scripts/   可重現建置、測試 runner、資料檢查
tests/     幾何、互動、像素及 JPEG 輸出驗證
docs/      規格、來源、路線圖及實作計劃
dist/      生成嘅單檔工具（不入 Git）
artifacts/ 測試預覽（不入 Git）
```

測試涵蓋真實圖片讀取與縮圖、1–9 張排版／多張上載競態、框內移圖像素、兩種 JPEG 尺寸、Logo、色板、進階移框、復原／重做及編輯線排除。生成示範圖不依賴系統字體；同一 runtime 上建置會比對一致性。

## Git / PR

`main` 放已 review 嘅版本。每個改動用 `codex/<feature>` branch，完成測試後開 PR；CI 通過唔代表自動 merge。細節見 [CONTRIBUTING.md](CONTRIBUTING.md)。

下一步：[路線圖及真人驗收](docs/ROADMAP.md) · [來源與開源前檢查](docs/PROVENANCE.md) · [安全回報](SECURITY.md)

## Licence

目前 `UNLICENSED`，未授予開源再分發權。轉 public 前由 owner 選定 licence；DotAI 商標、品牌素材及使用者照片唔會自動隨程式碼授權。
