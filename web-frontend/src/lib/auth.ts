import { Amplify } from 'aws-amplify';
import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
} from 'aws-amplify/auth';
import type { LoginCredentials, RegisterCredentials, User } from '@/types';

// Configure Amplify
export const configureAmplify = () => {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
        userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
        loginWith: {
          oauth: {
            domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '',
            scopes: ['openid', 'email', 'profile'],
            redirectSignIn: [process.env.NEXT_PUBLIC_REDIRECT_SIGN_IN || 'http://localhost:3000/'],
            redirectSignOut: [process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT || 'http://localhost:3000/'],
            responseType: 'code',
          },
        },
      },
    },
  });
};

// Sign in with email and password
export const handleSignIn = async ({ email, password }: LoginCredentials) => {
  try {
    const result = await signIn({
      username: email,
      password,
    });
    return { success: true, result };
  } catch (error) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
};

// Sign up new user
export const handleSignUp = async ({ email, password, name, role }: RegisterCredentials) => {
  try {
    const result = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
          'custom:role': role,
        },
      },
    });
    return { success: true, result };
  } catch (error) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
};

// Confirm sign up with verification code
export const handleConfirmSignUp = async (email: string, code: string) => {
  try {
    const result = await confirmSignUp({
      username: email,
      confirmationCode: code,
    });
    return { success: true, result };
  } catch (error) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
};

// Resend verification code
export const handleResendCode = async (email: string) => {
  try {
    await resendSignUpCode({ username: email });
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
};

// Sign out
export const handleSignOut = async () => {
  try {
    await signOut();
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
};

// Reset password request
export const handleResetPassword = async (email: string) => {
  try {
    const result = await resetPassword({ username: email });
    return { success: true, result };
  } catch (error) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
};

// Confirm reset password with code
export const handleConfirmResetPassword = async (
  email: string,
  code: string,
  newPassword: string
) => {
  try {
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
    return { success: true };
  } catch (error) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
};

// Get current authenticated user
export const getCurrentAuthUser = async (): Promise<User | null> => {
  try {
    const cognitoUser = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    const session = await fetchAuthSession();

    if (!cognitoUser || !session.tokens) {
      return null;
    }

    return {
      id: cognitoUser.userId,
      email: attributes.email || '',
      name: attributes.name || '',
      phone: attributes.phone_number,
      profileImageUrl: attributes.picture,
      role: (attributes['custom:role'] as User['role']) || 'CANDIDATE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const session = await fetchAuthSession();
    return !!session.tokens?.accessToken;
  } catch {
    return false;
  }
};

// Get auth token
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() || null;
  } catch {
    return null;
  }
};
