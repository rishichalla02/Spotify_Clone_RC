// Authentication Service
import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from 'firebase/firestore';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.authStateListeners = [];

        // Monitor auth state changes
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.notifyAuthStateListeners(user);
        });
    }

    // Add auth state listener
    onAuthStateChange(callback) {
        this.authStateListeners.push(callback);
        // Call immediately with current state
        callback(this.currentUser);
    }

    // Remove auth state listener
    removeAuthStateListener(callback) {
        this.authStateListeners = this.authStateListeners.filter(listener => listener !== callback);
    }

    // Notify all listeners of auth state changes
    notifyAuthStateListeners(user) {
        this.authStateListeners.forEach(callback => callback(user));
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Sign up with email and password
    async signUp(email, password, userData = {}) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update profile if display name provided
            if (userData.displayName) {
                await updateProfile(user, {
                    displayName: userData.displayName
                });
            }

            // Calculate age from dateOfBirth (expected format: "YYYY-MM-DD")
            let age = null;
            if (userData.dateOfBirth) {
                const dob = new Date(userData.dateOfBirth);
                const today = new Date();
                age = today.getFullYear() - dob.getFullYear();
                const monthDiff = today.getMonth() - dob.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                    age--;
                }
            }

            // Store additional user data in Firestore
            await this.createUserDocument(user.uid, {
                email: user.email,
                displayName: userData.displayName || '',
                dateOfBirth: userData.dateOfBirth || '',
                age: age,
                gender: userData.gender || '',
                marketingOptOut: userData.marketingOptOut || false,
                dataSharing: userData.dataSharing || false,
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp()
            });

            return { success: true, user };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    // Sign in with email and password
    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update last login time
            await this.updateUserDocument(user.uid, {
                lastLoginAt: serverTimestamp()
            });

            return { success: true, user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    // Sign out
    async signOut() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    // Create user document in Firestore
    async createUserDocument(uid, userData) {
        try {
            const userRef = doc(db, 'user', uid);
            await setDoc(userRef, userData);
            return true;
        } catch (error) {
            console.error('Error creating user document:', error);
            return false;
        }
    }

    // Update user document in Firestore
    async updateUserDocument(uid, updateData) {
        try {
            const userRef = doc(db, 'user', uid);
            await setDoc(userRef, updateData, { merge: true });
            return true;
        } catch (error) {
            console.error('Error updating user document:', error);
            return false;
        }
    }

    // Get user document from Firestore
    async getUserDocument(uid) {
        try {
            const userRef = doc(db, 'user', uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                return userSnap.data();
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error getting user document:', error);
            return null;
        }
    }

    // Convert Firebase error codes to user-friendly messages
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters long.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/invalid-credential': 'Invalid email or password.',
            'auth/missing-password': 'Password is required.',
            'auth/missing-email': 'Email is required.'
        };

        return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
    }

    // Wait for auth initialization
    waitForAuthInit() {
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                // Add a check here to ensure user is not null before accessing properties
                if (user) {
                    console.log("[AuthService] onAuthStateChanged resolved with:", user.email);
                } else {
                    console.log("[AuthService] onAuthStateChanged resolved with: No user logged in.");
                }
                unsubscribe();
                resolve(user);
            });
        });
    }
}

// Create singleton instance
const authService = new AuthService();

// Expose globally for signup.js to access
window.authService = authService;