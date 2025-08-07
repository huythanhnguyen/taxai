"""
Taxpayer-specific models for Vietnamese Tax Filing System
"""

from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class TaxpayerInfo(Base):
    """Taxpayer information model"""
    __tablename__ = "taxpayer_info"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tax_form_id = Column(UUID(as_uuid=True), ForeignKey("tax_declarations.id"), nullable=False)
    tax_id = Column(String(20), nullable=False)  # Mã số thuế
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=False)
    phone_number = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    business_type = Column(String(100), nullable=True)
    registration_date = Column(DateTime, nullable=True)
    tax_office = Column(String(255), nullable=False)  # Cơ quan thuế
    tax_officer_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tax_declaration = relationship("TaxDeclaration", back_populates="taxpayer_info")
    
    def __repr__(self):
        return f"<TaxpayerInfo(id={self.id}, tax_id={self.tax_id})>"


class PersonalIncomeDetail(Base):
    """Personal income details for individual tax returns"""
    __tablename__ = "personal_income_details"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tax_form_id = Column(UUID(as_uuid=True), ForeignKey("tax_declarations.id"), nullable=False)
    income_type = Column(String(50), nullable=False)  # SALARY, BONUS, OVERTIME, BUSINESS, INVESTMENT, RENTAL, OTHER
    description = Column(Text, nullable=False)
    amount = Column(String(20), nullable=False)  # Store as string to avoid precision issues
    tax_withheld = Column(String(20), default="0")
    source = Column(String(255), nullable=True)
    period_description = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tax_declaration = relationship("TaxDeclaration", back_populates="income_details")
    
    def __repr__(self):
        return f"<PersonalIncomeDetail(id={self.id}, type={self.income_type})>"


class DeductionDetail(Base):
    """Deduction details for tax calculations"""
    __tablename__ = "deduction_details"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tax_form_id = Column(UUID(as_uuid=True), ForeignKey("tax_declarations.id"), nullable=False)
    deduction_type = Column(String(50), nullable=False)  # PERSONAL, DEPENDENT, INSURANCE, CHARITY, EDUCATION, MEDICAL, OTHER
    description = Column(Text, nullable=False)
    amount = Column(String(20), nullable=False)
    supporting_document = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tax_declaration = relationship("TaxDeclaration", back_populates="deduction_details")
    
    def __repr__(self):
        return f"<DeductionDetail(id={self.id}, type={self.deduction_type})>"


class DependentInfo(Base):
    """Dependent information for tax deductions"""
    __tablename__ = "dependent_info"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tax_form_id = Column(UUID(as_uuid=True), ForeignKey("tax_declarations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    relationship = Column(String(50), nullable=False)  # con, vợ/chồng, cha/mẹ, etc.
    tax_id = Column(String(20), nullable=True)
    birth_date = Column(DateTime, nullable=False)
    is_disabled = Column(Boolean, default=False)
    months_supported = Column(Integer, default=12)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tax_declaration = relationship("TaxDeclaration", back_populates="dependents")
    
    def __repr__(self):
        return f"<DependentInfo(id={self.id}, name={self.name})>"


class VATDetail(Base):
    """VAT transaction details"""
    __tablename__ = "vat_details"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tax_form_id = Column(UUID(as_uuid=True), ForeignKey("tax_declarations.id"), nullable=False)
    transaction_type = Column(String(20), nullable=False)  # SALE, PURCHASE
    description = Column(Text, nullable=False)
    amount = Column(String(20), nullable=False)
    vat_rate = Column(String(10), nullable=False)  # Store as string (e.g., "0.10")
    vat_amount = Column(String(20), nullable=False)
    invoice_number = Column(String(100), nullable=True)
    invoice_date = Column(DateTime, nullable=True)
    supplier_tax_id = Column(String(20), nullable=True)
    supplier_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tax_declaration = relationship("TaxDeclaration", back_populates="vat_details")
    
    def __repr__(self):
        return f"<VATDetail(id={self.id}, type={self.transaction_type})>"


class FinancialStatement(Base):
    """Financial statements for corporate tax"""
    __tablename__ = "financial_statements"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tax_form_id = Column(UUID(as_uuid=True), ForeignKey("tax_declarations.id"), nullable=False)
    statement_type = Column(String(50), nullable=False)  # BALANCE_SHEET, INCOME_STATEMENT, CASH_FLOW
    statement_name = Column(String(255), nullable=False)
    statement_data = Column(JSONB, nullable=False)
    period_start_date = Column(DateTime, nullable=False)
    period_end_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tax_declaration = relationship("TaxDeclaration", back_populates="financial_statements")
    
    def __repr__(self):
        return f"<FinancialStatement(id={self.id}, type={self.statement_type})>"
