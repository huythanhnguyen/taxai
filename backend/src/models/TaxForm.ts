import { Pool } from 'pg';
import { TaxFormType, FormStatus, TaxPeriodType } from '../types/taxForm';

export interface TaxFormData {
  id?: string;
  userId: string;
  type: TaxFormType;
  status: FormStatus;
  taxYear: number;
  taxPeriodType: TaxPeriodType;
  taxMonth?: number;
  taxQuarter?: number;
  periodStartDate: string;
  periodEndDate: string;
  totalTaxAmount: number;
  totalPayableAmount: number;
  submissionDate?: string;
  approvalDate?: string;
  rejectionReason?: string;
  notes?: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaxpayerInfoData {
  id?: string;
  taxFormId: string;
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

export interface FormSectionData {
  id?: string;
  taxFormId: string;
  sectionName: string;
  sectionTitle: string;
  sectionOrder: number;
  isRequired: boolean;
  isVisible: boolean;
}

export interface FormFieldData {
  id?: string;
  sectionId: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  fieldValue?: string;
  defaultValue?: string;
  isRequired: boolean;
  isReadonly: boolean;
  isCalculated: boolean;
  validationRules?: any;
  fieldOptions?: any;
  formatPattern?: string;
  description?: string;
  helpText?: string;
  fieldOrder: number;
}

export class TaxFormModel {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Create new tax form
  async create(formData: TaxFormData): Promise<TaxFormData> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO tax_forms (
          user_id, type, status, tax_year, tax_period_type, tax_month, tax_quarter,
          period_start_date, period_end_date, total_tax_amount, total_payable_amount,
          notes, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const values = [
        formData.userId,
        formData.type,
        formData.status,
        formData.taxYear,
        formData.taxPeriodType,
        formData.taxMonth,
        formData.taxQuarter,
        formData.periodStartDate,
        formData.periodEndDate,
        formData.totalTaxAmount,
        formData.totalPayableAmount,
        formData.notes,
        formData.version
      ];

      const result = await client.query(query, values);
      await client.query('COMMIT');

      return this.mapRowToTaxForm(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get tax form by ID
  async findById(id: string): Promise<TaxFormData | null> {
    const query = 'SELECT * FROM tax_forms WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTaxForm(result.rows[0]);
  }

  // Get tax forms by user ID
  async findByUserId(userId: string, limit = 20, offset = 0): Promise<TaxFormData[]> {
    const query = `
      SELECT * FROM tax_forms 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await this.pool.query(query, [userId, limit, offset]);
    
    return result.rows.map(row => this.mapRowToTaxForm(row));
  }

  // Update tax form
  async update(id: string, updates: Partial<TaxFormData>): Promise<TaxFormData | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const setClause = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          setClause.push(`${this.camelToSnake(key)} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (setClause.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const query = `
        UPDATE tax_forms 
        SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      values.push(id);

      const result = await client.query(query, values);
      await client.query('COMMIT');

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToTaxForm(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete tax form
  async delete(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const query = 'DELETE FROM tax_forms WHERE id = $1';
      const result = await client.query(query, [id]);

      await client.query('COMMIT');
      return result.rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Create taxpayer info
  async createTaxpayerInfo(taxpayerData: TaxpayerInfoData): Promise<TaxpayerInfoData> {
    const query = `
      INSERT INTO taxpayer_info (
        tax_form_id, tax_id, name, address, phone_number, email,
        business_type, registration_date, tax_office, tax_officer_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      taxpayerData.taxFormId,
      taxpayerData.taxId,
      taxpayerData.name,
      taxpayerData.address,
      taxpayerData.phoneNumber,
      taxpayerData.email,
      taxpayerData.businessType,
      taxpayerData.registrationDate,
      taxpayerData.taxOffice,
      taxpayerData.taxOfficerName
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToTaxpayerInfo(result.rows[0]);
  }

  // Get taxpayer info by form ID
  async getTaxpayerInfo(taxFormId: string): Promise<TaxpayerInfoData | null> {
    const query = 'SELECT * FROM taxpayer_info WHERE tax_form_id = $1';
    const result = await this.pool.query(query, [taxFormId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTaxpayerInfo(result.rows[0]);
  }

  // Create form section
  async createSection(sectionData: FormSectionData): Promise<FormSectionData> {
    const query = `
      INSERT INTO form_sections (
        tax_form_id, section_name, section_title, section_order, is_required, is_visible
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      sectionData.taxFormId,
      sectionData.sectionName,
      sectionData.sectionTitle,
      sectionData.sectionOrder,
      sectionData.isRequired,
      sectionData.isVisible
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToFormSection(result.rows[0]);
  }

  // Get form sections
  async getSections(taxFormId: string): Promise<FormSectionData[]> {
    const query = `
      SELECT * FROM form_sections 
      WHERE tax_form_id = $1 
      ORDER BY section_order
    `;
    const result = await this.pool.query(query, [taxFormId]);
    
    return result.rows.map(row => this.mapRowToFormSection(row));
  }

  // Create form field
  async createField(fieldData: FormFieldData): Promise<FormFieldData> {
    const query = `
      INSERT INTO form_fields (
        section_id, field_name, field_label, field_type, field_value, default_value,
        is_required, is_readonly, is_calculated, validation_rules, field_options,
        format_pattern, description, help_text, field_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      fieldData.sectionId,
      fieldData.fieldName,
      fieldData.fieldLabel,
      fieldData.fieldType,
      fieldData.fieldValue,
      fieldData.defaultValue,
      fieldData.isRequired,
      fieldData.isReadonly,
      fieldData.isCalculated,
      JSON.stringify(fieldData.validationRules),
      JSON.stringify(fieldData.fieldOptions),
      fieldData.formatPattern,
      fieldData.description,
      fieldData.helpText,
      fieldData.fieldOrder
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToFormField(result.rows[0]);
  }

  // Get form fields by section
  async getFields(sectionId: string): Promise<FormFieldData[]> {
    const query = `
      SELECT * FROM form_fields 
      WHERE section_id = $1 
      ORDER BY field_order
    `;
    const result = await this.pool.query(query, [sectionId]);
    
    return result.rows.map(row => this.mapRowToFormField(row));
  }

  // Update form field value
  async updateFieldValue(fieldId: string, value: string): Promise<FormFieldData | null> {
    const query = `
      UPDATE form_fields 
      SET field_value = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await this.pool.query(query, [value, fieldId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToFormField(result.rows[0]);
  }

  // Get complete tax form with all related data
  async getCompleteForm(id: string): Promise<any> {
    const client = await this.pool.connect();
    try {
      // Get main form data
      const formResult = await client.query('SELECT * FROM tax_forms WHERE id = $1', [id]);
      if (formResult.rows.length === 0) {
        return null;
      }

      const form = this.mapRowToTaxForm(formResult.rows[0]);

      // Get taxpayer info
      const taxpayerResult = await client.query('SELECT * FROM taxpayer_info WHERE tax_form_id = $1', [id]);
      const taxpayerInfo = taxpayerResult.rows.length > 0 ? this.mapRowToTaxpayerInfo(taxpayerResult.rows[0]) : null;

      // Get sections with fields
      const sectionsResult = await client.query(`
        SELECT s.*, f.* FROM form_sections s
        LEFT JOIN form_fields f ON s.id = f.section_id
        WHERE s.tax_form_id = $1
        ORDER BY s.section_order, f.field_order
      `, [id]);

      const sectionsMap = new Map();
      sectionsResult.rows.forEach(row => {
        const sectionId = row.id;
        if (!sectionsMap.has(sectionId)) {
          sectionsMap.set(sectionId, {
            id: row.id,
            taxFormId: row.tax_form_id,
            sectionName: row.section_name,
            sectionTitle: row.section_title,
            sectionOrder: row.section_order,
            isRequired: row.is_required,
            isVisible: row.is_visible,
            fields: []
          });
        }

        if (row.field_name) {
          sectionsMap.get(sectionId).fields.push(this.mapRowToFormField(row));
        }
      });

      const sections = Array.from(sectionsMap.values());

      return {
        ...form,
        taxpayerInfo,
        sections
      };
    } finally {
      client.release();
    }
  }

  // Helper methods
  private mapRowToTaxForm(row: any): TaxFormData {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      status: row.status,
      taxYear: row.tax_year,
      taxPeriodType: row.tax_period_type,
      taxMonth: row.tax_month,
      taxQuarter: row.tax_quarter,
      periodStartDate: row.period_start_date,
      periodEndDate: row.period_end_date,
      totalTaxAmount: parseFloat(row.total_tax_amount),
      totalPayableAmount: parseFloat(row.total_payable_amount),
      submissionDate: row.submission_date,
      approvalDate: row.approval_date,
      rejectionReason: row.rejection_reason,
      notes: row.notes,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToTaxpayerInfo(row: any): TaxpayerInfoData {
    return {
      id: row.id,
      taxFormId: row.tax_form_id,
      taxId: row.tax_id,
      name: row.name,
      address: row.address,
      phoneNumber: row.phone_number,
      email: row.email,
      businessType: row.business_type,
      registrationDate: row.registration_date,
      taxOffice: row.tax_office,
      taxOfficerName: row.tax_officer_name
    };
  }

  private mapRowToFormSection(row: any): FormSectionData {
    return {
      id: row.id,
      taxFormId: row.tax_form_id,
      sectionName: row.section_name,
      sectionTitle: row.section_title,
      sectionOrder: row.section_order,
      isRequired: row.is_required,
      isVisible: row.is_visible
    };
  }

  private mapRowToFormField(row: any): FormFieldData {
    return {
      id: row.id,
      sectionId: row.section_id,
      fieldName: row.field_name,
      fieldLabel: row.field_label,
      fieldType: row.field_type,
      fieldValue: row.field_value,
      defaultValue: row.default_value,
      isRequired: row.is_required,
      isReadonly: row.is_readonly,
      isCalculated: row.is_calculated,
      validationRules: row.validation_rules,
      fieldOptions: row.field_options,
      formatPattern: row.format_pattern,
      description: row.description,
      helpText: row.help_text,
      fieldOrder: row.field_order
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
} 