import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import * as firebaseAuth from 'firebase/auth';

// Mock dependencies
vi.mock('firebase/auth', () => ({
    onAuthStateChanged: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    GoogleAuthProvider: vi.fn(),
    signInWithPopup: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    updateProfile: vi.fn(),
    updatePassword: vi.fn(),
    reauthenticateWithCredential: vi.fn(),
    EmailAuthProvider: { credential: vi.fn() },
    confirmPasswordReset: vi.fn(),
    verifyPasswordResetCode: vi.fn()
}));

vi.mock('@/services/firebase', () => ({
    getFirebaseAuth: vi.fn()
}));

vi.mock('@/services/api', () => ({
    api: vi.fn()
}));

describe('Auth Store', () => {
    let store;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useAuthStore();
        vi.clearAllMocks();
    });

    describe('login', () => {
        it('should handle successful login', async () => {
            firebaseAuth.signInWithEmailAndPassword.mockResolvedValueOnce({ user: { email: 'test@test.com' } });

            await store.login('test@test.com', 'password');

            expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(store._auth, 'test@test.com', 'password');
            expect(store.loading).toBe(false);
            expect(store.error).toBe(null);
        });

        it('should handle login error', async () => {
            const errorMessage = 'Invalid credentials';
            firebaseAuth.signInWithEmailAndPassword.mockRejectedValueOnce(new Error(errorMessage));

            await expect(store.login('test@test.com', 'wrongpassword')).rejects.toThrow(errorMessage);

            expect(store.error).toBe(errorMessage);
            expect(store.loading).toBe(false);
        });
    });

    describe('loginWithGoogle', () => {
        it('should handle Google login error', async () => {
            const errorMessage = 'Google login failed';
            firebaseAuth.signInWithPopup.mockRejectedValueOnce(new Error(errorMessage));

            await expect(store.loginWithGoogle()).rejects.toThrow(errorMessage);

            expect(store.error).toBe(errorMessage);
            expect(store.loading).toBe(false);
        });
    });

    describe('register', () => {
        it('should handle registration error', async () => {
            const errorMessage = 'Email already in use';
            firebaseAuth.createUserWithEmailAndPassword.mockRejectedValueOnce(new Error(errorMessage));

            await expect(store.register('test@test.com', 'password')).rejects.toThrow(errorMessage);

            expect(store.error).toBe(errorMessage);
            expect(store.loading).toBe(false);
        });
    });

    describe('logout', () => {
        it('should handle logout error', async () => {
            const errorMessage = 'Logout failed';
            firebaseAuth.signOut.mockRejectedValueOnce(new Error(errorMessage));

            await expect(store.logout()).rejects.toThrow(errorMessage);

            expect(store.error).toBe(errorMessage);
        });
    });

    describe('resetPassword', () => {
        it('should handle reset password error', async () => {
            const errorMessage = 'User not found';
            firebaseAuth.sendPasswordResetEmail.mockRejectedValueOnce(new Error(errorMessage));

            await expect(store.resetPassword('test@test.com')).rejects.toThrow(errorMessage);

            expect(store.error).toBe(errorMessage);
        });
    });
});
