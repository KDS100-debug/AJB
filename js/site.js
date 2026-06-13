(function () {
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('ajb-theme') || localStorage.getItem('theme') || 'light';
  root.setAttribute('data-theme', savedTheme);

  window.AJBLearn = {
    escapeHtml(value) {
      const div = document.createElement('div');
      div.textContent = String(value ?? '');
      return div.innerHTML;
    },
    showToast(message, icon = 'check-circle-2') {
      document.querySelector('.toast')?.remove();
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `<i data-lucide="${icon}" size="17"></i><span>${this.escapeHtml(message)}</span>`;
      document.body.appendChild(toast);
      refreshIcons();
      window.setTimeout(() => toast.remove(), 2800);
    },
    async requireBackend() {
      if (!window.isConfiguredApiUrl?.()) {
        throw new Error('Google Apps Script is not configured. Add the deployed Web App URL in js/api.js.');
      }
    },
    setSelectOptions(select, items, placeholder, valueKey = 'id', labelKey = 'name') {
      select.innerHTML = `<option value="">${this.escapeHtml(placeholder)}</option>` +
        items.map((item) => `<option value="${this.escapeHtml(item[valueKey])}">${this.escapeHtml(item[labelKey])}</option>`).join('');
    }
  };

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function setupNavigation() {
    const menuToggle = document.querySelector('[data-menu-toggle]');
    const navLinks = document.querySelector('.nav-links');
    menuToggle?.addEventListener('click', () => navLinks?.classList.toggle('open'));

    document.addEventListener('click', (event) => {
      if (!event.target.closest('.site-nav')) {
        navLinks?.classList.remove('open');
      }
    });

    const current = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach((link) => {
      const href = link.getAttribute('href')?.split('#')[0];
      if (href === current || (current === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  }

  function setupTheme() {
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem('ajb-theme', next);
        localStorage.setItem('theme', next);
        refreshIcons();
      });
    });
  }

  function setupFaq() {
    document.querySelectorAll('.faq-question').forEach((button) => {
      button.addEventListener('click', () => {
        const item = button.closest('.faq-item');
        const wasOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach((faq) => faq.classList.remove('open'));
        if (!wasOpen) item.classList.add('open');
      });
    });
  }

  function setupPanelNavigation() {
    document.querySelectorAll('[data-panel-target]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const targetId = link.dataset.panelTarget;
        const scope = link.closest('.app-layout') || document;
        scope.querySelectorAll('.admin-section, .dashboard-section').forEach((section) => {
          section.classList.toggle('active', section.id === targetId);
        });
        scope.querySelectorAll('[data-panel-target]').forEach((item) => item.classList.remove('active'));
        link.classList.add('active');
        document.querySelector('.app-sidebar')?.classList.remove('open');
      });
    });
  }

  function setupInstall() {
    let installPrompt;
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      installPrompt = event;
      document.querySelectorAll('[data-install-app]').forEach((button) => {
        button.hidden = false;
      });
    });

    document.querySelectorAll('[data-install-app]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!installPrompt) {
          window.AJBLearn.showToast('Use your browser menu to install AJB LEARN.', 'smartphone');
          return;
        }
        installPrompt.prompt();
        await installPrompt.userChoice;
        installPrompt = null;
      });
    });

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  function setupCommonActions() {
    document.querySelectorAll('[data-bookmark]').forEach((button) => {
      button.addEventListener('click', () => {
        button.classList.toggle('active');
        window.AJBLearn.showToast(button.classList.contains('active') ? 'Saved to bookmarks.' : 'Removed from bookmarks.', 'bookmark');
      });
    });

    document.querySelectorAll('[data-sidebar-toggle]').forEach((button) => {
      button.addEventListener('click', () => document.querySelector('.app-sidebar')?.classList.toggle('open'));
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupTheme();
    setupFaq();
    setupPanelNavigation();
    setupInstall();
    setupCommonActions();
    refreshIcons();
  });
})();
