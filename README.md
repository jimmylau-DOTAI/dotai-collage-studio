# DotAI Postframe｜拼圖工具

**將幾張活動相，拼成一張可以直接出 IG／Facebook 嘅圖。**

每次活動完，最煩唔係冇相，而係要逐張揀、裁人物、再喺 Canva 慢慢砌版。

所以我整咗 DotAI Postframe：揀相、揀排版、將人物拉返去靚嘅位置，然後下載 JPG。全部喺你自己部電腦完成，唔需要上傳相片，亦唔需要開新帳戶。

> Turn event photos into posts worth sharing.

## 線上試用

GitHub Pages 啟用後，可由以下網址開啟：

`https://jimmylau-dotai.github.io/dotai-collage-studio/`

每次合併至 `main` 後，網站會自動更新。相片只在你的瀏覽器本機處理，不會上傳至此網站。

## 你可以點用

1. 加入 1–9 張相片。
2. 揀 1:1 正方形或 4:5 IG 直向，再揀一個排版。
3. 點入任何一張相，放大、縮細同移動人物位置。
4. 需要時加品牌標誌，最後下載 JPG。

做錯可以按 Command Z／Ctrl Z 復原。想將兩張相換位、調相框比例或者做斜切，都有獨立按鈕，唔需要記手勢。

## 呢個工具適合邊個？

- 辦完活動、想快啲整理活動相出 post 嘅人。
- 想自己決定邊張相做主相、人物放喺邊嘅品牌／社交媒體團隊。
- 想用簡單工具做圖，而唔想先學一大堆設計軟件嘅人。

## 我點解整？

我係 [Jimmy Lau](https://github.com/jimmylau-DOTAI)，DotAI Founder／CMO。

我相信 AI 唔應該只係幫人「出一個答案」。更有用嘅做法係將一件真實、重複、又成日卡住人嘅工作，做成一個大家真係願意用嘅工具。

呢個拼圖工具就係一個小例子：由「活動完咗有一堆相」去到「我而家有一張可以出 post 嘅圖」，中間少啲來回、少啲估。

如果你試咗覺得有用，或者有一個你真係想加嘅排版／功能，歡迎開 Issue（PS：喺 GitHub 留低問題或建議）同我講。想一齊改善亦可以開 Pull Request（PS：提交你改好咗嘅程式碼畀我 review）。

## 快速開始

需要 Node.js 22.22.2+、npm 同 Git（PS：用嚟下載同管理程式碼嘅工具）。

```sh
git clone https://github.com/jimmylau-DOTAI/dotai-collage-studio.git
cd dotai-collage-studio
npm ci --ignore-scripts
npm run build
```

之後用 Chrome 或 Safari 開啟 `dist/index.html` 就可以用。呢個係獨立 HTML，唔需要 server，亦唔需要網絡。

## 現在做到嘅事

- 1–9 張相片自動配合排版。
- 正方形 1080 × 1080，同 IG 直向 1080 × 1350。
- 框內放大、縮細、移動相片，唔會拉闊變形。
- 交換相片、調相框、斜切、復原／重做。
- 加入多個正方形或長形品牌標誌，調大小、位置、底板同色帶。
- 所有相片只會喺本機瀏覽器處理；無後端、無上傳、無追蹤。

## 開源與限制

程式碼採用 [MIT License](LICENSE)（PS：其他人可合法使用、修改同分享程式碼）。DotAI 名稱及標誌不構成商標授權；你加入嘅相片與標誌，權利仍然屬於原有權利人。

目前未有「儲存可編輯作品」功能，所以刷新或關閉前請先下載 JPG。「儲存我的品牌」只會記住標誌與底色，唔會記住活動相片。

詳細功能、已知限制同 QA（PS：品質檢查）紀錄：

- [Release QA](docs/RELEASE-QA.md)
- [人工驗收清單](docs/ACCEPTANCE.md)
- [開發及貢獻方式](CONTRIBUTING.md)
- [產品路線圖](docs/ROADMAP.md)
