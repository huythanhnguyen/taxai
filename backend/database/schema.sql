-- Tax Filing System Database Schema
-- PostgreSQL Database Schema for HTKK-equivalent PWA

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('individual', 'business', 'consultant', 'admin')),
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tax_id VARCHAR(20),
    phone_number VARCHAR(20),
    date_of_birth DATE,
    occupation VARCHAR(100),
    company VARCHAR(200),
    preferred_language VARCHAR(5) DEFAULT 'vi',
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Addresses table
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'primary' CHECK (type IN ('primary', 'business', 'mailing')),
    street VARCHAR(255) NOT NULL,
    ward VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10),
    country VARCHAR(100) DEFAULT 'Vietnam',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tax configurations table
CREATE TABLE tax_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'personal_income', 'corporate', 'vat'
    config_data JSONB NOT NULL, -- Tax rates, brackets, exemptions
    effective_date DATE NOT NULL,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, type)
);

-- Tax forms table
CREATE TABLE tax_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'TNCN_ANNUAL', 'GTGT_MONTHLY', etc.
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'COMPLETED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED')),
    tax_year INTEGER NOT NULL,
    tax_period_type VARCHAR(20) NOT NULL CHECK (tax_period_type IN ('MONTHLY', 'QUARTERLY', 'ANNUAL')),
    tax_month INTEGER CHECK (tax_month BETWEEN 1 AND 12),
    tax_quarter INTEGER CHECK (tax_quarter BETWEEN 1 AND 4),
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    total_tax_amount DECIMAL(15,2) DEFAULT 0,
    total_payable_amount DECIMAL(15,2) DEFAULT 0,
    submission_date TIMESTAMP,
    approval_date TIMESTAMP,
    rejection_reason TEXT,
    notes TEXT,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Taxpayer information table
CREATE TABLE taxpayer_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_form_id UUID NOT NULL REFERENCES tax_forms(id) ON DELETE CASCADE,
    tax_id VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(255),
    business_type VARCHAR(100),
    registration_date DATE,
    tax_office VARCHAR(255) NOT NULL,
    tax_officer_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Form sections table
CREATE TABLE form_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_form_id UUID NOT NULL REFERENCES tax_forms(id) ON DELETE CASCADE,
    section_name VARCHAR(100) NOT NULL,
    section_title VARCHAR(255) NOT NULL,
    section_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Form fields table
