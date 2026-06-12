/* ============================================
   AJB LEARN - RESPONSIVE UI CONTROLLER
   Mobile & Desktop Interactions
   ============================================ */

class ResponsiveUI {
  constructor() {
    this.mobileBreakpoint = 768;
    this.isMobile = window.innerWidth < this.mobileBreakpoint;
    this.init();
  }

  init() {
    this.setupDarkMode();
    this.setupNavigation();
    this.setupAccordion();
    this.setupModals();
    this.setupScrollEvents();
    this.setupResponsiveEvents();
    this.setupFormValidation();
    this.setupNotifications();
  }

  /* ============================================
     DARK MODE
     ============================================ */

  setupDarkMode() {
    const theme = localStorage.getItem('theme') || 'light';
    this.setTheme(theme);

    document.addEventListener('DOMContentLoaded', () => {
      const darkModeToggle = document.getElementById('darkModeToggle');
      if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
      }
    });
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  toggleDarkMode() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /* ============================================
     NAVIGATION
     ============================================ */

  setupNavigation() {
    const navToggle = document.querySelector('.navbar-toggle');
    const navMenu = document.querySelector('.navbar-menu');
    const navLinks = document.querySelectorAll('.navbar-item a');
    const navbar = document.querySelector('nav');

    if (navToggle) {
      navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
      });
    }

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (navToggle) {
          navToggle.classList.remove('active');
          navMenu.classList.remove('active');
        }
      });
    });

    // Add shadow on scroll
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('nav')) {
        if (navMenu) {
          navToggle.classList.remove('active');
          navMenu.classList.remove('active');
        }
      }
    });
  }

  /* ============================================
     ACCORDION
     ============================================ */

  setupAccordion() {
    const accordionItems = document.querySelectorAll('.accordion-item');

    accordionItems.forEach(item => {
      const header = item.querySelector('.accordion-header');
      const body = item.querySelector('.accordion-body');

      if (header) {
        header.addEventListener('click', () => {
          const isActive = header.classList.contains('active');

          // Close all
          accordionItems.forEach(i => {
            i.querySelector('.accordion-header').classList.remove('active');
            i.querySelector('.accordion-body').classList.remove('active');
          });

          // Open current if not active
          if (!isActive) {
            header.classList.add('active');
            body.classList.add('active');
          }
        });
      }
    });
  }

  /* ============================================
     MODALS
     ============================================ */

  setupModals() {
    const modals = document.querySelectorAll('.modal-overlay');

    modals.forEach(modal => {
      const closeBtn = modal.querySelector('.modal-close');

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.closeModal(modal);
        });
      }

      // Close on background click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal);
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
          this.closeModal(modal);
        }
      });
    });

    // Modal triggers
    document.querySelectorAll('[data-modal]').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const modalId = trigger.getAttribute('data-modal');
        const modal = document.getElementById(modalId);
        if (modal) {
          this.openModal(modal);
        }
      });
    });
  }

  openModal(modal) {
    modal.classList.add('show');
    modal.classList.add('modal-enter');
    document.body.style.overflow = 'hidden';
  }

  closeModal(modal) {
    modal.classList.remove('modal-enter');
    modal.classList.add('modal-exit');
    setTimeout(() => {
      modal.classList.remove('show');
      modal.classList.remove('modal-exit');
      document.body.style.overflow = '';
    }, 300);
  }

  /* ============================================
     SCROLL EFFECTS
     ============================================ */

  setupScrollEvents() {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));

    // Animate elements on scroll
    const animatedElements = document.querySelectorAll('[data-animate]');
    const elementObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const animation = entry.target.getAttribute('data-animate');
          entry.target.classList.add(animation);
          elementObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => elementObserver.observe(el));

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });
  }

  /* ============================================
     RESPONSIVE EVENTS
     ============================================ */

  setupResponsiveEvents() {
    window.addEventListener('resize', () => {
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth < this.mobileBreakpoint;

      if (wasMobile !== this.isMobile) {
        this.onBreakpointChange();
      }
    });
  }

  onBreakpointChange() {
    if (!this.isMobile) {
      // Desktop
      const navMenu = document.querySelector('.navbar-menu');
      const navToggle = document.querySelector('.navbar-toggle');
      if (navMenu) {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
      }
    }
  }

  /* ============================================
     FORM VALIDATION
     ============================================ */

  setupFormValidation() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
      const inputs = form.querySelectorAll('.form-input, .form-select, .form-textarea');

      inputs.forEach(input => {
        input.addEventListener('blur', () => {
          this.validateField(input);
        });

        input.addEventListener('focus', () => {
          const error = input.nextElementSibling;
          if (error && error.classList.contains('form-error')) {
            error.classList.remove('show');
          }
        });
      });

      form.addEventListener('submit', (e) => {
        let isValid = true;

        inputs.forEach(input => {
          if (!this.validateField(input)) {
            isValid = false;
          }
        });

        if (!isValid) {
          e.preventDefault();
        }
      });
    });
  }

  validateField(field) {
    let isValid = true;
    let errorMessage = '';

    if (field.hasAttribute('required') && !field.value.trim()) {
      isValid = false;
      errorMessage = 'This field is required';
    } else if (field.type === 'email' && field.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email';
      }
    } else if (field.type === 'tel' && field.value) {
      const telRegex = /^[0-9]{10}$/;
      if (!telRegex.test(field.value.replace(/\D/g, ''))) {
        isValid = false;
        errorMessage = 'Please enter a valid phone number';
      }
    } else if (field.name === 'password' && field.value) {
      if (field.value.length < 6) {
        isValid = false;
        errorMessage = 'Password must be at least 6 characters';
      }
    } else if (field.name === 'confirmPassword' && field.value) {
      const passwordField = field.form.querySelector('input[name="password"]');
      if (passwordField && field.value !== passwordField.value) {
        isValid = false;
        errorMessage = 'Passwords do not match';
      }
    }

    // Show/hide error message
    let errorElement = field.nextElementSibling;
    if (!errorElement || !errorElement.classList.contains('form-error')) {
      errorElement = document.createElement('div');
      errorElement.className = 'form-error';
      field.parentNode.insertBefore(errorElement, field.nextSibling);
    }

    if (!isValid) {
      errorElement.textContent = errorMessage;
      errorElement.classList.add('show');
      field.style.borderColor = 'var(--danger)';
    } else {
      errorElement.classList.remove('show');
      field.style.borderColor = '';
    }

    return isValid;
  }

  /* ============================================
     NOTIFICATIONS
     ============================================ */

  setupNotifications() {
    // Global notification function
    window.showNotification = (message, type = 'info', duration = 3000) => {
      this.showNotification(message, type, duration);
    };
  }

  showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notificationContainer') || this.createNotificationContainer();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type} notification-enter`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    container.appendChild(notification);

    setTimeout(() => {
      notification.classList.remove('notification-enter');
      notification.classList.add('notification-exit');

      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    container.className = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: var(--z-tooltip);
      max-width: 400px;
      width: 100%;
    `;
    document.body.appendChild(container);
    return container;
  }

  /* ============================================
     UTILITY METHODS
     ============================================ */

  isTouchDevice() {
    return (
      (typeof window !== 'undefined' &&
        ('ontouchstart' in window ||
          (window.DocumentTouch && typeof document !== 'undefined' && document instanceof window.DocumentTouch)))
    );
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.ui = new ResponsiveUI();
});

/* ============================================
   PASSWORD VISIBILITY TOGGLE
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', function () {
      const input = this.previousElementSibling;
      if (input.type === 'password') {
        input.type = 'text';
        this.textContent = '👁️‍🗨️';
      } else {
        input.type = 'password';
        this.textContent = '👁️';
      }
    });
  });
});

/* ============================================
   MOBILE OPTIMIZATIONS
   ============================================ */

// Prevent double-tap zoom
document.addEventListener('touchstart', function (e) {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

// Faster response to touch
document.addEventListener('touchend', function () {
  const touch = event.changedTouches[0];
  const mouseEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  touch.target.dispatchEvent(mouseEvent);
}, { passive: false });

/* ============================================
   PERFORMANCE: VIEWPORT HEIGHT CORRECTION (iOS)
   ============================================ */

function fixViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', fixViewportHeight);
fixViewportHeight();

/* ============================================
   EXPORT FOR USE IN OTHER FILES
   ============================================ */

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResponsiveUI;
}
