export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  userId: string;
  taxId?: string;
  phoneNumber?: string;
  address?: Address;
  dateOfBirth?: Date;
  occupation?: string;
  company?: string;
  preferredLanguage: 'vi' | 'en';
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
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

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  taxId?: string;
  phoneNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: Omit<User, 'password'>;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: Partial<Address>;
  occupation?: string;
  company?: string;
  preferredLanguage?: 'vi' | 'en';
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface EnableTwoFactorRequest {
  password: string;
}

export interface VerifyTwoFactorRequest {
  token: string;
  code: string;
} 