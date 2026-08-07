var swiper = new Swiper('.swiper-container', {
  effect: 'coverflow',
  grabCursor: true,
  centeredSlides: true,
  loop: true,
  slidesPerView: 'auto',
  autoplay: {
    delay: 2500,
    disableOnInteraction: false,
  },
  coverflowEffect: {
    rotate: 50,
    stretch: 0,
    depth: 100,
    modifier: 1,
    slideShadows: true,
  },
  pagination: {
    el: '.swiper-pagination',
  },
});

// === POPUP ===
const images = document.querySelectorAll('.imagen');
const popup = document.getElementById('popup');
const popupFrame = document.getElementById('popupFrame');
const closeBtn = document.querySelector('.close');

images.forEach(img => {
  img.addEventListener('click', () => {
    const url = img.getAttribute('data-url');
    if(url){
      popupFrame.src = url;
      popup.style.display = 'flex';
    }
  });
});

closeBtn.addEventListener('click', () => {
  popup.style.display = 'none';
  popupFrame.src = "";
});

popup.addEventListener('click', e => {
  if(e.target === popup){
    popup.style.display = 'none';
    popupFrame.src = "";
  }
});
