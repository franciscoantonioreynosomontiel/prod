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

// === POPUP RESIZING & SCALING ===
const images = document.querySelectorAll('.imagen');
const popup = document.getElementById('popup');
const popupContent = document.querySelector('.popup-content');
const popupFrame = document.getElementById('popupFrame');
const closeBtn = document.querySelector('.close');

/**
 * Dynamically scales the menu iframe inside the popup content container
 * so that it fits perfectly in terms of aspect ratio and never overflows
 * regardless of the device size or resolution.
 */
function resizePopupFrame() {
  if (!popup || popup.style.display !== 'flex' || !popupFrame || !popupContent) {
    return;
  }

  // Get current dimensions of the popup container
  const containerWidth = popupContent.clientWidth;
  const containerHeight = popupContent.clientHeight;

  // Retrieve base/logical dimensions defined in CSS variables
  const computedStyle = getComputedStyle(document.documentElement);
  const baseWidth = parseFloat(computedStyle.getPropertyValue('--menu-logical-width')) || 922;
  const baseHeight = parseFloat(computedStyle.getPropertyValue('--menu-logical-height')) || 610;

  // Reserve a small safety margin/padding so the scaled menu doesn't touch the container edges directly
  const maxAllowedWidth = containerWidth * 0.95;
  const maxAllowedHeight = containerHeight * 0.92;

  // Calculate scaling factor to fit the base width and height perfectly within allowed space
  const scaleX = maxAllowedWidth / baseWidth;
  const scaleY = maxAllowedHeight / baseHeight;
  let scale = Math.min(scaleX, scaleY);

  // Set the base logical size to the iframe
  popupFrame.style.width = baseWidth + 'px';
  popupFrame.style.height = baseHeight + 'px';

  // Apply scaling and translation transform to center the scaled iframe perfectly
  popupFrame.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

// Attach resize handler to window
window.addEventListener('resize', resizePopupFrame);

// Open popup and load iframe URL on image click
images.forEach(img => {
  img.addEventListener('click', () => {
    const url = img.getAttribute('data-url');
    if (url) {
      popupFrame.src = url;
      popup.style.display = 'flex';

      // Perform resize calculations once display is flex and dimensions are queryable
      // Multiple timeouts ensure accurate layout calculation after load
      resizePopupFrame();
      setTimeout(resizePopupFrame, 50);
      setTimeout(resizePopupFrame, 150);
      setTimeout(resizePopupFrame, 300);
    }
  });
});

// Close popup on button click
closeBtn.addEventListener('click', () => {
  popup.style.display = 'none';
  popupFrame.src = "";
});

// Close popup when clicking on the overlay background
popup.addEventListener('click', e => {
  if (e.target === popup) {
    popup.style.display = 'none';
    popupFrame.src = "";
  }
});
