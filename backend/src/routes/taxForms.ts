import { Router } from 'express';
import { body, param } from 'express-validator';
import { TaxFormController } from '../controllers/taxFormController';
import { authenticateToken } from '../middleware/auth';
import { requirePermission, PERMISSIONS } from '../middleware/rbac';
import { auditAuthOperation } from '../middleware/auditLog';
import { Pool } from 'pg';

// This would be injected from the main app
let pool: Pool;

export const createTaxFormRoutes = (dbPool: Pool): Router => {
  pool = dbPool;
  const router = Router();
  const taxFormController = new TaxFormController(pool);

  // @route   POST /api/tax-forms
  // @desc    Create new tax form
  // @access  Private
  router.post('/', [
    authenticateToken,
    requirePermission(PERMISSIONS.TAX_FORM_WRITE),
    body('type').isIn(['TNCN_ANNUAL', 'TNCN_MONTHLY', 'GTGT_MONTHLY', 'GTGT_QUARTERLY', 'TNDN_QUARTERLY', 'TNDN_ANNUAL']).withMessage('Invalid tax form type'),
    body('taxYear').isInt({ min: 2020, max: 2030 }).withMessage('Invalid tax year'),
    body('taxPeriodType').isIn(['MONTHLY', 'QUARTERLY', 'ANNUAL']).withMessage('Invalid period type'),
    body('periodStartDate').isISO8601().withMessage('Invalid start date'),
    body('periodEndDate').isISO8601().withMessage('Invalid end date'),
    auditAuthOperation('CREATE_TAX_FORM')
  ], taxFormController.createTaxForm);

  // @route   GET /api/tax-forms
  // @desc    Get user's tax forms
  // @access  Private
  router.get('/', [
    authenticateToken,
    requirePermission(PERMISSIONS.TAX_FORM_READ),
    auditAuthOperation('GET_TAX_FORMS')
  ], taxFormController.getUserTaxForms);

  // @route   GET /api/tax-forms/templates
  // @desc    Get form templates
  // @access  Private
  router.get('/templates', [
    authenticateToken,
    requirePermission(PERMISSIONS.TAX_FORM_READ),
    auditAuthOperation('GET_FORM_TEMPLATES')
  ], taxFormController.getFormTemplates);

  // @route   GET /api/tax-forms/:id
  // @desc    Get tax form by ID
  // @access  Private
  router.get('/:id', [
    authenticateToken,
    requirePermission(PERMISSIONS.TAX_FORM_READ),
    param('id').isUUID().withMessage('Invalid form ID'),
    auditAuthOperation('GET_TAX_FORM')
  ], taxFormController.getTaxForm);

  // @route   PUT /api/tax-forms/:id
  // @desc    Update tax form
  // @access  Private
  router.put('/:id', [
    authenticateToken,
    requirePermission(PERMISSIONS.TAX_FORM_WRITE),
    param('id').isUUID().withMessage('Invalid form ID'),
    body('status').optional().isIn(['DRAFT', 'COMPLETED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED']).withMessage('Invalid status'),
    auditAuthOperation('UPDATE_TAX_FORM')
  ], taxFormController.updateTaxForm);

  // @route   POST /api/tax-forms/:id/submit
  // @desc    Submit tax form
  // @access  Private
  router.post('/:id/submit', [
    authenticateToken,
    requirePermission(PERMISSIONS.TAX_FORM_SUBMIT),
    param('id').isUUID().withMessage('Invalid form ID'),
    auditAuthOperation('SUBMIT_TAX_FORM')
  ], taxFormController.submitTaxForm);

  return router;
};

export default createTaxFormRoutes; 