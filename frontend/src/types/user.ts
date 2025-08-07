export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  userId: string;
  taxId?: string;
  phoneNumber?: string;
  address?: Address;
  dateOfBirth?: string;
  occupation?: string;
  company?: string;
  preferredLanguage: 'vi' | 'en';
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  ward: string;
  district: string;
  city: string;
  province: string;
  postalCode?: string;
  country: string;
}

export enum UserRole {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business',
  CONSULTANT = 'consultant',
  ADMIN = 'admin'
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  taxId?: string;
  phoneNumber?: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    message: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  data: {
    user: User;
    message: string;
    emailVerificationToken: string;
  };
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;
} 