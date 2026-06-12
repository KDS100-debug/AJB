/* ============================================
   AUTHENTICATION MODULE
   ============================================ */

// Session Management
class SessionManager {
    constructor() {
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    }

    // Create session
    createSession(userId, userEmail, userName, sessionToken, userMobile = '', subscriptionStatus = 'INACTIVE') {
        const sessionData = {
            userId: userId,
            userEmail: userEmail,
            userName: userName,
            userMobile: userMobile,
            sessionToken: sessionToken,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.sessionTimeout).toISOString()
        };

        localStorage.setItem('sessionData', JSON.stringify(sessionData));
        localStorage.setItem('userId', userId);
        localStorage.setItem('userEmail', userEmail);
        localStorage.setItem('userName', userName);
        localStorage.setItem('userMobile', userMobile);
        localStorage.setItem('sessionToken', sessionToken);
        localStorage.setItem('subscriptionStatus', subscriptionStatus);
        localStorage.setItem('isSubscribed', subscriptionStatus === 'ACTIVE' ? 'true' : 'false');
    }

    // Get session
    getSession() {
        const sessionData = localStorage.getItem('sessionData');
        return sessionData ? JSON.parse(sessionData) : null;
    }

    // Check if session is valid
    isSessionValid() {
        const session = this.getSession();
        if (!session) return false;

        const expiresAt = new Date(session.expiresAt);
        return expiresAt > new Date();
    }

    // Destroy session
    destroySession() {
        localStorage.removeItem('sessionData');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userMobile');
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('isSubscribed');
        localStorage.removeItem('subscriptionStatus');
        localStorage.removeItem('subscriptionDate');
    }

    // Extend session
    extendSession() {
        const session = this.getSession();
        if (session) {
            session.expiresAt = new Date(Date.now() + this.sessionTimeout).toISOString();
            localStorage.setItem('sessionData', JSON.stringify(session));
        }
    }
}

// Create session manager instance
const sessionManager = new SessionManager();

// Password hashing (simple implementation - use proper hashing on server)
class PasswordUtils {
    // Hash password (client-side hashing - ensure server also hashes)
    static hashPassword(password) {
        // Note: This is a simple demonstration
        // Always use proper bcrypt/argon2 on the server side
        return btoa(password); // Base64 encoding - DO NOT use this in production
    }

    // Validate password strength
    static validatePasswordStrength(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*]/.test(password);

        return {
            isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
            score: [
                password.length >= minLength,
                hasUpperCase,
                hasLowerCase,
                hasNumbers,
                hasSpecialChar
            ].filter(Boolean).length
        };
    }

    // Validate email format
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate mobile number
    static validateMobileNumber(mobile) {
        const mobileRegex = /^[0-9]{10}$/;
        return mobileRegex.test(mobile);
    }
}

// Authentication utilities
const AuthUtils = {
    // Check if user is authenticated
    isAuthenticated() {
        const userId = localStorage.getItem('userId');
        const session = sessionManager.getSession();

        if (!userId) return false;
        if (!session) return true;

        return sessionManager.isSessionValid();
    },

    // Check if user is admin
    isAdmin() {
        return localStorage.getItem('isAdmin') === 'true';
    },

    // Check if user has active subscription
    isSubscribed() {
        return localStorage.getItem('isSubscribed') === 'true' ||
            String(localStorage.getItem('subscriptionStatus') || '').toUpperCase() === 'ACTIVE';
    },

    // Get current user
    getCurrentUser() {
        if (!this.isAuthenticated()) {
            return null;
        }

        return {
            id: localStorage.getItem('userId'),
            email: localStorage.getItem('userEmail'),
            name: localStorage.getItem('userName'),
            mobile: localStorage.getItem('userMobile') || '',
            isSubscribed: this.isSubscribed(),
            subscriptionStatus: this.isSubscribed() ? 'ACTIVE' : 'INACTIVE',
            isAdmin: this.isAdmin()
        };
    },

    // Logout user
    logout() {
        sessionManager.destroySession();
        window.location.href = 'index.html';
    },

    // Extend session on activity
    extendSessionOnActivity() {
        let timeout;

        const resetTimeout = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (this.isAuthenticated()) {
                    sessionManager.extendSession();
                }
            }, 5 * 60 * 1000); // Extend every 5 minutes of activity
        };

        // Track user activity
        document.addEventListener('mousemove', resetTimeout);
        document.addEventListener('keypress', resetTimeout);
        document.addEventListener('click', resetTimeout);
        document.addEventListener('scroll', resetTimeout);

        // Initial timeout
        resetTimeout();
    }
};

// Require authentication for protected pages
function requireAuthentication() {
    if (!AuthUtils.isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Require subscription for premium content
function requireSubscription() {
    if (!AuthUtils.isSubscribed()) {
        window.location.href = 'subscription.html';
        return false;
    }
    return true;
}

async function requireActiveSubscription() {
    if (!requireAuthentication()) {
        return false;
    }

    const userId = localStorage.getItem('userId');

    try {
        if (typeof verifySubscription === 'function') {
            const response = await verifySubscription(userId);
            const isActive = response.success &&
                (response.isSubscribed || String(response.subscriptionStatus || '').toUpperCase() === 'ACTIVE');

            localStorage.setItem('subscriptionStatus', isActive ? 'ACTIVE' : 'INACTIVE');
            localStorage.setItem('isSubscribed', isActive ? 'true' : 'false');

            if (!isActive) {
                window.location.href = 'subscription.html';
                return false;
            }

            return true;
        }
    } catch (error) {
        console.error('Subscription verification failed:', error);
    }

    return requireSubscription();
}

// Require admin access
function requireAdminAccess() {
    if (!AuthUtils.isAuthenticated() || !AuthUtils.isAdmin()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Two-factor authentication setup (optional enhancement)
class TwoFactorAuth {
    // Generate OTP
    static generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Store OTP in session storage
    static storeOTP(email, otp) {
        const otpData = {
            email: email,
            otp: otp,
            timestamp: Date.now(),
            expiresIn: 5 * 60 * 1000 // 5 minutes
        };
        sessionStorage.setItem('otp', JSON.stringify(otpData));
    }

    // Verify OTP
    static verifyOTP(email, otp) {
        const otpData = JSON.parse(sessionStorage.getItem('otp'));

        if (!otpData) return false;
        if (otpData.email !== email) return false;
        if (otpData.otp !== otp) return false;

        const isExpired = Date.now() - otpData.timestamp > otpData.expiresIn;
        if (isExpired) {
            sessionStorage.removeItem('otp');
            return false;
        }

        sessionStorage.removeItem('otp');
        return true;
    }
}

// Initialize session tracking on page load
document.addEventListener('DOMContentLoaded', function() {
    if (AuthUtils.isAuthenticated()) {
        AuthUtils.extendSessionOnActivity();
        
        // Update user greeting
        const userGreeting = document.getElementById('userGreeting');
        if (userGreeting) {
            const userName = localStorage.getItem('userName');
            userGreeting.textContent = `Welcome, ${userName}`;
        }
    }
});

// Redirect to login if on protected page and not authenticated
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname;
    const protectedPages = ['dashboard.html', 'course.html', 'quiz.html', 'admin.html'];

    if (protectedPages.some(page => currentPage.includes(page))) {
        if (!AuthUtils.isAuthenticated()) {
            window.location.href = 'login.html';
        }
    }
});

// Handle session expiry
setInterval(function() {
    if (AuthUtils.isAuthenticated() && !sessionManager.isSessionValid()) {
        alert('Your session has expired. Please login again.');
        AuthUtils.logout();
    }
}, 60000); // Check every minute
