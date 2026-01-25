import { defineStore } from 'pinia';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    updateProfile,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    confirmPasswordReset,
    verifyPasswordResetCode
} from 'firebase/auth';
import { getFirebaseAuth } from '../services/firebase';
import { api } from '../services/api';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        loading: true,
        authReady: false,
        error: null,
        _auth: null
    }),

    actions: {
        async init() {
            try {
                // We use a temporary api instance without token to get config
                const tempApi = api(() => null);
                const config = await tempApi.getFirebaseConfig();
                
                this._auth = await getFirebaseAuth(config);
                
                return new Promise((resolve) => {
                    onAuthStateChanged(this._auth, (user) => {
                        this.user = user;
                        this.loading = false;
                        this.authReady = true;
                        resolve(user);
                    });
                });
            } catch (err) {
                console.error('Auth initialization failed:', err);
                this.error = err.message;
                this.loading = false;
                this.authReady = true;
                throw err;
            }
        },

        async login(email, password) {
            this.loading = true;
            try {
                await signInWithEmailAndPassword(this._auth, email, password);
            } catch (err) {
                this.error = err.message;
                throw err;
            } finally {
                this.loading = false;
            }
        },

        async loginWithGoogle() {
            this.loading = true;
            try {
                const provider = new GoogleAuthProvider();
                await signInWithPopup(this._auth, provider);
            } catch (err) {
                this.error = err.message;
                throw err;
            } finally {
                this.loading = false;
            }
        },

        async register(email, password) {
            this.loading = true;
            try {
                const userCredential = await createUserWithEmailAndPassword(this._auth, email, password);
                this.user = userCredential.user; // Update state immediately
                
                // Send welcome email
                try {
                    const authenticatedApi = api(() => this.getToken());
                    await authenticatedApi.sendWelcomeEmail();
                } catch (emailError) {
                    console.error('Failed to send welcome email:', emailError);
                    // We don't throw here to avoid blocking the registration flow
                }
            } catch (err) {
                this.error = err.message;
                throw err;
            } finally {
                this.loading = false;
            }
        },

        async logout() {
            try {
                await firebaseSignOut(this._auth);
                this.user = null;
            } catch (err) {
                this.error = err.message;
                throw err;
            }
        },

        async getToken() {
            if (this.user) {
                return await this.user.getIdToken(true);
            }
            return null;
        },

        async resetPassword(email) {
            try {
                await sendPasswordResetEmail(this._auth, email);
            } catch (err) {
                this.error = err.message;
                throw err;
            }
        },

        async verifyResetCode(oobCode) {
            try {
                return await verifyPasswordResetCode(this._auth, oobCode);
            } catch (err) {
                this.error = err.message;
                throw err;
            }
        },

        async confirmReset(oobCode, newPassword) {
            try {
                await confirmPasswordReset(this._auth, oobCode, newPassword);
            } catch (err) {
                this.error = err.message;
                throw err;
            }
        },

        async updateProfile(updates) {
            if (!this.user) throw new Error('No user logged in');
            try {
                await updateProfile(this.user, updates);
                // Refresh user state
                this.user = { ...this._auth.currentUser };
            } catch (err) {
                this.error = err.message;
                throw err;
            }
        },

        async changePassword(currentPassword, newPassword) {
            if (!this.user) throw new Error('No user logged in');
            try {
                const credential = EmailAuthProvider.credential(this.user.email, currentPassword);
                await reauthenticateWithCredential(this.user, credential);
                await updatePassword(this.user, newPassword);
            } catch (err) {
                this.error = err.message;
                throw err;
            }
        }
    }
});
