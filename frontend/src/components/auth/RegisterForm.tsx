import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Business,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterRequest, UserRole } from '../../types/user';

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
}

const RegisterForm = ({ onSwitchToLogin }: RegisterFormProps) => {
  const { register, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: UserRole.INDIVIDUAL,
    taxId: '',
    phoneNumber: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof RegisterRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Clear auth error
    if (error) {
      clearError();
    }
  };

  const handleSelectChange = (event: any) => {
    const value = event.target.value as UserRole;
    setFormData(prev => ({ ...prev, role: value }));
    
    if (validationErrors.role) {
      setValidationErrors(prev => ({ ...prev, role: '' }));
    }
    
    if (error) {
      clearError();
    }
  };

  const handleConfirmPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(event.target.value);
    
    if (validationErrors.confirmPassword) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
    
    if (error) {
      clearError();
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'Họ là bắt buộc';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Tên là bắt buộc';
    }

    if (!formData.email) {
      errors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      errors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (formData.password !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (formData.role === UserRole.BUSINESS && !formData.taxId?.trim()) {
      errors.taxId = 'Mã số thuế là bắt buộc cho doanh nghiệp';
    }

    if (formData.phoneNumber && !/^[0-9+\-\s()]+$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Số điện thoại không hợp lệ';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await register(formData);
      // Success message will be shown by auth context
    } catch (error) {
      // Error is handled by auth context
      console.error('Registration failed:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case UserRole.INDIVIDUAL:
        return 'Cá nhân';
      case UserRole.BUSINESS:
        return 'Doanh nghiệp';
      case UserRole.CONSULTANT:
        return 'Tư vấn viên';
      default:
        return role;
    }
  };

  return (
    <Card sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Đăng ký
        </Typography>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Tạo tài khoản mới cho hệ thống kê khai thuế
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Họ"
              value={formData.firstName}
              onChange={handleInputChange('firstName')}
              error={!!validationErrors.firstName}
              helperText={validationErrors.firstName}
              required
              autoComplete="given-name"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Tên"
              value={formData.lastName}
              onChange={handleInputChange('lastName')}
              error={!!validationErrors.lastName}
              helperText={validationErrors.lastName}
              required
              autoComplete="family-name"
            />
          </Box>

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={!!validationErrors.email}
            helperText={validationErrors.email}
            margin="normal"
            required
            autoComplete="email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Loại tài khoản</InputLabel>
            <Select
              value={formData.role}
              onChange={handleSelectChange}
              label="Loại tài khoản"
              startAdornment={
                <InputAdornment position="start">
                  <Business color="action" />
                </InputAdornment>
              }
            >
              <MenuItem value={UserRole.INDIVIDUAL}>
                {getRoleLabel(UserRole.INDIVIDUAL)}
              </MenuItem>
              <MenuItem value={UserRole.BUSINESS}>
                {getRoleLabel(UserRole.BUSINESS)}
              </MenuItem>
              <MenuItem value={UserRole.CONSULTANT}>
                {getRoleLabel(UserRole.CONSULTANT)}
              </MenuItem>
            </Select>
          </FormControl>

          {formData.role === UserRole.BUSINESS && (
            <TextField
              fullWidth
              label="Mã số thuế"
              value={formData.taxId || ''}
              onChange={handleInputChange('taxId')}
              error={!!validationErrors.taxId}
              helperText={validationErrors.taxId}
              margin="normal"
              required
              placeholder="VD: 0123456789"
            />
          )}

          <TextField
            fullWidth
            label="Số điện thoại (tùy chọn)"
            value={formData.phoneNumber || ''}
            onChange={handleInputChange('phoneNumber')}
            error={!!validationErrors.phoneNumber}
            helperText={validationErrors.phoneNumber}
            margin="normal"
            autoComplete="tel"
            placeholder="VD: 0901234567"
          />

          <TextField
            fullWidth
            label="Mật khẩu"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleInputChange('password')}
            error={!!validationErrors.password}
            helperText={validationErrors.password}
            margin="normal"
            required
            autoComplete="new-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={togglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Xác nhận mật khẩu"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            error={!!validationErrors.confirmPassword}
            helperText={validationErrors.confirmPassword}
            margin="normal"
            required
            autoComplete="new-password"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={toggleConfirmPasswordVisibility}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Đăng ký'
            )}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Đã có tài khoản?{' '}
              <Link
                component="button"
                onClick={(e) => {
                  e.preventDefault();
                  onSwitchToLogin?.();
                }}
              >
                Đăng nhập ngay
              </Link>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RegisterForm; 