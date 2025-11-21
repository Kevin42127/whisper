# Whisper

一個純前端的匿名發言平台，使用 React + Vite 開發，資料持久化透過 Firebase Firestore 實現。

**Whisper** - 匿名發言，自由表達

## 功能特色

- 匿名發文功能
- 即時顯示發文列表
- 響應式設計
- 平滑過渡動畫效果

## 技術棧

- React 18
- Vite
- Firebase Firestore（資料持久化）
- Firebase Authentication（管理員身份驗證）
- Google Material Icons

## 安裝與設定

1. 安裝依賴：
```bash
npm install
```

2. 設定 Firebase：
   - 在 Firebase Console 建立新專案
   - 啟用 Firestore Database
   - 啟用 Authentication（電子郵件/密碼登入）
   - 建立管理員帳號（見下方說明）
   - 複製 `.env.example` 為 `.env`
   - 填入你的 Firebase 配置資訊

3. 啟動開發伺服器：
```bash
npm run dev
```

## 部署到 Vercel

1. 將專案推送到 GitHub
2. 在 Vercel 匯入專案
3. 在 Vercel 環境變數設定中新增 Firebase 配置
4. 部署完成

## Firebase 設定

### 1. 啟用 Authentication

1. 在 Firebase Console 中，進入「Authentication」
2. 點擊「開始使用」
3. 在「登入方法」頁籤中，啟用「電子郵件/密碼」
4. 點擊「電子郵件/密碼」> 啟用 > 儲存

### 2. 建立管理員帳號

1. 在「Authentication」>「使用者」頁籤
2. 點擊「新增使用者」
3. 輸入管理員的電子郵件和密碼
4. 點擊「新增使用者」

### 3. Firestore 安全規則

建議設定以下 Firestore 安全規則（允許已認證的管理員刪除）：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(['content', 'createdAt']);
      allow delete: if request.auth != null;
      allow update: if false;
    }
  }
}
```

**注意**：上述規則允許任何已登入的使用者刪除發文。如果需要更嚴格的控制，可以：
- 檢查使用者的 email 是否為管理員 email
- 使用 Firebase Custom Claims 來標記管理員

