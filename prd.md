# Product Requirements Document (PRD)
## AI-Powered Tax Filing PWA Platform

### Version: 2.0
### Date: January 2025
### Author: Development Team

---

## 1. Executive Summary

### 1.1 Product Vision
Develop a Progressive Web Application (PWA) that provides comprehensive tax filing services equivalent to the HTKK v5.3.9 desktop application, enhanced with an intelligent multimodal AI chatbot powered by Google Agent Development Kit (ADK) using Gemini-2.5-Flash-Lite. The platform prioritizes traditional menu navigation for core functionality, with advanced AI assistance for complex scenarios and multimodal input processing.

### 1.2 Key Objectives
- **Traditional-First Approach**: Prioritize familiar menu-driven tax filing system as primary interface
- **Multimodal AI Enhancement**: Integrate voice, document, and image processing capabilities
- **Progressive Enhancement**: Add AI features incrementally without disrupting core workflows
- **Compliance**: Ensure full compliance with Vietnamese tax regulations and standards
- **Accessibility**: Provide cross-platform access through PWA technology with voice input support

---

## 2. Product Overview

### 2.1 Target Users
- **Primary**: Individual taxpayers in Vietnam
- **Secondary**: Small business owners and freelancers
- **Tertiary**: Tax consultants and accounting professionals

### 2.2 Core Value Proposition
- **Menu-First Design**: Traditional hierarchical interface as primary navigation method
- **Multimodal AI Support**: Voice, document, and image input directly to Gemini-2.5-Flash-Lite
- **Progressive AI Integration**: AI features enhance but don't replace traditional workflows
- **Direct Document Processing**: PDF, images processed directly by LLM with targeted field extraction
- **Voice-to-Form**: Direct voice input for form completion and navigation
- **Offline Capability**: PWA functionality for core tax filing without AI features

---

## 3. Functional Requirements

### 3.1 Core Tax Filing Features (HTKK Equivalent)

#### 3.1.1 Tax Declaration Types
- Personal Income Tax (PIT) declarations
- Corporate Income Tax (CIT) declarations
- Value Added Tax (VAT) declarations
- Special Consumption Tax declarations
- Import/Export tax declarations
- Property tax declarations

#### 3.1.2 Form Management
- Dynamic form generation based on tax type
- Form validation and error checking
- Auto-save functionality
- Form templates and pre-filling
- Multi-language support (Vietnamese, English)

#### 3.1.3 Document Processing
- PDF generation for tax declarations
- Digital signature integration
- Document attachment management
- Export capabilities (XML, PDF, Excel)
- Print-ready formatting

#### 3.1.4 Data Management
- Taxpayer profile management
- Historical declaration storage
- Data import/export functionality
- Backup and restore capabilities
- Data encryption and security

### 3.2 Multimodal AI Features (Google ADK Integration)

#### 3.2.1 Model Configuration
```python
# Gemini-2.5-Flash-Lite Configuration
from google.adk import Agent, LlmAgent
from google.adk.tools import FunctionTool

MODEL_GEMINI_2_5_FLASH_LITE = "gemini-2.5-flash-lite"

class TaxFilingAgent(LlmAgent):
    def __init__(self):
        super().__init__(
            model=MODEL_GEMINI_2_5_FLASH_LITE,
            tools=[
                TaxFormTool(),
                VoiceInputTool(),
                DocumentExtractionTool(),
                FieldMappingTool()
            ]
        )
```

#### 3.2.2 Multimodal Input Capabilities
- **Voice Input**: Direct speech-to-text processing by Gemini for form completion
- **Document Processing**: PDF, images directly processed by LLM with specific field extraction prompts
- **Image Analysis**: Tax documents, receipts, and forms analyzed for data extraction
- **Targeted Extraction**: LLM instructed to extract only specific tax-relevant fields
- **Vietnamese Language**: Native support for Vietnamese voice and text processing
- **Real-time Processing**: Immediate multimodal input processing without intermediate steps

