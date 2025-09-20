document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.service-tab');
  const contents = document.querySelectorAll('.service-details');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const tabId = tab.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
});
