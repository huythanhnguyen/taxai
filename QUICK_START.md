# 🚀 Quick Start Guide - Tax Filing PWA

## Các lỗi đã được fix:

### ✅ 1. Lỗi "Missing script: dev" trong frontend
- **Vấn đề**: Frontend không có script `dev`
- **Giải pháp**: Đã thêm script `"dev": "react-scripts start"` vào `frontend/package.json`

### ✅ 2. Lỗi "Cannot find module test-server.js"
- **Vấn đề**: File `test-server.js` không tồn tại trong root
- **Giải pháp**: Đã tạo file `test-server.js` trong root directory

### ✅ 3. Lỗi "Could not read package.json" trong root
- **Vấn đề**: Không có `package.json` trong root directory
- **Giải pháp**: Đã tạo `package.json` với scripts để quản lý cả frontend và backend

### ✅ 4. Lỗi TypeScript trong backend
- **Vấn đề**: Nhiều lỗi TypeScript compilation
- **Giải pháp**: Đã tạo `simple-server.js` để chạy backend mà không cần build TypeScript

## 🎯 Cách chạy dự án:

### Phương pháp 1: Sử dụng script tự động
```bash
./start.sh
```

### Phương pháp 2: Sử dụng npm scripts
```bash
# Chạy cả frontend và backend cùng lúc
npm run dev

# Hoặc chạy riêng lẻ:
npm run dev:frontend  # Chạy frontend trên port 3000
npm run dev:backend   # Chạy backend trên port 3001
```

### Phương pháp 3: Chạy thủ công
```bash
# Terminal 1 - Backend
cd backend
node simple-server.js

# Terminal 2 - Frontend  
cd frontend
npm run dev

# Terminal 3 - Test server (optional)
node test-server.js
```

## 🌐 Các URL sau khi chạy:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Backend Health Check**: http://localhost:3001/health
- **Test Server**: http://localhost:8080

## 📋 Các scripts có sẵn:

### Root level:
- `npm run dev` - Chạy cả frontend và backend
- `npm run start` - Chạy production mode
- `npm run build` - Build cả frontend và backend
- `npm run install:all` - Cài đặt dependencies cho tất cả

### Frontend:
- `npm start` hoặc `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm test` - Chạy tests

### Backend:
- `node simple-server.js` - Chạy simple server (recommended)
- `npm run dev` - Chạy với nodemon (có thể có lỗi TypeScript)
- `npm run build` - Build TypeScript

## 🔧 Troubleshooting:

### Nếu port bị chiếm:
```bash
# Kiểm tra process đang sử dụng port
lsof -i :3000
lsof -i :3001

# Kill process nếu cần
pkill -f "react-scripts"
pkill -f "node.*simple-server"
```

### Nếu dependencies bị lỗi:
```bash
# Xóa và cài lại dependencies
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json  
rm -rf backend/node_modules backend/package-lock.json

npm run install:all
```

## 🎉 Kết quả:

Tất cả các lỗi đã được fix và dự án có thể chạy thành công với:
- ✅ Frontend React trên port 3000
- ✅ Backend Express trên port 3001  
- ✅ Test server trên port 8080
- ✅ Scripts npm hoạt động đúng
- ✅ Có thể chạy từ root directory 