#### 3.2.3 Simplified Agent Architecture
```python
# Streamlined agent system focusing on multimodal input
class TaxAssistantAgent(LlmAgent):
    def __init__(self):
        super().__init__(
            model=MODEL_GEMINI_2_5_FLASH_LITE,
            system_prompt="""
            You are a Vietnamese tax assistant. Process multimodal inputs:
            1. Extract ONLY specified tax fields from documents/images
            2. Convert voice input to form data
            3. Validate extracted information
            4. Map to appropriate tax form fields
            """,
            tools=[
                DirectDocumentProcessor(),
                VoiceToFormMapper(),
                FieldValidator()
            ]
        )
```

### 3.3 User Interface Requirements

#### 3.3.1 Menu-First Navigation System
- **Primary Interface**: Traditional hierarchical menu system identical to HTKK
- **AI Enhancement Layer**: Optional AI assistance available on-demand
- **Voice Input Integration**: Voice commands for menu navigation and form filling
- **Progressive Disclosure**: AI features revealed gradually as users become comfortable

#### 3.3.2 Responsive Design
- Mobile-first design approach
- Tablet and desktop optimization
- Touch-friendly interface elements
- Accessibility compliance (WCAG 2.1)

#### 3.3.3 PWA Features
- Offline functionality for form completion
- Push notifications for deadlines and updates
- App-like experience with home screen installation
- Background sync for data submission

---

## 4. Technical Requirements

### 4.1 Architecture Overview

#### 4.1.1 Frontend Stack
- **Framework**: React.js with TypeScript
- **PWA**: Service Workers, Web App Manifest
- **UI Library**: Material-UI or Ant Design
- **State Management**: Redux Toolkit or Zustand
- **Chat Interface**: Custom chat component with ADK integration

#### 4.1.2 Backend Stack
- **Runtime**: Python 3.11+ with FastAPI
- **AI Framework**: Google ADK (Agent Development Kit) for Python
- **Database**: PostgreSQL with Redis for caching
- **Authentication**: OAuth 2.0 with JWT tokens (using python-jose)
- **File Storage**: Google Cloud Storage (for seamless ADK integration)
- **ORM**: SQLAlchemy with Alembic for migrations
- **Task Queue**: Celery with Redis broker for async AI processing
- **API Documentation**: Automatic OpenAPI/Swagger with FastAPI

#### 4.1.3 Multimodal AI Integration with Python
```python
# Python Backend Architecture for Google ADK Integration
from fastapi import FastAPI, BackgroundTasks
from google.adk import Agent, LlmAgent
from google.adk.tools import FunctionTool
from sqlalchemy.ext.asyncio import AsyncSession
from celery import Celery
import asyncio

# FastAPI application with ADK integration
app = FastAPI(title="Vietnamese Tax Filing API")
celery_app = Celery('tax_filing', broker='redis://localhost:6379')

class MultimodalTaxAgent(LlmAgent):
    """Python-based multimodal tax agent with FastAPI integration"""
    
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
        super().__init__(
            model="gemini-2.5-flash-lite",
            system_prompt=self._get_vietnamese_tax_prompt(),
            tools=[
                VoiceToFormTool(db_session),
                DocumentFieldExtractor(db_session),
                FormFieldMapper(db_session),
                DataValidator(db_session),
                TaxCalculationTool(db_session)
            ]
        )
    
    def _get_vietnamese_tax_prompt(self):
        return """
        Bạn là trợ lý thuế Việt Nam với khả năng đa phương thức:
        1. Xử lý đầu vào giọng nói để điền form
        2. Trích xuất các trường cụ thể từ tài liệu PDF/hình ảnh
        3. Ánh xạ dữ liệu đã trích xuất vào các trường form thuế
        4. Xác thực và định dạng dữ liệu phù hợp
        
        QUAN TRỌNG: Chỉ trích xuất các trường được yêu cầu rõ ràng.
        """

# Async endpoint for AI processing
@app.post("/api/ai/process-multimodal")
async def process_multimodal_input(
    input_data: dict,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session)
):
    """Process multimodal input asynchronously"""
    agent = MultimodalTaxAgent(db)
    
    # Process in background for better performance
    background_tasks.add_task(
        process_ai_request,
        agent,
        input_data
    )
    
    return {"status": "processing", "request_id": generate_request_id()}
```

