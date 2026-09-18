# DotAI Collage Studio

本機運行嘅四相拼圖工具：揀排版、移相框、拉斜切分界，再下載 JPG。

**狀態：private development / pre-release。** 正準備日後開源，目前未選擇開源 licence，亦未部署公開網站。

## 開始使用

需要 Node.js **22.22.2+（22.x）、24.15.0+（24.x）或 26+**、npm 及 Git（跟 jsdom 測試依賴嘅支援範圍）。

```sh
npm ci --ignore-scripts
npm run check
```

然後用 Chrome／Safari 開啟 `dist/index.html`。建置後係一個獨立 HTML，唔需要 server，亦唔需要網絡。

1. 按「換入相片」加入 1–4 張 JPG／PNG／WebP，每張最多 40 MB。
2. 揀 29 款排版之一，設定背景色及 1:1／4:3 比例。
3. 揀操作模式：拖相片、移相框、斜切分界或自訂頂點。
4. 做錯按「復原」，完成按「下載 JPG」。

初始畫面係程式生成嘅數字示範圖，**唔包含真人活動相**。程式只在本機讀取你選擇嘅相；沒有 upload endpoint、analytics 或外部字體。

## 現有功能

- 29 款四相結構：四格、橫直排、大細相、畫中畫及共用斜切。
- 1:1：1080×1080；4:3：1440×1080。相片 cover 裁切，不拉闊原相。
- 移動相框、右下角拉大小、X／Y／寬／高數值微調。
- 拉共用斜切端點；或自訂四邊形、多邊形、圓／橢圓。
- DotAI 藍、白、淺藍、深海藍及自選底色。
- 最近 60 個狀態可復原／重做。JPEG 不含選框、控制點、標題或 Logo。

## 已知限制

- 未有專案保存／載入，刷新或關閉前要先下載；下載 JPG 不能重新載入成可編輯專案。
- 換版式會重設手動相框及形狀；改共用斜切亦會重新連結四格。兩者都可復原。
- 未提供 Facebook／Instagram 發布、API、排程或廣告功能。
- 自動測試使用 jsdom + native Canvas，**不等同 Chrome／Safari／手機實測**。跨瀏覽器、觸控及下載提示需按下方 checklist 驗收。

## 開發方式

```sh
npm run build          # 輸出 dist/index.html
npm test               # 先有 build，再執行五組測試
npm run check:privacy  # 私人路徑／憑證 pattern 及 staged 檔案檢查
npm run check          # build + test + privacy
```

```text
src/       Canvas 幾何、互動邏輯、HTML 模板
scripts/   可重現建置、測試 runner、資料檢查
tests/     幾何、互動、像素及 JPEG 輸出驗證
docs/      規格、來源、路線圖及實作計劃
dist/      生成嘅單檔工具（不入 Git）
artifacts/ 測試預覽（不入 Git）
```

測試涵蓋四款底色像素、兩種真實 JPEG 尺寸、29 款／261 種間距組合、相框移動／縮放、斜切／頂點、復原／重做、排序及編輯線排除。生成示範圖不依賴系統字體；同一 runtime 上建置會比對一致性。

## Git / PR

`main` 放已 review 嘅版本。每個改動用 `codex/<feature>` branch，完成測試後開 PR；CI 通過唔代表自動 merge。細節見 [CONTRIBUTING.md](CONTRIBUTING.md)。

下一步：[路線圖及真人驗收](docs/ROADMAP.md) · [來源與開源前檢查](docs/PROVENANCE.md) · [安全回報](SECURITY.md)

## Licence

目前 `UNLICENSED`，未授予開源再分發權。轉 public 前由 owner 選定 licence；DotAI 商標、品牌素材及使用者照片唔會自動隨程式碼授權。
