# 部署指南

## Vercel 部署設定

### 1. 環境變數設定

在 Vercel 專案設定中，必須添加以下環境變數：

```
VITE_FIREBASE_API_KEY=你的_api_key
VITE_FIREBASE_AUTH_DOMAIN=你的_auth_domain
VITE_FIREBASE_PROJECT_ID=你的_project_id
VITE_FIREBASE_STORAGE_BUCKET=你的_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=你的_messaging_sender_id
VITE_FIREBASE_APP_ID=你的_app_id
```

### 2. 設定步驟

1. 進入 Vercel 專案設定
2. 點擊「Environment Variables」
3. 逐一添加上述環境變數
4. 確保選擇正確的環境（Production、Preview、Development）
5. 重新部署專案

### 3. 檢查清單

- [ ] 所有 Firebase 環境變數都已設定
- [ ] 環境變數名稱正確（以 `VITE_` 開頭）
- [ ] 已重新部署專案
- [ ] 檢查瀏覽器 Console 是否有錯誤訊息

### 4. 常見問題

#### 空白畫面
- **原因**：Firebase 環境變數未設定或設定錯誤
- **解決**：檢查 Vercel 環境變數設定，確保所有變數都已添加

#### Firebase 初始化錯誤
- **原因**：環境變數值錯誤或缺失
- **解決**：檢查 Firebase Console 中的配置值是否正確

#### 建置失敗
- **原因**：依賴安裝問題
- **解決**：檢查 Vercel 建置日誌，確認 `npm install` 成功

### 5. 驗證部署

部署成功後，檢查：
1. 網站可以正常載入
2. 可以發送留言
3. 管理員可以登入
4. 瀏覽器 Console 沒有錯誤

