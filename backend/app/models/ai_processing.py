"""
AI Processing models for Vietnamese Tax Filing System
"""

from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class AIProcessingLog(Base):
    """AI processing log for audit and improvement"""
    __tablename__ = "ai_processing_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    processing_type = Column(String(50), nullable=False, index=True)  # voice, document, validation, calculation
    input_data_hash = Column(String(64), nullable=True)  # SHA256 hash of input for privacy
    output_data = Column(JSONB, nullable=True)
    confidence_score = Column(Integer, nullable=True)  # 0-100
    processing_time_ms = Column(Integer, nullable=True)
    model_version = Column(String(50), default="gemini-2.5-flash-lite")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", back_populates="ai_processing_logs")
    
    def __repr__(self):
        return f"<AIProcessingLog(id={self.id}, type={self.processing_type})>"


class VoiceProcessingResult(Base):
    """Voice processing results for Vietnamese tax forms"""
    __tablename__ = "voice_processing_results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    processing_log_id = Column(UUID(as_uuid=True), ForeignKey("ai_processing_logs.id"), nullable=True)
    
    # Voice input details
    audio_duration_seconds = Column(Integer, nullable=True)
    language_detected = Column(String(10), default="vi-VN")
    transcribed_text = Column(Text, nullable=True)
    confidence_score = Column(Integer, nullable=True)  # 0-100
    
    # Form mapping
    target_field = Column(String(100), nullable=True)
    form_type = Column(String(50), nullable=True)
    extracted_value = Column(Text, nullable=True)
    field_mapping_success = Column(String(20), default="pending")  # pending, success, failed
    
    # Processing metadata
    processing_time_ms = Column(Integer, nullable=True)
    model_version = Column(String(50), default="gemini-2.5-flash-lite")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User")
    processing_log = relationship("AIProcessingLog")
    
    def __repr__(self):
        return f"<VoiceProcessingResult(id={self.id}, field={self.target_field})>"


class DocumentProcessingResult(Base):
    """Document processing results for Vietnamese tax documents"""
    __tablename__ = "document_processing_results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    processing_log_id = Column(UUID(as_uuid=True), ForeignKey("ai_processing_logs.id"), nullable=True)
    
    # Document details
    document_type = Column(String(50), nullable=True)  # pdf, jpg, png, etc.
    document_size_bytes = Column(Integer, nullable=True)
    document_hash = Column(String(64), nullable=True)  # SHA256 for deduplication
    
    # Processing results
    extracted_fields = Column(JSONB, nullable=True)  # Field name -> extracted value
    confidence_scores = Column(JSONB, nullable=True)  # Field name -> confidence score
    document_classification = Column(String(100), nullable=True)  # Type of tax document
    
    # Field specifications
    requested_fields = Column(JSONB, nullable=True)  # List of fields requested for extraction
    successful_extractions = Column(Integer, default=0)
    failed_extractions = Column(Integer, default=0)
    
    # Processing metadata
    processing_time_ms = Column(Integer, nullable=True)
    model_version = Column(String(50), default="gemini-2.5-flash-lite")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User")
    processing_log = relationship("AIProcessingLog")
    
    def __repr__(self):
        return f"<DocumentProcessingResult(id={self.id}, type={self.document_type})>"


class AIFeedback(Base):
    """User feedback on AI processing results"""
    __tablename__ = "ai_feedback"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    processing_log_id = Column(UUID(as_uuid=True), ForeignKey("ai_processing_logs.id"), nullable=False)
    
    # Feedback details
    feedback_type = Column(String(20), nullable=False)  # positive, negative, correction
    rating = Column(Integer, nullable=True)  # 1-5 stars
    comment = Column(Text, nullable=True)
    
    # Correction details (if applicable)
    original_value = Column(Text, nullable=True)
    corrected_value = Column(Text, nullable=True)
    field_name = Column(String(100), nullable=True)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User")
    processing_log = relationship("AIProcessingLog")
    
    def __repr__(self):
        return f"<AIFeedback(id={self.id}, type={self.feedback_type})>"


class AIModelPerformance(Base):
    """AI model performance metrics"""
    __tablename__ = "ai_model_performance"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_version = Column(String(50), nullable=False, index=True)
    processing_type = Column(String(50), nullable=False, index=True)
    
    # Performance metrics
    total_requests = Column(Integer, default=0)
    successful_requests = Column(Integer, default=0)
    failed_requests = Column(Integer, default=0)
    average_confidence_score = Column(Integer, nullable=True)  # 0-100
    average_processing_time_ms = Column(Integer, nullable=True)
    
    # Accuracy metrics (based on user feedback)
    positive_feedback_count = Column(Integer, default=0)
    negative_feedback_count = Column(Integer, default=0)
    correction_count = Column(Integer, default=0)
    
    # Time period
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<AIModelPerformance(id={self.id}, model={self.model_version})>"


class AIPromptTemplate(Base):
    """AI prompt templates for different processing types"""
    __tablename__ = "ai_prompt_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_name = Column(String(100), nullable=False, unique=True)
    processing_type = Column(String(50), nullable=False, index=True)
    language = Column(String(10), default="vi", index=True)  # vi, en
    
    # Template content
    system_prompt = Column(Text, nullable=False)
    user_prompt_template = Column(Text, nullable=False)
    example_inputs = Column(JSONB, nullable=True)
    example_outputs = Column(JSONB, nullable=True)
    
    # Template metadata
    version = Column(String(20), default="1.0")
    is_active = Column(String(20), default=True)
    description = Column(Text, nullable=True)
    
    # Performance tracking
    usage_count = Column(Integer, default=0)
    success_rate = Column(Integer, nullable=True)  # 0-100
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<AIPromptTemplate(id={self.id}, name={self.template_name})>"
