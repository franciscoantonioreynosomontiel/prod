// Popup funcionalidad
document.querySelectorAll('.mockup-slider .item').forEach(item => {
  item.addEventListener('click', () => {
    const url = item.getAttribute('data-url');
    if (url) {
      document.getElementById('popupFrame').src = url;
      document.getElementById('popup').classList.add('active');
    }
  });
});

document.getElementById('popupClose').addEventListener('click', () => {
  document.getElementById('popup').classList.remove('active');
  document.getElementById('popupFrame').src = "";
});

document.getElementById('popup').addEventListener('click', e => {
  if (e.target.id === 'popup') {
    document.getElementById('popup').classList.remove('active');
    document.getElementById('popupFrame').src = "";
  }
});
