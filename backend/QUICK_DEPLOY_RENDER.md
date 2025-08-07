# 🚀 Quick Deploy to Render.com

## Bước 1: Chuẩn bị Repository

```bash
# 1. Initialize git (nếu chưa có)
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "Ready for Render deployment"

# 4. Push to GitHub
git remote add origin https://github.com/yourusername/vietnamese-tax-filing-api.git
git push -u origin main
```

## Bước 2: Deploy trên Render

### Option A: Sử dụng Blueprint (Recommended) 🎯

1. **Truy cập [render.com](https://render.com)**
2. **Đăng nhập/Đăng ký**
3. **Click "New +" → "Blueprint"**
4. **Connect GitHub repository**
5. **Chọn repository của bạn**
6. **Click "Connect"**

Render sẽ tự động:
- ✅ Tạo PostgreSQL database
- ✅ Tạo Redis instance  
- ✅ Deploy Web Service
- ✅ Deploy Celery Worker
- ✅ Cấu hình environment variables

### Option B: Manual Setup 🔧

1. **Tạo PostgreSQL Database:**
   - New + → PostgreSQL
   - Name: `tax-filing-db`
   - Region: Singapore

2. **Tạo Redis:**
   - New + → Redis  
   - Name: `tax-filing-redis`
   - Region: Singapore

3. **Tạo Web Service:**
   - New + → Web Service
   - Connect GitHub repo
   - Name: `tax-filing-api`
   - Build Command: `./build.sh`
   - Start Command: `python run_server.py`

4. **Tạo Worker:**
   - New + → Background Worker
   - Same repo
   - Name: `tax-filing-celery`
   - Start Command: `python run_celery.py`

## Bước 3: Cấu hình Environment Variables

Trong Web Service settings, thêm:

```bash
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=["https://tax-filing-api.onrender.com"]
GOOGLE_CLOUD_PROJECT=your-project-id
```

## Bước 4: Test Deployment

```bash
# Health check
curl https://tax-filing-api.onrender.com/health

# API docs
open https://tax-filing-api.onrender.com/api/docs

# Test registration
curl -X POST https://tax-filing-api.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

## 🎉 Done!

Your Vietnamese Tax Filing API is now live at:
- **API**: https://tax-filing-api.onrender.com
- **Docs**: https://tax-filing-api.onrender.com/api/docs
- **Health**: https://tax-filing-api.onrender.com/health

## 📊 Monitoring

- **Logs**: Render Dashboard → Service → Logs
- **Metrics**: Render Dashboard → Service → Metrics  
- **Database**: Render Dashboard → Database → Metrics

## 🔧 Troubleshooting

### Build Fails
```bash
# Check build logs in Render dashboard
# Ensure build.sh is executable
```

### Database Connection Issues
```bash
# Check DATABASE_URL in environment variables
# Should start with postgresql://
```

### Redis Connection Issues  
```bash
# Check REDIS_URL in environment variables
# Ensure Redis service is running
```

## 💰 Cost

- **Free Tier**: Web Service + PostgreSQL + Redis = $0/month
- **Paid**: $7-25/month for better performance

## 🔄 Auto-Deploy

Render automatically deploys when you push to `main` branch!

```bash
git add .
git commit -m "Update API"
git push origin main
# 🚀 Auto-deploys to Render!
```