### 4.2 Integration Requirements

#### 4.2.1 Government Systems
- Integration with Vietnamese tax authority APIs
- Electronic submission capabilities
- Real-time status checking
- Official receipt generation

#### 4.2.2 Third-party Services
- Digital signature providers
- Banking integration for tax payments
- Document verification services
- SMS/Email notification services

### 4.3 Security Requirements

#### 4.3.1 Data Protection
- End-to-end encryption for sensitive data
- GDPR and Vietnamese data protection compliance
- Secure document storage and transmission
- Regular security audits and penetration testing

#### 4.3.2 Authentication & Authorization
- Multi-factor authentication (MFA)
- Role-based access control (RBAC)
- Session management and timeout
- Audit logging for all user actions

---

## 5. Multimodal AI Specifications

### 5.1 Simplified Agent Architecture

#### 5.1.1 Python-Based Single Multimodal Agent
```python
# Unified multimodal agent for tax processing with Python backend
from typing import Optional, Dict, Any
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from google.adk import LlmAgent
from google.adk.tools import FunctionTool

class TaxFormData(BaseModel):
    """Pydantic model for tax form data validation"""
    form_type: str
    taxpayer_id: str
    fields: Dict[str, Any]
    extracted_confidence: Optional[float] = None

class TaxMultimodalAgent(LlmAgent):
    """Single agent handling all multimodal tax operations with Python backend"""
    
    def __init__(self, db_session: AsyncSession, user_id: str):
        self.db_session = db_session
        self.user_id = user_id
        super().__init__(
            model="gemini-2.5-flash-lite",
            system_prompt=self._get_vietnamese_multimodal_prompt(),
            tools=[
                VoiceInputProcessor(db_session, user_id),
                DocumentFieldExtractor(db_session, user_id),
                FormFieldMapper(db_session, user_id),
                DataValidator(db_session, user_id),
                HTKKCompatibilityChecker(db_session)
            ]
        )
    
    def _get_vietnamese_multimodal_prompt(self):
        return """
        Bạn là trợ lý thuế Việt Nam với khả năng xử lý đa phương thức:
        - Xử lý lệnh giọng nói để điều hướng form và nhập dữ liệu
        - Trích xuất CHỈ các trường được chỉ định từ tài liệu/hình ảnh
        - Ánh xạ dữ liệu đã trích xuất vào các trường form thuế chính xác
        - Xác thực định dạng và tính đầy đủ của dữ liệu
        - Đảm bảo tương thích với hệ thống HTKK v5.3.9
        
        Luôn ưu tiên giao diện menu truyền thống và chỉ sử dụng AI khi được yêu cầu.
        """
    
    async def process_voice_input(self, audio_data: bytes, target_field: str) -> TaxFormData:
        """Process voice input for specific form field"""
        # Implementation will be handled by VoiceInputProcessor tool
        pass
    
    async def process_document(self, document_data: bytes, field_specifications: list) -> TaxFormData:
        """Process document with specific field extraction requirements"""
        # Implementation will be handled by DocumentFieldExtractor tool
        pass
```

