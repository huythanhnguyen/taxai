// Tax Form Types for HTKK-equivalent system

export enum TaxFormType {
  // Personal Income Tax (Thuế Thu nhập Cá nhân)
  TNCN_ANNUAL = 'TNCN_ANNUAL',
  TNCN_MONTHLY = 'TNCN_MONTHLY',
  TNCN_QUARTERLY = 'TNCN_QUARTERLY',
  TNCN_FINALIZATION = 'TNCN_FINALIZATION',
  
  // Value Added Tax (Thuế Giá trị Gia tăng)
  GTGT_MONTHLY = 'GTGT_MONTHLY',
  GTGT_QUARTERLY = 'GTGT_QUARTERLY',
  GTGT_INVOICE_LIST = 'GTGT_INVOICE_LIST',
  
  // Corporate Income Tax (Thuế Thu nhập Doanh nghiệp)
  TNDN_QUARTERLY = 'TNDN_QUARTERLY',
  TNDN_ANNUAL = 'TNDN_ANNUAL',
  TNDN_FINALIZATION = 'TNDN_FINALIZATION',
  
  // Other taxes
  RESOURCE_TAX = 'RESOURCE_TAX',
  LICENSE_TAX = 'LICENSE_TAX',
  LAND_USE_TAX = 'LAND_USE_TAX',
  PROPERTY_TAX = 'PROPERTY_TAX',
}

export enum TaxPeriodType {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
}

export enum FormStatus {
  DRAFT = 'DRAFT',
  COMPLETED = 'COMPLETED',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface TaxPeriod {
  type: TaxPeriodType;
  year: number;
  month?: number; // 1-12 for monthly
  quarter?: number; // 1-4 for quarterly
  startDate: string;
  endDate: string;
}

export interface TaxpayerInfo {
  id: string;
  taxId: string;
  name: string;
  address: string;
  phoneNumber?: string;
  email?: string;
  businessType?: string;
  registrationDate?: string;
  taxOffice: string;
  taxOfficerName?: string;
}

export interface FormSection {
  id: string;
  name: string;
  title: string;
  order: number;
  fields: FormField[];
  calculations?: CalculationRule[];
  isRequired: boolean;
  isVisible: boolean;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  value: any;
  defaultValue?: any;
  isRequired: boolean;
  isReadonly: boolean;
  isCalculated: boolean;
  validation?: ValidationRule[];
  options?: FieldOption[];
  format?: string;
  description?: string;
  helpText?: string;
}

export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  CURRENCY = 'CURRENCY',
  PERCENTAGE = 'PERCENTAGE',
  DATE = 'DATE',
  SELECT = 'SELECT',
  CHECKBOX = 'CHECKBOX',
  TEXTAREA = 'TEXTAREA',
  FILE = 'FILE',
  CALCULATED = 'CALCULATED',
}

export interface FieldOption {
  value: string;
  label: string;
  description?: string;
}

export interface ValidationRule {
  type: ValidationType;
  value?: any;
  message: string;
}

export enum ValidationType {
  REQUIRED = 'REQUIRED',
  MIN = 'MIN',
  MAX = 'MAX',
  MIN_LENGTH = 'MIN_LENGTH',
  MAX_LENGTH = 'MAX_LENGTH',
  PATTERN = 'PATTERN',
  CUSTOM = 'CUSTOM',
}

export interface CalculationRule {
  id: string;
  targetField: string;
  formula: string;
  dependencies: string[];
  description?: string;
}

export interface TaxCalculation {
  id: string;
  name: string;
  type: CalculationType;
  baseAmount: number;
  taxRate: number;
  taxAmount: number;
  deductions: number;
  exemptions: number;
  finalAmount: number;
  details?: CalculationDetail[];
}

export enum CalculationType {
  INCOME_TAX = 'INCOME_TAX',
  VAT = 'VAT',
  CORPORATE_TAX = 'CORPORATE_TAX',
  WITHHOLDING_TAX = 'WITHHOLDING_TAX',
  OTHER = 'OTHER',
}

export interface CalculationDetail {
  description: string;
  amount: number;
  rate?: number;
  basis?: number;
}

export interface FormMetadata {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;
  version: number;
  submissionDate?: string;
  approvalDate?: string;
  rejectionReason?: string;
  digitalSignature?: DigitalSignature;
  attachments?: FormAttachment[];
}

export interface DigitalSignature {
  signedBy: string;
  signedAt: string;
  certificateId: string;
  signature: string;
  algorithm: string;
}

export interface FormAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  description?: string;
}

// Main Tax Form interface
export interface TaxForm {
  id: string;
  type: TaxFormType;
  period: TaxPeriod;
  taxpayerInfo: TaxpayerInfo;
  sections: FormSection[];
  calculations: TaxCalculation[];
  status: FormStatus;
  metadata: FormMetadata;
  totalTaxAmount: number;
  totalPayableAmount: number;
  notes?: string;
}

