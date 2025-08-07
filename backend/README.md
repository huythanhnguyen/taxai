# Vietnamese Tax Filing PWA - Python Backend

Hệ thống backend Python cho ứng dụng kê khai thuế Việt Nam với tích hợp AI đa phương thức sử dụng Google ADK.

## Tính năng chính

- **FastAPI Framework**: API hiện đại, nhanh chóng với automatic documentation
- **SQLAlchemy ORM**: Quản lý database async với PostgreSQL
- **Google ADK Integration**: Tích hợp AI đa phương thức (giọng nói, tài liệu, hình ảnh)
- **Vietnamese Tax Support**: Hỗ trợ đầy đủ các loại tờ khai thuế Việt Nam
- **HTKK Compatibility**: Tương thích với hệ thống HTKK v5.3.9
- **Background Processing**: Xử lý AI bất đồng bộ với Celery
- **Security**: JWT authentication, role-based access control
- **Monitoring**: Comprehensive logging và performance tracking

## Yêu cầu hệ thống

- Python 3.11+
- PostgreSQL 14+
- Redis 6+
- Nginx (production)
- Supervisor (process management)

## Cài đặt nhanh

### 1. Chạy script cài đặt tự động
```bash
chmod +x install.sh
./install.sh
```

### 2. Cấu hình environment
```bash
# Copy template và chỉnh sửa
sudo -u taxapp cp /home/taxapp/tax-filing-app/.env.template /home/taxapp/tax-filing-app/.env
sudo -u taxapp nano /home/taxapp/tax-filing-app/.env
```

### 3. Khởi tạo database
```bash
cd /home/taxapp/tax-filing-app
sudo -u taxapp ./venv/bin/python -c "import asyncio; from app.core.database import init_db; asyncio.run(init_db())"
```

### 4. Chạy ứng dụng
```bash
# Development mode
sudo -u taxapp ./venv/bin/python run_server.py

# Production mode với Supervisor
sudo supervisorctl start tax-filing-api
sudo supervisorctl start tax-filing-celery
```

## Cấu trúc dự án

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application
│   ├── core/                   # Core modules
│   │   ├── config.py          # Configuration
│   │   ├── database.py        # Database setup
│   │   └── security.py        # Authentication
│   ├── models/                # SQLAlchemy models
│   │   ├── user.py
│   │   ├── taxpayer.py
│   │   ├── tax_declaration.py
│   │   └── ai_processing.py
│   ├── schemas/               # Pydantic schemas
│   │   └── user.py
│   ├── crud/                  # Database operations
│   │   └── user.py
│   ├── api/                   # API routes
│   │   └── v1/
│   │       ├── api.py
│   │       └── endpoints/
│   │           ├── auth.py
│   │           ├── users.py
│   │           ├── tax_forms.py
│   │           └── ai_processing.py
│   └── ai/                    # Google ADK integration
│       ├── agents.py
│       └── tasks.py
├── alembic/                   # Database migrations
├── systemd/                   # Systemd service files
├── requirements.txt
├── run_server.py             # Server runner
├── run_celery.py            # Celery runner
├── install.sh               # Installation script
└── SETUP_SERVER.md          # Detailed setup guide
```

## API Documentation

Khi ứng dụng đang chạy, truy cập:
- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## Endpoints chính

### Authentication
- `POST /api/v1/auth/register` - Đăng ký tài khoản
- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/refresh` - Làm mới token
- `GET /api/v1/auth/me` - Thông tin người dùng hiện tại

### User Management
- `GET /api/v1/users/` - Danh sách người dùng
- `GET /api/v1/users/{user_id}` - Thông tin người dùng
- `PUT /api/v1/users/{user_id}` - Cập nhật thông tin
- `POST /api/v1/users/{user_id}/profile` - Tạo hồ sơ
- `GET /api/v1/users/{user_id}/addresses` - Danh sách địa chỉ

### Tax Forms
- `GET /api/v1/tax-forms/` - Danh sách tờ khai
- `POST /api/v1/tax-forms/` - Tạo tờ khai mới
- `GET /api/v1/tax-forms/{form_id}` - Chi tiết tờ khai
- `POST /api/v1/tax-forms/{form_id}/submit` - Nộp tờ khai

### AI Processing
- `POST /api/v1/ai/voice/process` - Xử lý giọng nói
- `POST /api/v1/ai/document/process` - Xử lý tài liệu
- `POST /api/v1/ai/validate` - Xác thực dữ liệu
- `POST /api/v1/ai/calculate` - Tính toán thuế

