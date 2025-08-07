// Backend Tax Form Types

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

export enum CalculationType {
  INCOME_TAX = 'INCOME_TAX',
  VAT = 'VAT',
  CORPORATE_TAX = 'CORPORATE_TAX',
  WITHHOLDING_TAX = 'WITHHOLDING_TAX',
  OTHER = 'OTHER',
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

export enum DeductionType {
  PERSONAL = 'PERSONAL',
  DEPENDENT = 'DEPENDENT',
  INSURANCE = 'INSURANCE',
  CHARITY = 'CHARITY',
  EDUCATION = 'EDUCATION',
  MEDICAL = 'MEDICAL',
  OTHER = 'OTHER',
} 