// Specific form types

// Personal Income Tax Form (TNCN)
export interface PersonalIncomeTaxForm extends TaxForm {
  type: TaxFormType.TNCN_ANNUAL | TaxFormType.TNCN_MONTHLY | TaxFormType.TNCN_QUARTERLY;
  employerInfo?: EmployerInfo;
  incomeDetails: IncomeDetail[];
  deductionDetails: DeductionDetail[];
  dependentInfo?: DependentInfo[];
}

export interface EmployerInfo {
  taxId: string;
  name: string;
  address: string;
  phoneNumber?: string;
}

export interface IncomeDetail {
  type: IncomeType;
  description: string;
  amount: number;
  taxWithheld: number;
  source: string;
  period: string;
}

export enum IncomeType {
  SALARY = 'SALARY',
  BONUS = 'BONUS',
  OVERTIME = 'OVERTIME',
  BUSINESS = 'BUSINESS',
  INVESTMENT = 'INVESTMENT',
  RENTAL = 'RENTAL',
  OTHER = 'OTHER',
}

export interface DeductionDetail {
  type: DeductionType;
  description: string;
  amount: number;
  supportingDocument?: string;
}

export enum DeductionType {
  PERSONAL = 'PERSONAL',
  DEPENDENT = 'DEPENDENT',
  INSURANCE = 'INSURANCE',
  CHARITY = 'CHARITY',
  EDUCATION = 'EDUCATION',
  MEDICAL = 'MEDICAL',
  OTHER = 'OTHER',
}

export interface DependentInfo {
  name: string;
  relationship: string;
  taxId?: string;
  birthDate: string;
  isDisabled: boolean;
  monthsSupported: number;
}

// VAT Form (GTGT)
export interface VATForm extends TaxForm {
  type: TaxFormType.GTGT_MONTHLY | TaxFormType.GTGT_QUARTERLY;
  salesDetails: VATDetail[];
  purchaseDetails: VATDetail[];
  inputVAT: number;
  outputVAT: number;
  vatPayable: number;
  vatRefund: number;
}

export interface VATDetail {
  description: string;
  amount: number;
  vatRate: number;
  vatAmount: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  supplierTaxId?: string;
  supplierName?: string;
}

// Corporate Income Tax Form (TNDN)
export interface CorporateIncomeTaxForm extends TaxForm {
  type: TaxFormType.TNDN_QUARTERLY | TaxFormType.TNDN_ANNUAL;
  revenue: number;
  expenses: number;
  taxableIncome: number;
  taxRate: number;
  taxPayable: number;
  prepaidTax: number;
  finalTaxAmount: number;
  financialStatements?: FinancialStatement[];
}

export interface FinancialStatement {
  type: StatementType;
  name: string;
  data: Record<string, number>;
  period: TaxPeriod;
}

export enum StatementType {
  BALANCE_SHEET = 'BALANCE_SHEET',
  INCOME_STATEMENT = 'INCOME_STATEMENT',
  CASH_FLOW = 'CASH_FLOW',
}

// Form submission and processing
export interface FormSubmissionRequest {
  formId: string;
  digitalSignature?: DigitalSignature;
  attachments?: string[];
  notes?: string;
}

export interface FormSubmissionResponse {
  success: boolean;
  submissionId: string;
  receiptNumber: string;
  submissionDate: string;
  estimatedProcessingTime: string;
  message: string;
}

// Form templates and configurations
export interface FormTemplate {
  id: string;
  type: TaxFormType;
  name: string;
  version: string;
  effectiveDate: string;
  sections: FormSection[];
  calculations: CalculationRule[];
  validations: ValidationRule[];
  isActive: boolean;
}

export interface TaxConfiguration {
  year: number;
  personalIncomeTaxRates: TaxBracket[];
  corporateTaxRate: number;
  vatRates: VATRate[];
  deductionLimits: DeductionLimit[];
  exemptionAmounts: ExemptionAmount[];
}

export interface TaxBracket {
  minIncome: number;
  maxIncome: number;
  rate: number;
  deduction: number;
}

export interface VATRate {
  type: string;
  rate: number;
  description: string;
}

export interface DeductionLimit {
  type: DeductionType;
  maxAmount: number;
  percentage?: number;
}

export interface ExemptionAmount {
  type: string;
  amount: number;
  description: string;
}

// API response types
export interface TaxFormListResponse {
  success: boolean;
  data: {
    forms: TaxForm[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface TaxFormResponse {
  success: boolean;
  data: {
    form: TaxForm;
  };
}

export interface FormValidationResponse {
  success: boolean;
  data: {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  suggestion?: string;
} 