// auth-guard.js
const authService = window.authService;

class AuthGuard {
    constructor() {
        this.isRedirecting = false;
        this.redirectTimer = null;
    }

    redirectToLogin() {
        if (this.isRedirecting) return;

        console.warn('[AuthGuard] Redirecting to loading → login...');
        this.isRedirecting = true;
        window.location.href = './loading.html';

        this.redirectTimer = setTimeout(() => {
            window.location.href = './login.html';
        }, 3000);
    }

    async checkAuth() {
        console.log('[AuthGuard] Running checkAuth...');
        return new Promise((resolve) => {
            authService.onAuthStateChange((user) => {
                console.log('[AuthGuard] onAuthStateChange fired in checkAuth:', user);
                if (user) {
                    this.isRedirecting = false;
                    resolve(true);
                } else {
                    this.redirectToLogin();
                    resolve(false);
                }
            });
        });
    }

    initializeForIndex() {
        console.log('[AuthGuard] Initializing for index.html');

        authService.waitForAuthInit().then(async () => {
            console.log('[AuthGuard] waitForAuthInit done');

            const isAuthenticated = await this.checkAuth();
            if (!isAuthenticated) {
                console.warn('[AuthGuard] Not authenticated, redirected');
                return;
            }

            console.log('[AuthGuard] Authenticated — showing app');
            const container = document.querySelector('.container');
            if (container) container.style.display = 'flex';
        });

        // Additional listener in case user signs out later
        authService.onAuthStateChange((user) => {
            console.log('[AuthGuard] onAuthStateChange listener (outside checkAuth):', user);
            if (!user && !this.isRedirecting) {
                this.redirectToLogin();
            }
        });
    }

    initializeForAuthPages() {
        console.log('[AuthGuard] Initializing for login/signup page');

        authService.waitForAuthInit().then(() => {
            const user = authService.getCurrentUser();
            console.log('[AuthGuard] Current user after waitForAuthInit:', user);

            if (user) {
                const redirectedFromIndex = document.referrer.includes('index.html');
                if (!redirectedFromIndex) {
                    console.log('[AuthGuard] Already logged in → redirecting to index.html');
                    window.location.href = './index.html';
                }
            }
        });
    }

    cleanup() {
        console.log('[AuthGuard] cleanup');
        if (this.redirectTimer) {
            clearTimeout(this.redirectTimer);
            this.redirectTimer = null;
        }
        this.isRedirecting = false;
    }
}

const authGuard = new AuthGuard();
window.authGuard = authGuard;
