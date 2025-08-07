# ✅ Valkey Creation Checklist

## 🎯 **Bước tạo Valkey trên Render**

### ☐ **Bước 1: Truy cập Render**
- [ ] Mở [render.com](https://render.com)
- [ ] Đăng nhập vào tài khoản
- [ ] Xác nhận đã thấy PostgreSQL database: `tax-filing-db`

### ☐ **Bước 2: Tạo Valkey Service**
- [ ] Click **"New +"** (góc trên phải)
- [ ] Chọn **"Redis"** từ menu

### ☐ **Bước 3: Cấu hình**
```
Name: tax-filing-valkey
Region: Oregon
Plan: Starter (Free)
Maxmemory Policy: allkeys-lru
```

- [ ] Name: `tax-filing-valkey`
- [ ] Region: `Oregon` (cùng PostgreSQL)
- [ ] Plan: `Starter` (Free - 25MB)
- [ ] Maxmemory Policy: `allkeys-lru`

### ☐ **Bước 4: Tạo Service**
- [ ] Click **"Create Redis"**
- [ ] Đợi 2-3 phút để service khởi tạo
- [ ] Status hiển thị **"Available"**

### ☐ **Bước 5: Lấy Connection URL**
- [ ] Click vào service `tax-filing-valkey`
- [ ] Click tab **"Connect"** hoặc **"Info"**
- [ ] Copy **Internal Redis URL**: `redis://red-xxxxx:6379`

### ☐ **Bước 6: Cập nhật Environment**
- [ ] Copy file `env.template` thành `.env`
- [ ] Thay thế `redis://red-xxxxx:6379` bằng URL thực tế
- [ ] Cập nhật cả 3 variables:
  - `REDIS_URL`
  - `CELERY_BROKER_URL` 
  - `CELERY_RESULT_BACKEND`

## 🧪 **Test Connection**

### ☐ **Bước 7: Install Dependencies**
```bash
pip install -r requirements.txt
```

### ☐ **Bước 8: Test Database Connections**
```bash
python test_db_connection.py
```

**Expected Output:**
```
🔗 Testing Valkey connection...
✅ Valkey connected successfully!
Test data: Hello from Vietnamese Tax Filing API with Valkey!
🎉 Valkey connection test completed successfully!
```

## 📊 **Verification**

### ☐ **Bước 9: Verify Services**

**PostgreSQL:**
- [ ] Database: `tax-filing-db`
- [ ] Status: Available
- [ ] Region: Oregon
- [ ] Connection: Working

**Valkey:**
- [ ] Service: `tax-filing-valkey`
- [ ] Status: Available  
- [ ] Region: Oregon
- [ ] Connection: Working

### ☐ **Bước 10: Environment Variables**
```bash
# Verify these are set correctly:
DATABASE_URL=postgresql+asyncpg://tax_user:...@dpg-...oregon-postgres.render.com/tax_filing_db
REDIS_URL=redis://red-xxxxx:6379
CELERY_BROKER_URL=redis://red-xxxxx:6379
CELERY_RESULT_BACKEND=redis://red-xxxxx:6379
```

## 🚀 **Next Steps**

### ☐ **Bước 11: Deploy API**
- [ ] Push code to GitHub
- [ ] Deploy Web Service trên Render
- [ ] Deploy Celery Worker
- [ ] Test API endpoints

### ☐ **Bước 12: Monitoring**
- [ ] Check Valkey metrics trong Render dashboard
- [ ] Monitor memory usage
- [ ] Set up alerts (optional)

## 🔧 **Troubleshooting**

### ❌ **Nếu Valkey connection fails:**

1. **Check URL format:**
   ```bash
   # Correct format
   redis://red-xxxxx:6379
   
   # NOT rediss:// (SSL)
   # NOT with /0 at the end
   ```

2. **Check region:**
   - PostgreSQL: Oregon
   - Valkey: Oregon (same region)

3. **Check service status:**
   - Both services should show "Available"

4. **Check environment variables:**
   - All 3 Redis URLs should be identical
   - No typos in variable names

### ❌ **Nếu test script fails:**

```bash
# Install missing dependencies
pip install valkey redis

# Check Python path
python -c "import sys; print(sys.path)"

# Run with verbose output
python -v test_db_connection.py
```

## 💰 **Cost Summary**

- **PostgreSQL**: Free (1GB storage)
- **Valkey**: Free (25MB storage)  
- **Total**: $0/month

**Upgrade options:**
- PostgreSQL Starter: $7/month (10GB)
- Valkey Standard: $3/month (100MB)

## 🎉 **Success Criteria**

✅ **You're ready when:**
- [ ] Both PostgreSQL and Valkey show "Available"
- [ ] Test script passes for both databases
- [ ] Environment variables are correctly set
- [ ] No connection errors in logs

**Vietnamese Tax Filing API is ready for deployment!** 🚀
