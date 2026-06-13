document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-panel-jump]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelector(`[data-panel-target="${button.dataset.panelJump}"]`)?.click();
    });
  });

  document.querySelectorAll('.admin-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      window.AJBLearn.showToast(`${form.dataset.entity} saved. Configure the Apps Script URL to sync it to Google Sheets.`);
      form.reset();
    });
  });

  document.querySelectorAll('[data-status-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const statusCell = button.closest('tr').children[4];
      const activate = button.textContent.trim() === 'Activate';
      statusCell.textContent = activate ? 'Active' : 'Inactive';
      button.textContent = activate ? 'Deactivate' : 'Activate';
      button.classList.toggle('btn-primary', !activate);
      button.classList.toggle('btn-secondary', activate);
      window.AJBLearn.showToast(`Subscription ${activate ? 'activated' : 'deactivated'}.`);
    });
  });

  document.getElementById('studentSearch')?.addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();
    document.querySelectorAll('#studentsTable tbody tr').forEach((row) => {
      row.hidden = !row.textContent.toLowerCase().includes(query);
    });
  });
});
