$(function(){
  var announcement = document.getElementById('announcement');

  if (announcement !== null) {
    var id = announcement.dataset.id;
    Object.keys(localStorage).forEach(function(key) {
      if (/^global-alert-/.test(key)) {
        if (key !== id ) {
          localStorage.removeItem(key);
          document.documentElement.removeAttribute('data-global-alert');
        }
      }
    });
    announcement.addEventListener('closed.bs.alert', () => {
      localStorage.setItem(id, 'closed');
    });
  }

  Object.keys(localStorage).forEach(function(key) {
    if (/^global-alert-/.test(key)) {
      document.documentElement.setAttribute('data-global-alert', 'closed');
    }
  });
});