#### 5.1.2 Python-Based Multimodal Tool Integration
```python
# Tools for multimodal input processing with Python backend
from google.adk.tools import FunctionTool
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List
import asyncio
from pydantic import BaseModel

class VoiceProcessingResult(BaseModel):
    """Result model for voice processing"""
    transcribed_text: str
    confidence: float
    field_mapping: Dict[str, Any]
    language_detected: str

class DocumentExtractionResult(BaseModel):
    """Result model for document extraction"""
    extracted_fields: Dict[str, Any]
    confidence_scores: Dict[str, float]
    document_type: str
    processing_time: float

class VoiceInputProcessor(FunctionTool):
    """Process voice input directly to form fields with Vietnamese support"""
    
    def __init__(self, db_session: AsyncSession, user_id: str):
        self.db_session = db_session
        self.user_id = user_id
        super().__init__(
            name="voice_input_processor",
            description="Xử lý đầu vào giọng nói tiếng Việt và ánh xạ vào các trường form thuế"
        )
    
    async def execute(self, audio_data: bytes, target_field: str) -> VoiceProcessingResult:
        """Execute voice processing with Vietnamese language support"""
        # Implementation for Vietnamese voice processing
        pass

class DocumentFieldExtractor(FunctionTool):
    """Extract specific fields from PDF/images using Gemini vision with Vietnamese text support"""
    
    def __init__(self, db_session: AsyncSession, user_id: str):
        self.db_session = db_session
        self.user_id = user_id
        super().__init__(
            name="document_field_extractor",
            description="Trích xuất các trường cụ thể từ tài liệu PDF/hình ảnh bằng Gemini vision"
        )
    
    async def execute(self, document_data: bytes, field_specs: List[str]) -> DocumentExtractionResult:
        """Execute document field extraction with Vietnamese document support"""
        # Implementation for Vietnamese document processing
        pass

class FormFieldMapper(FunctionTool):
    """Map extracted data to appropriate tax form fields with HTKK compatibility"""
    
    def __init__(self, db_session: AsyncSession, user_id: str):
        self.db_session = db_session
        self.user_id = user_id
        super().__init__(
            name="form_field_mapper",
            description="Ánh xạ dữ liệu đã trích xuất vào các trường form thuế phù hợp"
        )
    
    async def execute(self, extracted_data: Dict[str, Any], form_type: str) -> Dict[str, Any]:
        """Map extracted data to HTKK-compatible form fields"""
        # Implementation for HTKK form field mapping
        pass

class DataValidator(FunctionTool):
    """Validate extracted data against Vietnamese tax requirements"""
    
    def __init__(self, db_session: AsyncSession, user_id: str):
        self.db_session = db_session
        self.user_id = user_id
        super().__init__(
            name="data_validator",
            description="Xác thực dữ liệu đã trích xuất theo yêu cầu thuế Việt Nam"
        )
    
    async def execute(self, form_data: Dict[str, Any], form_type: str) -> Dict[str, Any]:
        """Validate data against Vietnamese tax regulations"""
        # Implementation for Vietnamese tax validation
        pass
```

### 5.2 Multimodal Interaction Flows

#### 5.2.1 Voice Input Flow
1. **Voice Activation**: User activates voice input on any form field
2. **Speech Processing**: Gemini processes Vietnamese/English speech directly
3. **Field Mapping**: Voice content mapped to appropriate form fields
4. **Validation**: Real-time validation of voice-entered data
5. **Confirmation**: User confirms or corrects voice input

#### 5.2.2 Document Processing Flow
1. **Document Upload**: User uploads PDF/image documents
2. **Field Specification**: System prompts for specific fields to extract
3. **Direct LLM Processing**: Gemini analyzes document with targeted prompts
4. **Selective Extraction**: Only requested fields extracted and mapped
5. **User Verification**: User reviews and confirms extracted data

#### 5.2.3 Progressive Enhancement
- Traditional menu navigation remains primary
- AI features introduced contextually when beneficial
- User can opt-in/out of AI assistance at any time

---

## 6. User Experience Requirements

### 6.1 User Journey Mapping

