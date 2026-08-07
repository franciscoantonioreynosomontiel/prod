const imageSets = {
  1: [
    './assets/img/i2.webp',
    './assets/img/i3.webp',
    './assets/img/i4.webp',
    './assets/img/i5.webp',
    './assets/img/i6.webp'
  ],
  2: [
    'img/imagen2.jpg',
    'img/imagen2-2.jpg',
    'img/imagen2-3.jpg',
    'img/imagen2-4.jpg',
    'img/imagen2-5.jpg'
  ],
  3: [
    'img/imagen3.jpg',
    'img/imagen3-2.jpg',
    'img/imagen3-3.jpg',
    'img/imagen3-4.jpg',
    'img/imagen3-5.jpg'
  ]
};

document.querySelectorAll('.img-container').forEach(container => {
  const setId = container.dataset.set;
  const imgList = imageSets[setId];
  const mainImg = container.querySelector('img');
  let currentIndex = 0;
  let interval;

  const changeImage = () => {
    currentIndex = (currentIndex + 1) % imgList.length;
    const fadeImg = document.createElement('img');
    fadeImg.src = imgList[currentIndex];
    fadeImg.classList.add('fade');
    container.appendChild(fadeImg);
    void fadeImg.offsetWidth;
    fadeImg.classList.remove('fade');
    setTimeout(() => {
      mainImg.src = fadeImg.src;
      container.removeChild(fadeImg);
    }, 1000);
  };

  const start = () => {
    if (interval) return;
    changeImage();
    interval = setInterval(changeImage, 1500);
  };

  const stop = () => {
    clearInterval(interval);
    interval = null;
  };

  container.addEventListener('mouseenter', start);
  container.addEventListener('mouseleave', stop);
  container.addEventListener('touchstart', start);
  container.addEventListener('touchend', stop);
  container.addEventListener('touchcancel', stop);
});
