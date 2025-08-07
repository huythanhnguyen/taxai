import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Pagination,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { TaxFormType, FormStatus } from '../../types/taxForm';
import apiService from '../../services/api';
import TaxFormCreator from './TaxFormCreator';

interface TaxForm {
  id: string;
  type: TaxFormType;
  status: FormStatus;
  taxYear: number;
  periodStartDate: string;
  periodEndDate: string;
  totalTaxAmount: number;
  totalPayableAmount: number;
  submissionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const TaxFormList: React.FC = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<TaxForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreator, setShowCreator] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedForm, setSelectedForm] = useState<TaxForm | null>(null);

  useEffect(() => {
    loadTaxForms();
  }, [page]);

  const loadTaxForms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getTaxForms(page, 10);
      setForms(response.forms || []);
      setTotalPages(Math.ceil((response.pagination?.total || 0) / 10));
    } catch (error: any) {
      setError(error.message || 'Không thể tải danh sách tờ khai');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, form: TaxForm) => {
    setAnchorEl(event.currentTarget);
    setSelectedForm(form);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedForm(null);
  };

  const handleFormCreated = (newForm: TaxForm) => {
    setForms(prev => [newForm, ...prev]);
    setShowCreator(false);
  };

  const handleSubmitForm = async (form: TaxForm) => {
    try {
      await apiService.submitTaxForm(form.id);
      await loadTaxForms(); // Reload to get updated status
      handleMenuClose();
    } catch (error: any) {
      setError(error.message || 'Không thể nộp tờ khai');
    }
  };

  const handleDeleteForm = async (form: TaxForm) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tờ khai này?')) {
      try {
        await apiService.deleteTaxForm(form.id);
        await loadTaxForms(); // Reload list
        handleMenuClose();
      } catch (error: any) {
        setError(error.message || 'Không thể xóa tờ khai');
      }
    }
  };

  const getStatusColor = (status: FormStatus): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case FormStatus.DRAFT:
        return 'default';
      case FormStatus.COMPLETED:
        return 'info';
      case FormStatus.SUBMITTED:
        return 'primary';
      case FormStatus.APPROVED:
        return 'success';
      case FormStatus.REJECTED:
        return 'error';
      case FormStatus.CANCELLED:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: FormStatus): string => {
    switch (status) {
      case FormStatus.DRAFT:
        return 'Bản nháp';
      case FormStatus.COMPLETED:
        return 'Hoàn thành';
      case FormStatus.SUBMITTED:
        return 'Đã nộp';
      case FormStatus.APPROVED:
        return 'Đã duyệt';
      case FormStatus.REJECTED:
        return 'Bị từ chối';
      case FormStatus.CANCELLED:
        return 'Đã hủy';
      default:
        return status;
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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading && forms.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tờ khai thuế
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreator(true)}
        >
          Tạo tờ khai mới
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {forms.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Chưa có tờ khai thuế nào
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Tạo tờ khai thuế đầu tiên của bạn để bắt đầu
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreator(true)}
            >
              Tạo tờ khai mới
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {forms.map((form) => (
            <Card key={form.id} sx={{ position: 'relative' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography variant="h6">
                        {getFormTypeLabel(form.type)}
                      </Typography>
                      <Chip
                        label={getStatusLabel(form.status)}
                        color={getStatusColor(form.status)}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Năm thuế: {form.taxYear} | Kỳ: {formatDate(form.periodStartDate)} - {formatDate(form.periodEndDate)}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 4, mt: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Số thuế phải nộp
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(form.totalPayableAmount)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Tạo lúc
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(form.createdAt)}
                        </Typography>
                      </Box>
                      {form.submissionDate && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Nộp lúc
                          </Typography>
                          <Typography variant="body2">
                            {formatDate(form.submissionDate)}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {form.notes && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Ghi chú: {form.notes}
                      </Typography>
                    )}
                  </Box>

                  <IconButton
                    onClick={(e) => handleMenuOpen(e, form)}
                    size="small"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </Stack>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <ViewIcon sx={{ mr: 1 }} />
          Xem chi tiết
        </MenuItem>
        {selectedForm?.status === FormStatus.DRAFT && (
          <MenuItem onClick={handleMenuClose}>
            <EditIcon sx={{ mr: 1 }} />
            Chỉnh sửa
          </MenuItem>
        )}
        {(selectedForm?.status === FormStatus.DRAFT || selectedForm?.status === FormStatus.COMPLETED) && (
          <MenuItem onClick={() => selectedForm && handleSubmitForm(selectedForm)}>
            <SendIcon sx={{ mr: 1 }} />
            Nộp tờ khai
          </MenuItem>
        )}
        {selectedForm?.status === FormStatus.DRAFT && (
          <MenuItem 
            onClick={() => selectedForm && handleDeleteForm(selectedForm)}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} />
            Xóa
          </MenuItem>
        )}
      </Menu>

      {/* Tax Form Creator Dialog */}
      <TaxFormCreator
        open={showCreator}
        onClose={() => setShowCreator(false)}
        onFormCreated={handleFormCreated}
      />

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
        onClick={() => setShowCreator(true)}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default TaxFormList; 