#### 6.1.1 Primary Menu Path (Default)
1. User logs in to platform
2. Navigates through traditional HTKK-style menu
3. Completes forms using familiar interface
4. Validates and submits declaration

#### 6.1.2 Voice-Enhanced Path
1. User follows traditional menu navigation
2. Activates voice input for specific form fields
3. Speaks data directly into forms
4. Continues with traditional validation and submission

#### 6.1.3 Document-Enhanced Path
1. User navigates to appropriate tax form via menu
2. Uploads supporting documents (PDF/images)
3. Specifies which fields to extract
4. Reviews and confirms auto-filled data
5. Completes remaining fields traditionally

### 6.2 Performance Requirements

#### 6.2.1 Response Times
- Page load time: < 3 seconds
- AI response time: < 5 seconds
- Form auto-save: < 1 second
- Document upload: < 10 seconds

#### 6.2.2 Availability
- 99.9% uptime during tax season
- 99.5% uptime during off-season
- Graceful degradation during high traffic

---

## 7. Compliance & Regulatory Requirements

### 7.1 Vietnamese Tax Compliance
- Full compliance with Vietnamese tax laws
- Support for all official tax forms and procedures
- Integration with government tax systems
- Adherence to filing deadlines and requirements

### 7.2 Data Privacy & Security
- Compliance with Vietnamese cybersecurity laws
- GDPR compliance for international users
- Secure handling of personal and financial data
- Regular compliance audits

---

## 8. Success Metrics

### 8.1 User Adoption
- Monthly active users: Target 100K in first year
- User retention rate: > 70% after first use
- Chat engagement rate: > 60% of users try AI assistant
- Form completion rate: > 90% for started declarations

### 8.2 AI Performance
- AI response accuracy: > 95% for tax-related queries
- User satisfaction with AI assistance: > 4.5/5
- Successful form completion with AI help: > 85%
- Reduction in user errors: > 50% compared to manual filing

### 8.3 Business Metrics
- Cost reduction compared to traditional support: > 40%
- Processing time reduction: > 60%
- User support ticket reduction: > 50%

---

## 9. Implementation Phases

### 9.1 Phase 1: Core Platform (Months 1-3)
- Basic PWA infrastructure
- User authentication and management
- Core tax form functionality
- Basic AI chatbot integration

### 9.2 Phase 2: AI Enhancement (Months 4-6)
- Advanced AI agent capabilities
- Multi-agent system implementation
- Document analysis features
- Enhanced conversation flows

### 9.3 Phase 3: Integration & Optimization (Months 7-9)
- Government system integration
- Performance optimization
- Security hardening
- User testing and feedback incorporation

### 9.4 Phase 4: Launch & Scale (Months 10-12)
- Production deployment
- User onboarding campaigns
- Monitoring and analytics
- Continuous improvement based on usage data

---

## 10. Risk Assessment

### 10.1 Technical Risks
- **AI Model Performance**: Risk of inaccurate tax advice
  - Mitigation: Extensive testing and validation
- **Integration Complexity**: Challenges with government APIs
  - Mitigation: Early prototype development and testing
- **Scalability**: High traffic during tax season
  - Mitigation: Cloud-native architecture and load testing

### 10.2 Regulatory Risks
- **Compliance Changes**: Updates to tax laws and regulations
  - Mitigation: Flexible system design and regular updates
- **Data Security**: Breach of sensitive financial data
  - Mitigation: Robust security measures and regular audits

### 10.3 Business Risks
- **User Adoption**: Slow uptake of new platform
  - Mitigation: Comprehensive user education and support
- **Competition**: Existing solutions and new entrants
  - Mitigation: Unique AI-powered features and superior UX

---

## 11. Appendices

### 11.1 Technical Architecture Diagrams
[To be included in detailed design phase]

### 11.2 User Interface Mockups
[To be created during design phase]

### 11.3 API Specifications
[To be detailed during development phase]

