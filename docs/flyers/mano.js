const rotateHint = document.querySelector('.rotate-hint');
if (rotateHint) {
  const parent = rotateHint.parentElement;

  const hideHint = () => {
    rotateHint.classList.add('hidden');
    parent.removeEventListener('pointerdown', hideHint);
    parent.removeEventListener('touchstart', hideHint);
  };

  // Solo desaparece al click o toque
  parent.addEventListener('pointerdown', hideHint, { once: true });
  parent.addEventListener('touchstart', hideHint, { once: true });
}