CREATE TABLE form_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES form_sections(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    field_type VARCHAR(20) NOT NULL CHECK (field_type IN ('TEXT', 'NUMBER', 'CURRENCY', 'PERCENTAGE', 'DATE', 'SELECT', 'CHECKBOX', 'TEXTAREA', 'FILE', 'CALCULATED')),
    field_value TEXT,
    default_value TEXT,
    is_required BOOLEAN DEFAULT false,
    is_readonly BOOLEAN DEFAULT false,
    is_calculated BOOLEAN DEFAULT false,
    validation_rules JSONB,
    field_options JSONB,
    format_pattern VARCHAR(100),
    description TEXT,
    help_text TEXT,
    field_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tax calculations table
CREATE TABLE tax_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_form_id UUID NOT NULL REFERENCES tax_forms(id) ON DELETE CASCADE,
    calculation_name VARCHAR(255) NOT NULL,
    calculation_type VARCHAR(50) NOT NULL CHECK (calculation_type IN ('INCOME_TAX', 'VAT', 'CORPORATE_TAX', 'WITHHOLDING_TAX', 'OTHER')),
    base_amount DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    deductions DECIMAL(15,2) DEFAULT 0,
    exemptions DECIMAL(15,2) DEFAULT 0,
    final_amount DECIMAL(15,2) DEFAULT 0,
    calculation_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personal Income Tax specific tables
CREATE TABLE personal_income_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_form_id UUID NOT NULL REFERENCES tax_forms(id) ON DELETE CASCADE,
    income_type VARCHAR(50) NOT NULL CHECK (income_type IN ('SALARY', 'BONUS', 'OVERTIME', 'BUSINESS', 'INVESTMENT', 'RENTAL', 'OTHER')),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    tax_withheld DECIMAL(15,2) DEFAULT 0,
    source VARCHAR(255),
    period_description VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deduction_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_form_id UUID NOT NULL REFERENCES tax_forms(id) ON DELETE CASCADE,
    deduction_type VARCHAR(50) NOT NULL CHECK (deduction_type IN ('PERSONAL', 'DEPENDENT', 'INSURANCE', 'CHARITY', 'EDUCATION', 'MEDICAL', 'OTHER')),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    supporting_document VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dependent_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_form_id UUID NOT NULL REFERENCES tax_forms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    tax_id VARCHAR(20),
    birth_date DATE NOT NULL,
    is_disabled BOOLEAN DEFAULT false,
    months_supported INTEGER DEFAULT 12 CHECK (months_supported BETWEEN 1 AND 12),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VAT specific tables
CREATE TABLE vat_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_form_id UUID NOT NULL REFERENCES tax_forms(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('SALE', 'PURCHASE')),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    vat_rate DECIMAL(5,4) NOT NULL,
    vat_amount DECIMAL(15,2) NOT NULL,
    invoice_number VARCHAR(100),
    invoice_date DATE,
    supplier_tax_id VARCHAR(20),
    supplier_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Corporate Income Tax specific tables
CREATE TABLE financial_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_form_id UUID NOT NULL REFERENCES tax_forms(id) ON DELETE CASCADE,
    statement_type VARCHAR(50) NOT NULL CHECK (statement_type IN ('BALANCE_SHEET', 'INCOME_STATEMENT', 'CASH_FLOW')),
    statement_name VARCHAR(255) NOT NULL,
    statement_data JSONB NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Digital signatures table
CREATE TABLE digital_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_form_id UUID NOT NULL REFERENCES tax_forms(id) ON DELETE CASCADE,
    signed_by UUID NOT NULL REFERENCES users(id),
    signed_at TIMESTAMP NOT NULL,
    certificate_id VARCHAR(255) NOT NULL,
    signature_data TEXT NOT NULL,
    algorithm VARCHAR(50) NOT NULL,
    is_valid BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Form attachments table
CREATE TABLE form_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tax_form_id UUID NOT NULL REFERENCES tax_forms(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID NOT NULL REFERENCES users(id)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Form templates table
CREATE TABLE form_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_type VARCHAR(50) NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    template_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(form_type, version)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Sessions table for JWT token management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_tax_forms_user_id ON tax_forms(user_id);
CREATE INDEX idx_tax_forms_type ON tax_forms(type);
CREATE INDEX idx_tax_forms_status ON tax_forms(status);
CREATE INDEX idx_tax_forms_year ON tax_forms(tax_year);
CREATE INDEX idx_form_fields_section_id ON form_fields(section_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_forms_updated_at BEFORE UPDATE ON tax_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_templates_updated_at BEFORE UPDATE ON form_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample tax configuration data
INSERT INTO tax_configurations (year, type, config_data, effective_date) VALUES
(2024, 'personal_income', '{
  "tax_brackets": [
    {"min_income": 0, "max_income": 5000000, "rate": 0.05, "deduction": 0},
    {"min_income": 5000000, "max_income": 10000000, "rate": 0.10, "deduction": 250000},
    {"min_income": 10000000, "max_income": 18000000, "rate": 0.15, "deduction": 750000},
    {"min_income": 18000000, "max_income": 32000000, "rate": 0.20, "deduction": 1650000},
    {"min_income": 32000000, "max_income": 52000000, "rate": 0.25, "deduction": 3250000},
    {"min_income": 52000000, "max_income": 80000000, "rate": 0.30, "deduction": 5850000},
    {"min_income": 80000000, "max_income": null, "rate": 0.35, "deduction": 9850000}
  ],
  "personal_exemption": 11000000,
  "dependent_exemption": 4400000
}', '2024-01-01'),

(2024, 'vat', '{
  "standard_rate": 0.10,
  "reduced_rate": 0.05,
  "zero_rate": 0.00,
  "exempt_categories": ["education", "healthcare", "agriculture"]
}', '2024-01-01'),

(2024, 'corporate', '{
  "standard_rate": 0.20,
  "small_business_rate": 0.17,
  "small_business_threshold": 200000000000
}', '2024-01-01');

-- Sample form templates
INSERT INTO form_templates (form_type, template_name, version, effective_date, template_data) VALUES
('TNCN_ANNUAL', 'Tờ khai thuế TNCN năm 2024', '2024.1', '2024-01-01', '{
  "sections": [
    {
      "name": "taxpayer_info",
      "title": "Thông tin người nộp thuế",
      "order": 1,
      "required": true,
      "fields": [
        {"name": "full_name", "label": "Họ và tên", "type": "TEXT", "required": true},
        {"name": "tax_id", "label": "Mã số thuế", "type": "TEXT", "required": true},
        {"name": "address", "label": "Địa chỉ", "type": "TEXTAREA", "required": true}
      ]
    },
    {
      "name": "income_details",
      "title": "Chi tiết thu nhập",
      "order": 2,
      "required": true,
      "fields": [
        {"name": "salary_income", "label": "Thu nhập từ lương", "type": "CURRENCY", "required": false},
        {"name": "business_income", "label": "Thu nhập từ kinh doanh", "type": "CURRENCY", "required": false},
        {"name": "other_income", "label": "Thu nhập khác", "type": "CURRENCY", "required": false}
      ]
    }
  ]
}'); 