### 11.4 Security Assessment
[To be conducted by security team]

---

## 12. Python Backend Architecture Details

### 12.1 FastAPI Application Structure
```python
# Main application structure for Vietnamese Tax Filing PWA
from fastapi import FastAPI, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from google.adk import LlmAgent
import asyncio

# FastAPI application with Vietnamese tax filing focus
app = FastAPI(
    title="Vietnamese Tax Filing API",
    description="API cho hệ thống kê khai thuế Việt Nam với AI hỗ trợ",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Database dependency
async def get_db_session() -> AsyncSession:
    async with async_session() as session:
        yield session

# AI Agent dependency
async def get_tax_agent(
    db: AsyncSession = Depends(get_db_session),
    current_user: dict = Depends(get_current_user)
) -> TaxMultimodalAgent:
    return TaxMultimodalAgent(db, current_user["user_id"])
```

### 12.2 Database Models with SQLAlchemy
```python
# Vietnamese tax-specific database models
from sqlalchemy import Column, Integer, String, DateTime, JSON, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid

Base = declarative_base()

class TaxpayerProfile(Base):
    __tablename__ = "taxpayer_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    taxpayer_id = Column(String(20), unique=True, nullable=False)  # Mã số thuế
    full_name = Column(String(255), nullable=False)
    address = Column(Text)
    phone = Column(String(20))
    email = Column(String(255))
    tax_office_code = Column(String(10))  # Mã cơ quan thuế
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TaxDeclaration(Base):
    __tablename__ = "tax_declarations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    taxpayer_id = Column(UUID(as_uuid=True), nullable=False)
    form_type = Column(String(50), nullable=False)  # PIT, CIT, VAT, etc.
    tax_period = Column(String(20), nullable=False)  # Kỳ tính thuế
    form_data = Column(JSON, nullable=False)  # Dữ liệu form
    status = Column(String(20), default="draft")  # draft, submitted, approved
    submission_date = Column(DateTime)
    ai_processed = Column(Boolean, default=False)
    ai_confidence_score = Column(Integer)  # 0-100
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AIProcessingLog(Base):
    __tablename__ = "ai_processing_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    processing_type = Column(String(50), nullable=False)  # voice, document, validation
    input_data_hash = Column(String(64))  # SHA256 hash of input
    output_data = Column(JSON)
    confidence_score = Column(Integer)
    processing_time_ms = Column(Integer)
    model_version = Column(String(50), default="gemini-2.5-flash-lite")
    created_at = Column(DateTime, default=datetime.utcnow)
```

### 12.3 Pydantic Models for API Validation
```python
# Pydantic models for Vietnamese tax data validation
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class TaxFormType(str, Enum):
    PIT = "PIT"  # Thuế thu nhập cá nhân
    CIT = "CIT"  # Thuế thu nhập doanh nghiệp
    VAT = "VAT"  # Thuế giá trị gia tăng
    SCT = "SCT"  # Thuế tiêu thụ đặc biệt
    IMPORT_EXPORT = "IMPORT_EXPORT"  # Thuế xuất nhập khẩu
    PROPERTY = "PROPERTY"  # Thuế tài sản

class TaxpayerProfileCreate(BaseModel):
    taxpayer_id: str = Field(..., regex=r"^\d{10,13}$", description="Mã số thuế")
    full_name: str = Field(..., min_length=1, max_length=255)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, regex=r"^[0-9+\-\s()]+$")
    email: Optional[str] = Field(None, regex=r"^[^@]+@[^@]+\.[^@]+$")
    tax_office_code: Optional[str] = Field(None, regex=r"^\d{3}$")

class VoiceInputRequest(BaseModel):
    audio_data: str = Field(..., description="Base64 encoded audio data")
    target_field: str = Field(..., description="Target form field name")
    form_type: TaxFormType
    language: str = Field(default="vi-VN", regex=r"^(vi-VN|en-US)$")

class DocumentProcessingRequest(BaseModel):
    document_data: str = Field(..., description="Base64 encoded document")
    document_type: str = Field(..., regex=r"^(pdf|jpg|jpeg|png)$")
    field_specifications: List[str] = Field(..., min_items=1)
    form_type: TaxFormType

class AIProcessingResponse(BaseModel):
    request_id: str
    status: str = Field(..., regex=r"^(processing|completed|failed)$")
    extracted_data: Optional[Dict[str, Any]] = None
    confidence_scores: Optional[Dict[str, float]] = None
    processing_time_ms: Optional[int] = None
    error_message: Optional[str] = None
```

