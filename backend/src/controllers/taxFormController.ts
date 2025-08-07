import { Request, Response } from 'express';
import { TaxFormModel, TaxFormData } from '../models/TaxForm';
import { TaxFormType, FormStatus, TaxPeriodType } from '../types/taxForm';
import { validationResult } from 'express-validator';
import { Pool } from 'pg';

export class TaxFormController {
  private taxFormModel: TaxFormModel;

  constructor(pool: Pool) {
    this.taxFormModel = new TaxFormModel(pool);
  }

  // Create new tax form
  createTaxForm = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
        return;
      }

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const {
        type,
        taxYear,
        taxPeriodType,
        taxMonth,
        taxQuarter,
        periodStartDate,
        periodEndDate,
        notes
      } = req.body;

      const formData: TaxFormData = {
        userId,
        type,
        status: FormStatus.DRAFT,
        taxYear,
        taxPeriodType,
        taxMonth,
        taxQuarter,
        periodStartDate,
        periodEndDate,
        totalTaxAmount: 0,
        totalPayableAmount: 0,
        notes,
        version: 1
      };

      const newForm = await this.taxFormModel.create(formData);

      res.status(201).json({
        success: true,
        data: { form: newForm },
        message: 'Tax form created successfully'
      });
    } catch (error) {
      console.error('Error creating tax form:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create tax form'
        }
      });
    }
  };

  // Get tax form by ID
  getTaxForm = async (req: Request, res: Response): Promise<void> => {
    try {
      const formId = req.params.id;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      if (!formId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Form ID is required'
          }
        });
        return;
      }

      const form = await this.taxFormModel.getCompleteForm(formId);

      if (!form) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Tax form not found'
          }
        });
        return;
      }

      // Check if user owns the form or is admin
      if (form.userId !== userId && req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: { form }
      });
    } catch (error) {
      console.error('Error getting tax form:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get tax form'
        }
      });
    }
  };

  // Get user's tax forms
  getUserTaxForms = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const pageParam = req.query['page'] as string;
      const limitParam = req.query['limit'] as string;
      
      const page = parseInt(pageParam || '1') || 1;
      const limit = parseInt(limitParam || '20') || 20;
      const offset = (page - 1) * limit;

      const forms = await this.taxFormModel.findByUserId(userId, limit, offset);

      res.json({
        success: true,
        data: {
          forms,
          pagination: { page, limit, total: forms.length }
        }
      });
    } catch (error) {
      console.error('Error getting user tax forms:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get tax forms'
        }
      });
    }
  };

  // Update tax form
  updateTaxForm = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
        return;
      }

      const formId = req.params.id;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      if (!formId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Form ID is required'
          }
        });
        return;
      }

      const existingForm = await this.taxFormModel.findById(formId);
      if (!existingForm) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Tax form not found'
          }
        });
        return;
      }

      if (existingForm.userId !== userId && req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
        return;
      }

      if (existingForm.status === FormStatus.SUBMITTED && req.user?.role !== 'admin') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Cannot update submitted form'
          }
        });
        return;
      }

      const updates = req.body;
      const updatedForm = await this.taxFormModel.update(formId, updates);

      res.json({
        success: true,
        data: { form: updatedForm },
        message: 'Tax form updated successfully'
      });
    } catch (error) {
      console.error('Error updating tax form:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update tax form'
        }
      });
    }
  };

  // Submit tax form
  submitTaxForm = async (req: Request, res: Response): Promise<void> => {
    try {
      const formId = req.params.id;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      if (!formId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Form ID is required'
          }
        });
        return;
      }

      const existingForm = await this.taxFormModel.findById(formId);
      if (!existingForm) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Tax form not found'
          }
        });
        return;
      }

      if (existingForm.userId !== userId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied'
          }
        });
        return;
      }

      if (existingForm.status !== FormStatus.DRAFT && existingForm.status !== FormStatus.COMPLETED) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Form must be in draft or completed status to submit'
          }
        });
        return;
      }

      const updatedForm = await this.taxFormModel.update(formId, {
        status: FormStatus.SUBMITTED,
        submissionDate: new Date().toISOString()
      });

      res.json({
        success: true,
        data: {
          form: updatedForm,
          submissionId: formId,
          receiptNumber: `TAX-${Date.now()}`,
          submissionDate: new Date().toISOString()
        },
        message: 'Tax form submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting tax form:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to submit tax form'
        }
      });
    }
  };

  // Get form templates
  getFormTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
      const typeParam = req.query.type as string;

      const templates = [
        {
          id: '1',
          type: 'TNCN_ANNUAL',
          name: 'Tờ khai thuế TNCN năm 2024',
          version: '2024.1',
          effectiveDate: '2024-01-01',
          sections: [
            {
              name: 'taxpayer_info',
              title: 'Thông tin người nộp thuế',
              order: 1,
              required: true,
              fields: [
                { name: 'full_name', label: 'Họ và tên', type: 'TEXT', required: true },
                { name: 'tax_id', label: 'Mã số thuế', type: 'TEXT', required: true },
                { name: 'address', label: 'Địa chỉ', type: 'TEXTAREA', required: true }
              ]
            }
          ]
        }
      ];

      const filteredTemplates = typeParam ? templates.filter(t => t.type === typeParam) : templates;

      res.json({
        success: true,
        data: { templates: filteredTemplates }
      });
    } catch (error) {
      console.error('Error getting form templates:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get form templates'
        }
      });
    }
  };
} 