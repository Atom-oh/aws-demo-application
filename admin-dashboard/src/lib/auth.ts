'use client';

import { Amplify } from 'aws-amplify';
import {
  signIn,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  confirmSignIn,
  fetchMFAPreference,
  AuthError,
} from 'aws-amplify/auth';
import { AdminUser, LoginCredentials, MFAChallenge } from '@/types';

// Configure Amplify
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
      signUpVerificationMethod: 'code' as const,
      loginWith: {
        email: true,
      },
      mfa: {
        status: 'on' as const,
        totpEnabled: true,
        smsEnabled: false,
      },
    },
  },
};

let isConfigured = false;

export function configureAuth(): void {
  if (!isConfigured && typeof window !== 'undefined') {
    Amplify.configure(amplifyConfig);
    isConfigured = true;
  }
}

export async function adminLogin(
  credentials: LoginCredentials
): Promise<{ success: boolean; mfaChallenge?: MFAChallenge; error?: string }> {
  try {
    configureAuth();
    const result = await signIn({
      username: credentials.email,
      password: credentials.password,
    });

    if (result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
      return {
        success: false,
        mfaChallenge: {
          challengeName: 'TOTP_MFA',
          session: '',
        },
      };
    }

    if (result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_SMS_CODE') {
      return {
        success: false,
        mfaChallenge: {
          challengeName: 'SMS_MFA',
          session: '',
        },
      };
    }

    if (result.isSignedIn) {
      // Verify admin role
      const user = await getAdminUser();
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        await adminLogout();
        return {
          success: false,
          error: 'Access denied. Admin privileges required.',
        };
      }
      return { success: true };
    }

    return {
      success: false,
      error: 'Login failed. Please try again.',
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

export async function confirmMFA(code: string): Promise<{ success: boolean; error?: string }> {
  try {
    configureAuth();
    const result = await confirmSignIn({
      challengeResponse: code,
    });

    if (result.isSignedIn) {
      // Verify admin role after MFA
      const user = await getAdminUser();
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        await adminLogout();
        return {
          success: false,
          error: 'Access denied. Admin privileges required.',
        };
      }
      return { success: true };
    }

    return {
      success: false,
      error: 'MFA verification failed',
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

export async function adminLogout(): Promise<void> {
  try {
    configureAuth();
    await signOut();
  } catch (error) {
    console.error('Logout error:', error);
  }
}

export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    configureAuth();
    const user = await getCurrentUser();
    const session = await fetchAuthSession();

    const idToken = session.tokens?.idToken;
    const claims = idToken?.payload;

    // Extract admin role from Cognito groups or custom attributes
    const groups = (claims?.['cognito:groups'] as string[]) || [];
    const isAdmin = groups.includes('admin') || groups.includes('super_admin');
    const role = groups.includes('super_admin') ? 'super_admin' : 'admin';

    if (!isAdmin) {
      return null;
    }

    const mfaPreference = await fetchMFAPreference();

    return {
      id: user.userId,
      email: claims?.email as string || user.signInDetails?.loginId || '',
      name: (claims?.name as string) || (claims?.email as string) || '',
      role: role as 'admin' | 'super_admin',
      mfaEnabled: mfaPreference.preferred !== undefined,
      lastLoginAt: claims?.auth_time ? new Date((claims.auth_time as number) * 1000).toISOString() : undefined,
    };
  } catch {
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  try {
    configureAuth();
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() || null;
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    configureAuth();
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

export async function checkMFAStatus(): Promise<boolean> {
  try {
    configureAuth();
    const mfaPreference = await fetchMFAPreference();
    return mfaPreference.preferred !== undefined;
  } catch {
    return false;
  }
}