### 12.4 Google ADK Integration Service
```python
# Service layer for Google ADK integration
from google.adk import LlmAgent
from google.adk.tools import FunctionTool
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
from typing import Dict, Any

class TaxAIService:
    """Service class for AI operations with Vietnamese tax focus"""
    
    def __init__(self, db_session: AsyncSession, user_id: str):
        self.db_session = db_session
        self.user_id = user_id
        self.agent = TaxMultimodalAgent(db_session, user_id)
    
    async def process_voice_input(
        self, 
        audio_data: bytes, 
        target_field: str, 
        form_type: str
    ) -> Dict[str, Any]:
        """Process Vietnamese voice input for tax forms"""
        try:
            # Use Google ADK for voice processing
            result = await self.agent.process_voice_input(
                audio_data, 
                target_field
            )
            
            # Log the processing
            await self._log_ai_processing(
                "voice", 
                {"target_field": target_field, "form_type": form_type},
                result
            )
            
            return result
        except Exception as e:
            await self._log_ai_error("voice", str(e))
            raise
    
    async def process_document(
        self, 
        document_data: bytes, 
        field_specs: List[str],
        form_type: str
    ) -> Dict[str, Any]:
        """Process Vietnamese tax documents"""
        try:
            # Use Google ADK for document processing
            result = await self.agent.process_document(
                document_data, 
                field_specs
            )
            
            # Log the processing
            await self._log_ai_processing(
                "document", 
                {"field_specs": field_specs, "form_type": form_type},
                result
            )
            
            return result
        except Exception as e:
            await self._log_ai_error("document", str(e))
            raise
    
    async def _log_ai_processing(
        self, 
        processing_type: str, 
        input_data: Dict[str, Any], 
        output_data: Dict[str, Any]
    ):
        """Log AI processing for audit and improvement"""
        log_entry = AIProcessingLog(
            user_id=self.user_id,
            processing_type=processing_type,
            input_data_hash=self._hash_input(input_data),
            output_data=output_data,
            confidence_score=output_data.get("confidence", 0),
            processing_time_ms=output_data.get("processing_time", 0)
        )
        self.db_session.add(log_entry)
        await self.db_session.commit()
```

### 12.5 Async Task Processing with Celery
```python
# Celery configuration for background AI processing
from celery import Celery
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
import asyncio

# Celery app configuration
celery_app = Celery(
    'vietnamese_tax_ai',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Ho_Chi_Minh',
    enable_utc=True,
)

@celery_app.task(bind=True)
def process_large_document(self, user_id: str, document_data: str, field_specs: list):
    """Background task for processing large Vietnamese tax documents"""
    try:
        # Create async session for background processing
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        async def _process():
            async with async_session() as db:
                service = TaxAIService(db, user_id)
                result = await service.process_document(
                    document_data.encode(), 
                    field_specs,
                    "document_processing"
                )
                return result
        
        result = loop.run_until_complete(_process())
        return {"status": "completed", "result": result}
        
    except Exception as exc:
        self.retry(exc=exc, countdown=60, max_retries=3)
```

---

**Document Status**: Draft v2.0 - Python Backend Focused
**Next Review**: [Date]
**Approval Required**: Product Manager, Technical Lead, Compliance Officer 