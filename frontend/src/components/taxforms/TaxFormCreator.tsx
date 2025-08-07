import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TaxFormType, TaxPeriodType } from '../../types/taxForm';
import apiService from '../../services/api';

interface TaxFormCreatorProps {
  open: boolean;
  onClose: () => void;
  onFormCreated: (form: any) => void;
}

interface FormData {
  type: TaxFormType;
  taxYear: number;
  taxPeriodType: TaxPeriodType;
  taxMonth?: number;
  taxQuarter?: number;
  periodStartDate: Date | null;
  periodEndDate: Date | null;
  notes: string;
}

const TaxFormCreator: React.FC<TaxFormCreatorProps> = ({
  open,
  onClose,
  onFormCreated,
}) => {
  const [formData, setFormData] = useState<FormData>({
    type: TaxFormType.TNCN_ANNUAL,
    taxYear: new Date().getFullYear(),
    taxPeriodType: TaxPeriodType.ANNUAL,
    periodStartDate: null,
    periodEndDate: null,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof FormData) => (event: any) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-set period dates based on selection
    if (field === 'taxYear' || field === 'taxPeriodType' || field === 'taxMonth' || field === 'taxQuarter') {
      updatePeriodDates({ ...formData, [field]: value });
    }
  };

  const updatePeriodDates = (data: FormData) => {
    const year = data.taxYear;
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (data.taxPeriodType) {
      case TaxPeriodType.ANNUAL:
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
        break;
      case TaxPeriodType.QUARTERLY:
        if (data.taxQuarter) {
          const quarterStart = (data.taxQuarter - 1) * 3;
          startDate = new Date(year, quarterStart, 1);
          endDate = new Date(year, quarterStart + 3, 0);
        }
        break;
      case TaxPeriodType.MONTHLY:
        if (data.taxMonth) {
          startDate = new Date(year, data.taxMonth - 1, 1);
          endDate = new Date(year, data.taxMonth, 0);
        }
        break;
    }

    setFormData(prev => ({
      ...prev,
      periodStartDate: startDate,
      periodEndDate: endDate,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.periodStartDate || !formData.periodEndDate) {
        setError('Vui lòng chọn ngày bắt đầu và kết thúc');
        return;
      }

      const submitData = {
        type: formData.type,
        taxYear: formData.taxYear,
        taxPeriodType: formData.taxPeriodType,
        taxMonth: formData.taxMonth,
        taxQuarter: formData.taxQuarter,
        periodStartDate: formData.periodStartDate.toISOString().split('T')[0],
        periodEndDate: formData.periodEndDate.toISOString().split('T')[0],
        notes: formData.notes,
      };

      const response = await apiService.createTaxForm(submitData);
      onFormCreated(response);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Có lỗi xảy ra khi tạo tờ khai');
    } finally {
      setLoading(false);
    }
  };

  const getFormTypeLabel = (type: TaxFormType): string => {
    switch (type) {
      case TaxFormType.TNCN_ANNUAL:
        return 'Thuế TNCN - Năm';
      case TaxFormType.TNCN_MONTHLY:
        return 'Thuế TNCN - Tháng';
      case TaxFormType.GTGT_MONTHLY:
        return 'Thuế GTGT - Tháng';
      case TaxFormType.GTGT_QUARTERLY:
        return 'Thuế GTGT - Quý';
      case TaxFormType.TNDN_QUARTERLY:
        return 'Thuế TNDN - Quý';
      case TaxFormType.TNDN_ANNUAL:
        return 'Thuế TNDN - Năm';
      default:
        return type;
    }
  };

  const getPeriodTypeLabel = (type: TaxPeriodType): string => {
    switch (type) {
      case TaxPeriodType.MONTHLY:
        return 'Hàng tháng';
      case TaxPeriodType.QUARTERLY:
        return 'Hàng quý';
      case TaxPeriodType.ANNUAL:
        return 'Hàng năm';
      default:
        return type;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5">Tạo tờ khai thuế mới</Typography>
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={3} sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Loại tờ khai</InputLabel>
                <Select
                  value={formData.type}
                  onChange={handleInputChange('type')}
                  label="Loại tờ khai"
                >
                  <MenuItem value={TaxFormType.TNCN_ANNUAL}>
                    {getFormTypeLabel(TaxFormType.TNCN_ANNUAL)}
                  </MenuItem>
                  <MenuItem value={TaxFormType.TNCN_MONTHLY}>
                    {getFormTypeLabel(TaxFormType.TNCN_MONTHLY)}
                  </MenuItem>
                  <MenuItem value={TaxFormType.GTGT_MONTHLY}>
                    {getFormTypeLabel(TaxFormType.GTGT_MONTHLY)}
                  </MenuItem>
                  <MenuItem value={TaxFormType.GTGT_QUARTERLY}>
                    {getFormTypeLabel(TaxFormType.GTGT_QUARTERLY)}
                  </MenuItem>
                  <MenuItem value={TaxFormType.TNDN_QUARTERLY}>
                    {getFormTypeLabel(TaxFormType.TNDN_QUARTERLY)}
                  </MenuItem>
                  <MenuItem value={TaxFormType.TNDN_ANNUAL}>
                    {getFormTypeLabel(TaxFormType.TNDN_ANNUAL)}
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                required
                label="Năm thuế"
                type="number"
                value={formData.taxYear}
                onChange={handleInputChange('taxYear')}
                inputProps={{ min: 2020, max: 2030 }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Kỳ thuế</InputLabel>
                <Select
                  value={formData.taxPeriodType}
                  onChange={handleInputChange('taxPeriodType')}
                  label="Kỳ thuế"
                >
                  <MenuItem value={TaxPeriodType.MONTHLY}>
                    {getPeriodTypeLabel(TaxPeriodType.MONTHLY)}
                  </MenuItem>
                  <MenuItem value={TaxPeriodType.QUARTERLY}>
                    {getPeriodTypeLabel(TaxPeriodType.QUARTERLY)}
                  </MenuItem>
                  <MenuItem value={TaxPeriodType.ANNUAL}>
                    {getPeriodTypeLabel(TaxPeriodType.ANNUAL)}
                  </MenuItem>
                </Select>
              </FormControl>

              {formData.taxPeriodType === TaxPeriodType.MONTHLY && (
                <FormControl fullWidth required>
                  <InputLabel>Tháng</InputLabel>
                  <Select
                    value={formData.taxMonth || ''}
                    onChange={handleInputChange('taxMonth')}
                    label="Tháng"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>
                        Tháng {i + 1}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {formData.taxPeriodType === TaxPeriodType.QUARTERLY && (
                <FormControl fullWidth required>
                  <InputLabel>Quý</InputLabel>
                  <Select
                    value={formData.taxQuarter || ''}
                    onChange={handleInputChange('taxQuarter')}
                    label="Quý"
                  >
                    {Array.from({ length: 4 }, (_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>
                        Quý {i + 1}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <DatePicker
                label="Ngày bắt đầu"
                value={formData.periodStartDate}
                onChange={(date) => setFormData(prev => ({ ...prev, periodStartDate: date }))}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />

              <DatePicker
                label="Ngày kết thúc"
                value={formData.periodEndDate}
                onChange={(date) => setFormData(prev => ({ ...prev, periodEndDate: date }))}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Ghi chú (tùy chọn)"
              value={formData.notes}
              onChange={handleInputChange('notes')}
              placeholder="Nhập ghi chú về tờ khai này..."
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Đang tạo...' : 'Tạo tờ khai'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default TaxFormCreator; 