## Google ADK Integration

### Cấu hình
```python
# app/core/config.py
GOOGLE_CLOUD_PROJECT = "your-project-id"
GOOGLE_APPLICATION_CREDENTIALS = "/path/to/service-account.json"
GEMINI_MODEL = "gemini-2.5-flash-lite"
```

### Sử dụng
```python
from app.ai.agents import TaxAIService

# Khởi tạo service
service = TaxAIService(db_session, user_id)

# Xử lý giọng nói
result = await service.process_voice_input(
    audio_data, 
    target_field="total_income",
    form_type="PIT"
)

# Xử lý tài liệu
result = await service.process_document(
    document_data,
    field_specs=["taxpayer_name", "taxpayer_id"],
    document_type="pdf",
    form_type="PIT"
)
```

## Database Models

### User Models
- `User`: Thông tin người dùng cơ bản
- `UserProfile`: Hồ sơ chi tiết với thông tin thuế
- `Address`: Địa chỉ người dùng (hỗ trợ địa chỉ Việt Nam)

### Tax Models
- `TaxDeclaration`: Tờ khai thuế chính
- `FormSection`: Các phần của form
- `FormField`: Các trường dữ liệu
- `TaxCalculation`: Tính toán thuế
- `TaxpayerInfo`: Thông tin người nộp thuế

### AI Models
- `AIProcessingLog`: Log xử lý AI
- `VoiceProcessingResult`: Kết quả xử lý giọng nói
- `DocumentProcessingResult`: Kết quả xử lý tài liệu
- `AIFeedback`: Phản hồi từ người dùng

## Background Processing

### Celery Tasks
```python
# Xử lý giọng nói bất đồng bộ
from app.ai.tasks import process_voice_input_task
task = process_voice_input_task.delay(user_id, audio_data, target_field, form_type)

# Xử lý tài liệu bất đồng bộ
from app.ai.tasks import process_document_task
task = process_document_task.delay(user_id, document_data, field_specs, doc_type, form_type)
```

### Monitoring
```bash
# Xem trạng thái Celery workers
celery -A app.ai.tasks inspect active

# Monitor với Flower
celery -A app.ai.tasks flower
```

## Security

### Authentication
- JWT tokens với refresh mechanism
- Password hashing với bcrypt
- Role-based access control

### Data Protection
- Input validation với Pydantic
- SQL injection protection với SQLAlchemy
- File upload validation
- Rate limiting (TODO)

## Testing

```bash
# Chạy tests
cd /home/taxapp/tax-filing-app
./venv/bin/pytest

# Test với coverage
./venv/bin/pytest --cov=app --cov-report=html
```

## Deployment

### Development
```bash
python run_server.py
```

### Production với Supervisor
```bash
sudo supervisorctl start tax-filing-api
sudo supervisorctl start tax-filing-celery
```

### Production với Systemd
```bash
sudo cp systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable tax-filing-api tax-filing-celery
sudo systemctl start tax-filing-api tax-filing-celery
```

## Monitoring và Logs

### Log Files
- API logs: `/home/taxapp/tax-filing-app/logs/api.log`
- Celery logs: `/home/taxapp/tax-filing-app/logs/celery.log`
- Nginx logs: `/var/log/nginx/`

### Health Check
```bash
curl http://localhost:8000/health
```

### Performance Monitoring
```bash
# API performance
curl http://localhost:8000/api/v1/ai/models/performance

# System resources
htop
iostat
```

## Troubleshooting

### Common Issues

1. **Database connection failed**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check connection
   psql -h localhost -U tax_user -d tax_filing_db
   ```

2. **Redis connection failed**
   ```bash
   # Check Redis status
   sudo systemctl status redis
   
   # Test connection
   redis-cli ping
   ```

3. **Import errors**
   ```bash
   # Ensure virtual environment is activated
   source /home/taxapp/tax-filing-app/venv/bin/activate
   
   # Check Python path
   python -c "import sys; print(sys.path)"
   ```

4. **Permission denied**
   ```bash
   # Fix ownership
   sudo chown -R taxapp:taxapp /home/taxapp/tax-filing-app
   
   # Fix permissions
   chmod 755 /home/taxapp/tax-filing-app/uploads
   ```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## License

[License information]

## Support

For support, please contact [support information] or create an issue in the repository.
