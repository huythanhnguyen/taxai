"""
Tax Declaration models for Vietnamese Tax Filing System
"""

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class TaxDeclaration(Base):
    """Main tax declaration model"""
    __tablename__ = "tax_declarations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    form_type = Column(String(50), nullable=False, index=True)  # PIT, CIT, VAT, etc.
    tax_year = Column(Integer, nullable=False, index=True)
    tax_period_type = Column(String(20), nullable=False)  # MONTHLY, QUARTERLY, ANNUAL
    tax_month = Column(Integer, nullable=True)
    tax_quarter = Column(Integer, nullable=True)
    period_start_date = Column(DateTime, nullable=False)
    period_end_date = Column(DateTime, nullable=False)
    
    # Status and amounts
    status = Column(String(20), default="DRAFT", index=True)  # DRAFT, COMPLETED, SUBMITTED, APPROVED, REJECTED, CANCELLED
    total_tax_amount = Column(String(20), default="0")  # Store as string to avoid precision issues
    total_payable_amount = Column(String(20), default="0")
    
    # Submission info
    submission_date = Column(DateTime, nullable=True)
    approval_date = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    version = Column(Integer, default=1)
    
    # AI processing info
    ai_processed = Column(Boolean, default=False)
    ai_confidence_score = Column(Integer, nullable=True)  # 0-100
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="tax_declarations")
    taxpayer_info = relationship("TaxpayerInfo", back_populates="tax_declaration", uselist=False)
    form_sections = relationship("FormSection", back_populates="tax_declaration")
    tax_calculations = relationship("TaxCalculation", back_populates="tax_declaration")
    income_details = relationship("PersonalIncomeDetail", back_populates="tax_declaration")
    deduction_details = relationship("DeductionDetail", back_populates="tax_declaration")
    dependents = relationship("DependentInfo", back_populates="tax_declaration")
    vat_details = relationship("VATDetail", back_populates="tax_declaration")
    financial_statements = relationship("FinancialStatement", back_populates="tax_declaration")
    attachments = relationship("FormAttachment", back_populates="tax_declaration")
    digital_signatures = relationship("DigitalSignature", back_populates="tax_declaration")
    
    def __repr__(self):
        return f"<TaxDeclaration(id={self.id}, type={self.form_type}, year={self.tax_year})>"


class FormSection(Base):
    """Form sections for dynamic form structure"""
    __tablename__ = "form_sections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tax_form_id = Column(UUID(as_uuid=True), ForeignKey("tax_declarations.id"), nullable=False)
    section_name = Column(String(100), nullable=False)
    section_title = Column(String(255), nullable=False)
    section_order = Column(Integer, nullable=False)
    is_required = Column(Boolean, default=False)
    is_visible = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tax_declaration = relationship("TaxDeclaration", back_populates="form_sections")
    form_fields = relationship("FormField", back_populates="section")
    
    def __repr__(self):
        return f"<FormSection(id={self.id}, name={self.section_name})>"


class FormField(Base):
    """Form fields for dynamic form structure"""
    __tablename__ = "form_fields"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    section_id = Column(UUID(as_uuid=True), ForeignKey("form_sections.id"), nullable=False)
    field_name = Column(String(100), nullable=False)
    field_label = Column(String(255), nullable=False)
    field_type = Column(String(20), nullable=False)  # TEXT, NUMBER, CURRENCY, PERCENTAGE, DATE, SELECT, CHECKBOX, TEXTAREA, FILE, CALCULATED
    field_value = Column(Text, nullable=True)
    default_value = Column(Text, nullable=True)
    is_required = Column(Boolean, default=False)
    is_readonly = Column(Boolean, default=False)
    is_calculated = Column(Boolean, default=False)
    validation_rules = Column(JSONB, nullable=True)
    field_options = Column(JSONB, nullable=True)
    format_pattern = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    help_text = Column(Text, nullable=True)
    field_order = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    section = relationship("FormSection", back_populates="form_fields")
    
    def __repr__(self):
        return f"<FormField(id={self.id}, name={self.field_name})>"


class TaxCalculation(Base):
    """Tax calculations for different tax types"""
    __tablename__ = "tax_calculations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tax_form_id = Column(UUID(as_uuid=True), ForeignKey("tax_declarations.id"), nullable=False)
    calculation_name = Column(String(255), nullable=False)
    calculation_type = Column(String(50), nullable=False)  # INCOME_TAX, VAT, CORPORATE_TAX, WITHHOLDING_TAX, OTHER
    base_amount = Column(String(20), default="0")
    tax_rate = Column(String(10), default="0")  # Store as string (e.g., "0.10")
    tax_amount = Column(String(20), default="0")
    deductions = Column(String(20), default="0")
    exemptions = Column(String(20), default="0")
    final_amount = Column(String(20), default="0")
    calculation_details = Column(JSONB, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tax_declaration = relationship("TaxDeclaration", back_populates="tax_calculations")
    
    def __repr__(self):
        return f"<TaxCalculation(id={self.id}, type={self.calculation_type})>"


class FormAttachment(Base):
    """File attachments for tax forms"""
    __tablename__ = "form_attachments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tax_form_id = Column(UUID(as_uuid=True), ForeignKey("tax_declarations.id"), nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    tax_declaration = relationship("TaxDeclaration", back_populates="attachments")
    uploader = relationship("User")
    
    def __repr__(self):
        return f"<FormAttachment(id={self.id}, filename={self.file_name})>"


class DigitalSignature(Base):
    """Digital signatures for tax forms"""
    __tablename__ = "digital_signatures"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tax_form_id = Column(UUID(as_uuid=True), ForeignKey("tax_declarations.id"), nullable=False)
    signed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    signed_at = Column(DateTime, nullable=False)
    certificate_id = Column(String(255), nullable=False)
    signature_data = Column(Text, nullable=False)
    algorithm = Column(String(50), nullable=False)
    is_valid = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    tax_declaration = relationship("TaxDeclaration", back_populates="digital_signatures")
    signer = relationship("User")
    
    def __repr__(self):
        return f"<DigitalSignature(id={self.id}, certificate={self.certificate_id})>"


class TaxConfiguration(Base):
    """Tax configuration for different years and types"""
    __tablename__ = "tax_configurations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    year = Column(Integer, nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)  # personal_income, corporate, vat
    config_data = Column(JSONB, nullable=False)  # Tax rates, brackets, exemptions
    effective_date = Column(DateTime, nullable=False)
    expiry_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<TaxConfiguration(id={self.id}, year={self.year}, type={self.type})>"


class FormTemplate(Base):
    """Form templates for different tax types"""
    __tablename__ = "form_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    form_type = Column(String(50), nullable=False, index=True)
    template_name = Column(String(255), nullable=False)
    version = Column(String(20), nullable=False)
    effective_date = Column(DateTime, nullable=False)
    expiry_date = Column(DateTime, nullable=True)
    template_data = Column(JSONB, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<FormTemplate(id={self.id}, type={self.form_type}, version={self.version})>"
