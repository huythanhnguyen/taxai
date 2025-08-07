import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  AccountCircle,
  ExitToApp,
  Description,
  Settings,
} from '@mui/icons-material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import TaxFormList from './components/taxforms/TaxFormList';
import './App.css';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Auth pages component
const AuthPages: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { error, clearError } = useAuth();

  const handleSwitchToRegister = () => {
    setIsLogin(false);
    clearError();
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
    clearError();
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password
    console.log('Forgot password clicked');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          🏛️ Tax PWA
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Hệ thống Kê khai Thuế PWA
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Phiên bản hiện đại của HTKK với công nghệ web tiên tiến
        </Typography>
      </Box>

      {isLogin ? (
        <LoginForm
          onSwitchToRegister={handleSwitchToRegister}
          onForgotPassword={handleForgotPassword}
        />
      ) : (
        <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
      )}
    </Container>
  );
};

// Main dashboard component
const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleClose();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleCreateTaxForm = (formType: string) => {
    setNotification(`Tạo tờ khai ${formType} - Tính năng đang phát triển`);
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Tax PWA - Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">
              Xin chào, {user?.firstName} {user?.lastName}
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.firstName?.charAt(0)}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose}>
                <AccountCircle sx={{ mr: 1 }} />
                Thông tin cá nhân
              </MenuItem>
              <MenuItem onClick={handleClose}>
                <Settings sx={{ mr: 1 }} />
                Cài đặt
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ExitToApp sx={{ mr: 1 }} />
                Đăng xuất
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Bảng điều khiển
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Chào mừng bạn đến với hệ thống kê khai thuế PWA! 
            Đây là phiên bản demo với các tính năng cơ bản.
          </Alert>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Tạo tờ khai thuế
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2, mt: 2 }}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Description />}
            onClick={() => handleCreateTaxForm('TNCN')}
            sx={{ p: 2, height: 80 }}
          >
            <Box>
              <Typography variant="h6">Thuế TNCN</Typography>
              <Typography variant="body2" color="text.secondary">
                Thuế thu nhập cá nhân
              </Typography>
            </Box>
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<Description />}
            onClick={() => handleCreateTaxForm('GTGT')}
            sx={{ p: 2, height: 80 }}
          >
            <Box>
              <Typography variant="h6">Thuế GTGT</Typography>
              <Typography variant="body2" color="text.secondary">
                Thuế giá trị gia tăng
              </Typography>
            </Box>
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<Description />}
            onClick={() => handleCreateTaxForm('TNDN')}
            sx={{ p: 2, height: 80 }}
          >
            <Box>
              <Typography variant="h6">Thuế TNDN</Typography>
              <Typography variant="body2" color="text.secondary">
                Thuế thu nhập doanh nghiệp
              </Typography>
            </Box>
          </Button>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Tờ khai đã lưu
        </Typography>
        
        <TaxFormList />

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Thông tin hệ thống
        </Typography>
        
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="body2">
            <strong>Phiên bản:</strong> 1.0.0 (Demo)
          </Typography>
          <Typography variant="body2">
            <strong>Loại tài khoản:</strong> {user?.role}
          </Typography>
          <Typography variant="body2">
            <strong>Trạng thái:</strong> {user?.isActive ? 'Hoạt động' : 'Không hoạt động'}
          </Typography>
          <Typography variant="body2">
            <strong>Email xác thực:</strong> {user?.isEmailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
          </Typography>
        </Box>
      </Container>

      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity="info" sx={{ width: '100%' }}>
          {notification}
        </Alert>
      </Snackbar>
    </>
  );
};

// Main App component
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h6">Đang tải...</Typography>
      </Container>
    );
  }

  return isAuthenticated ? <Dashboard /> : <AuthPages />;
};

// Root App component with providers
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
