/**
 * Interactive Digital Sticker Physics System
 * Powered by Canvas 2D math, Image Preloading, & CSS 3D transforms.
 */

class DigitalSticker {
    constructor(container, options = {}) {
        this.container = container;

        // Get custom sticker image URL from data-attribute or option
        this.imgUrl = container.getAttribute('data-sticker-img') || options.imgUrl || 'https://menutechdeveloper.github.io/bddImg/assets/mk/sticker1.png';
        this.color = container.getAttribute('data-sticker-color') || options.color || '#FFE0B2';
        this.text = options.text || '';

        this.width = options.width || 140;
        this.height = options.height || 140;
        this.radius = this.width / 2;

        // States: 'STUCK', 'PEELING', 'FLOATING', 'STICKING'
        this.state = 'STUCK';
        this.x = 0;
        this.y = 0;

        // Movement threshold tracking
        this.startX = 0;
        this.startY = 0;
        this.isPointerDown = false;
        this.dragThreshold = 6; // 6 pixels threshold to prevent clicking bugs
        this.hasMovedPastThreshold = false;

        // Grab coordinates relative to sticker
        this.grabAngle = 0;
        this.grabPoint = { x: 0, y: 0 };
        this.dragOffset = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.lastPointerPos = { x: 0, y: 0 };

        // 3D inertia rotation
        this.tiltX = 0;
        this.tiltY = 0;

        // Load image asset
        this.isImageLoaded = false;
        this.stickerImg = new Image();
        this.stickerImg.crossOrigin = 'anonymous';
        this.stickerImg.onload = () => {
            this.isImageLoaded = true;
            this.drawStuck();
        };
        this.stickerImg.src = this.imgUrl;

        this.initDOM();
        this.initEvents();
    }

    initDOM() {
        // Create Canvas inside the container
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width * window.devicePixelRatio;
        this.canvas.height = this.height * window.devicePixelRatio;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        this.canvas.className = 'sticker-canvas';
        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        this.container.classList.add('sticker-element');
        this.container.appendChild(this.canvas);

        this.container.style.width = `${this.width}px`;
        this.container.style.height = `${this.height}px`;
    }

    initEvents() {
        this.container.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        window.addEventListener('pointermove', (e) => this.onPointerMove(e));
        window.addEventListener('pointerup', (e) => this.onPointerUp(e));
        window.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    }

    // Helper to draw sticker content with real branding/QR/logo
    drawStickerContent(ctx, cx, cy, radius, bgColor, applyBackReflection = false) {
        ctx.save();

        // Draw backing circle
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = bgColor;
        ctx.fill();

        // White border contour
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        // Inner dotted line
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.setLineDash([4, 4]);
        ctx.stroke();

        // Draw the preloaded real sticker image
        if (this.isImageLoaded) {
            ctx.beginPath();
            ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(this.stickerImg, cx - radius, cy - radius, radius * 2, radius * 2);
        }

        ctx.restore();

        // Draw custom label text on top (phone numbers or promo details)
        if (this.text) {
            ctx.save();
            ctx.translate(cx, cy);

            // Draw opaque backing plate for the text to ensure it looks professional
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.beginPath();
            ctx.roundRect(-radius * 0.7, radius * 0.2, radius * 1.4, radius * 0.35, 4);
            ctx.fill();

            ctx.font = `bold ${radius * 0.16}px 'Outfit', sans-serif`;
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.text, 0, radius * 0.38);
            ctx.restore();
        }
    }

    drawStuck() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawStickerContent(this.ctx, this.radius, this.radius, this.radius - 4, this.color);
    }

    onPointerDown(e) {
        if (this.state === 'STICKING') return;

        // Save initial coordinates to verify threshold drag
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.isPointerDown = true;
        this.hasMovedPastThreshold = false;

        const rect = this.container.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        this.lastPointerPos = { x: e.pageX, y: e.pageY };
    }

    onPointerMove(e) {
        if (!this.isPointerDown) return;

        const clientX = e.clientX;
        const clientY = e.clientY;

        // Check threshold distance
        if (!this.hasMovedPastThreshold) {
            const dist = Math.hypot(clientX - this.startX, clientY - this.startY);
            if (dist < this.dragThreshold) {
                return; // Suppress movement, click is just a tap
            }
            // Transitioning to active drag/peel!
            this.hasMovedPastThreshold = true;
            this.container.setPointerCapture(e.pointerId);

            const rect = this.container.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;

            const dx = px - this.radius;
            const dy = py - this.radius;
            const grabDist = Math.hypot(dx, dy);

            // If grabbed near outer edge (outer 35%), enter peeling physics
            const isNearEdge = grabDist > this.radius * 0.55;

            this.grabAngle = Math.atan2(dy, dx);
            this.grabPoint = {
                x: this.radius + Math.cos(this.grabAngle) * this.radius,
                y: this.radius + Math.sin(this.grabAngle) * this.radius
            };

            this.state = isNearEdge ? 'PEELING' : 'FLOATING';

            if (this.state === 'FLOATING') {
                this.container.classList.remove('sticker-stuck');
                this.container.classList.add('sticker-floating');

                // Absolute placement matching current location on page
                const bodyRect = document.body.getBoundingClientRect();
                this.x = rect.left - bodyRect.left;
                this.y = rect.top - bodyRect.top;

                this.container.style.position = 'absolute';
                this.container.style.left = `${this.x}px`;
                this.container.style.top = `${this.y}px`;
            }
        }

        // Handle Active Dragging Physics
        const currentPointer = { x: e.pageX, y: e.pageY };
        this.velocity = {
            x: currentPointer.x - this.lastPointerPos.x,
            y: currentPointer.y - this.lastPointerPos.y
        };
        this.lastPointerPos = currentPointer;

        if (this.state === 'PEELING') {
            const rect = this.container.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;

            const p1 = this.grabPoint;
            const p2 = { x: px, y: py };

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dragDistance = Math.hypot(dx, dy);

            // Detaches completely into floating 3D state once peeled past 1.5 radius
            if (dragDistance > this.radius * 1.5) {
                this.state = 'FLOATING';
                this.container.classList.remove('sticker-stuck');
                this.container.classList.add('sticker-floating');

                const parentRect = this.container.offsetParent ? this.container.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
                this.x = e.pageX - parentRect.left - this.dragOffset.x;
                this.y = e.pageY - parentRect.top - this.dragOffset.y;

                this.container.style.position = 'absolute';
                this.container.style.left = `${this.x}px`;
                this.container.style.top = `${this.y}px`;

                this.drawStuck();
                return;
            }

            this.renderPeel(p1, p2, dragDistance);
        } else if (this.state === 'FLOATING') {
            const parentRect = this.container.offsetParent ? this.container.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
            this.x = e.pageX - parentRect.left - this.dragOffset.x;
            this.y = e.pageY - parentRect.top - this.dragOffset.y;

            this.container.style.left = `${this.x}px`;
            this.container.style.top = `${this.y}px`;

            // Inertia-based elegant 3D tilt
            this.tiltX = Math.max(-15, Math.min(15, -this.velocity.y * 0.4));
            this.tiltY = Math.max(-15, Math.min(15, this.velocity.x * 0.4));

            this.container.style.transform = `perspective(600px) rotateX(${this.tiltX}deg) rotateY(${this.tiltY}deg) scale(1.1)`;
        }
    }

    onPointerUp(e) {
        this.isPointerDown = false;
        if (!this.hasMovedPastThreshold) {
            // It was a simple click, nothing was moved! No teleportation!
            return;
        }

        if (this.state === 'PEELING') {
            this.state = 'STICKING';
            this.animateSpringBack();
        } else if (this.state === 'FLOATING') {
            this.state = 'STICKING';

            // Validate drops against Kraft Bag, Wooden Table, and Storefront Glass Window
            const dropTarget = this.checkDropTargets(e.clientX, e.clientY);
            if (dropTarget) {
                this.stickToTarget(dropTarget, e.clientX, e.clientY);
            } else {
                this.stickToDesktop();
            }
        }
    }

    renderPeel(p1, p2, dragDistance) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        const r = this.radius;
        const cx = r, cy = r;

        // Calculate mid point of fold
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;

        const peelAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

        // Step 1: Draw stuck portion (clipped by the fold line)
        ctx.save();

        ctx.beginPath();
        const clipSize = this.width * 2;
        const foldNormalX = -Math.sin(peelAngle);
        const foldNormalY = Math.cos(peelAngle);

        ctx.moveTo(mx + foldNormalX * clipSize, my + foldNormalY * clipSize);
        ctx.lineTo(mx - foldNormalX * clipSize, my - foldNormalY * clipSize);

        const backDirX = -Math.cos(peelAngle);
        const backDirY = -Math.sin(peelAngle);
        ctx.lineTo(mx - foldNormalX * clipSize + backDirX * clipSize, my - foldNormalY * clipSize + backDirY * clipSize);
        ctx.lineTo(mx + foldNormalX * clipSize + backDirX * clipSize, my + foldNormalY * clipSize + backDirY * clipSize);
        ctx.closePath();
        ctx.clip();

        this.drawStickerContent(ctx, cx, cy, r - 4, this.color);
        ctx.restore();

        // Step 2: Draw the peeled flap (Reflected symmetrically)
        ctx.save();

        ctx.beginPath();
        ctx.moveTo(mx + foldNormalX * clipSize, my + foldNormalY * clipSize);
        ctx.lineTo(mx - foldNormalX * clipSize, my - foldNormalY * clipSize);
        ctx.lineTo(mx - foldNormalX * clipSize + Math.cos(peelAngle) * clipSize, my - foldNormalY * clipSize + Math.sin(peelAngle) * clipSize);
        ctx.lineTo(mx + foldNormalX * clipSize + Math.cos(peelAngle) * clipSize, my + foldNormalY * clipSize + Math.sin(peelAngle) * clipSize);
        ctx.closePath();
        ctx.clip();

        // Reflect coordinates symmetrically over fold line
        ctx.translate(mx, my);
        ctx.rotate(peelAngle);
        ctx.scale(-1, 1);
        ctx.rotate(-peelAngle);
        ctx.translate(-mx, -my);

        ctx.save();
        // Draw reflected side
        this.drawStickerContent(ctx, cx, cy, r - 4, 'rgba(255,255,255,0.95)', true);

        // Overlay beautiful silver foil reflection
        ctx.globalCompositeOperation = 'source-atop';
        const silverGrad = ctx.createLinearGradient(mx, my, p2.x, p2.y);
        silverGrad.addColorStop(0, 'rgba(225, 225, 230, 0.95)');
        silverGrad.addColorStop(0.3, 'rgba(242, 242, 247, 0.95)');
        silverGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
        silverGrad.addColorStop(0.7, 'rgba(230, 230, 235, 0.95)');
        silverGrad.addColorStop(1, 'rgba(190, 190, 195, 0.9)');

        ctx.fillStyle = silverGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Drop shadow near bend
        const shadowGrad = ctx.createLinearGradient(mx, my, mx + Math.cos(peelAngle) * 35, my + Math.sin(peelAngle) * 35);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0.3)');
        shadowGrad.addColorStop(0.5, 'rgba(0,0,0,0.1)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ctx.restore();

        // Step 3: Draw oclusion shadow under the curl on base layer
        ctx.save();
        const outerShadowGrad = ctx.createLinearGradient(mx, my, mx - Math.cos(peelAngle) * 18, my - Math.sin(peelAngle) * 18);
        outerShadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.28)');
        outerShadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = 'transparent';
        ctx.fillStyle = outerShadowGrad;

        ctx.beginPath();
        ctx.moveTo(mx + foldNormalX * r, my + foldNormalY * r);
        ctx.lineTo(mx - foldNormalX * r, my - foldNormalY * r);
        ctx.lineTo(mx - foldNormalX * r - Math.cos(peelAngle) * 18, my - foldNormalY * r - Math.sin(peelAngle) * 18);
        ctx.lineTo(mx + foldNormalX * r - Math.cos(peelAngle) * 18, my + foldNormalY * r - Math.sin(peelAngle) * 18);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    animateSpringBack() {
        this.container.classList.add('sticker-impact-bounce');
        setTimeout(() => {
            this.container.classList.remove('sticker-impact-bounce');
            this.state = 'STUCK';
            this.drawStuck();
        }, 450);
    }

    checkDropTargets(clientX, clientY) {
        const targetIds = ['kraft-bag', 'wooden-table', 'glass-window'];
        for (const id of targetIds) {
            const el = document.getElementById(id);
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            if (clientX >= rect.left && clientX <= rect.right &&
                clientY >= rect.top && clientY <= rect.bottom) {
                return el;
            }
        }
        return null;
    }

    stickToTarget(target, clientX, clientY) {
        const targetRect = target.getBoundingClientRect();

        const xOnTarget = clientX - targetRect.left - this.radius;
        const yOnTarget = clientY - targetRect.top - this.radius;

        this.container.style.position = 'absolute';
        this.container.style.left = `${xOnTarget}px`;
        this.container.style.top = `${yOnTarget}px`;
        this.container.style.transform = 'none';

        target.appendChild(this.container);

        this.applyImpactEffects();
    }

    stickToDesktop() {
        this.container.style.transform = 'none';
        this.applyImpactEffects();
    }

    applyImpactEffects() {
        this.container.classList.remove('sticker-floating');
        this.container.classList.add('sticker-impact-bounce');

        setTimeout(() => {
            this.container.classList.remove('sticker-impact-bounce');
            this.state = 'STUCK';
            this.drawStuck();
        }, 450);
    }
}

// Global script initialization
window.addEventListener('DOMContentLoaded', () => {
    const wrappers = document.querySelectorAll('.sticker-wrapper');
    wrappers.forEach(wrap => {
        new DigitalSticker(wrap);
    });

    // Custom design studio preloader
    const previewContainer = document.getElementById('preview-sticker-wrapper');
    let previewSticker = null;

    function updatePreview() {
        const textVal = document.getElementById('sticker-text-input').value;
        const colorVal = document.querySelector('#color-selectors button.ring-2').getAttribute('data-color');
        const imgVal = document.querySelector('#icon-selectors button.border-slate-800').getAttribute('data-img-url');

        previewContainer.innerHTML = '';
        previewContainer.setAttribute('data-sticker-img', imgVal);
        previewContainer.setAttribute('data-sticker-color', colorVal);

        previewSticker = new DigitalSticker(previewContainer, {
            imgUrl: imgVal,
            color: colorVal,
            text: textVal,
            width: 140,
            height: 140
        });
    }

    // Connect color select buttons
    const colorButtons = document.querySelectorAll('#color-selectors button');
    colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            colorButtons.forEach(b => b.className = b.className.replace('border-slate-800 ring-2 ring-slate-200', 'border-transparent'));
            btn.className = btn.className.replace('border-transparent', 'border-slate-800 ring-2 ring-slate-200');
            updatePreview();
        });
    });

    // Connect brand logos select buttons
    const iconButtons = document.querySelectorAll('#icon-selectors button');
    iconButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            iconButtons.forEach(b => b.className = b.className.replace('border-slate-800', 'border-slate-200'));
            btn.className = btn.className.replace('border-slate-200', 'border-slate-800');
            updatePreview();
        });
    });

    document.getElementById('sticker-text-input').addEventListener('input', updatePreview);

    // Click Generate button to spawn new sticker into sheet
    document.getElementById('generate-sticker-btn').addEventListener('click', () => {
        const textVal = document.getElementById('sticker-text-input').value;
        const colorVal = document.querySelector('#color-selectors button.ring-2').getAttribute('data-color');
        const imgVal = document.querySelector('#icon-selectors button.border-slate-800').getAttribute('data-img-url');

        const binder = document.querySelector('#sticker-sheet .grid');
        const gridCol = document.createElement('div');
        gridCol.className = 'w-36 h-36 relative flex flex-col items-center';

        const wrapEl = document.createElement('div');
        wrapEl.setAttribute('data-sticker-img', imgVal);
        wrapEl.setAttribute('data-sticker-color', colorVal);

        const labelSpan = document.createElement('span');
        labelSpan.className = 'text-xs font-semibold text-slate-400 mt-2';
        labelSpan.innerText = textVal || 'Adhesivo Custom';

        gridCol.appendChild(wrapEl);
        gridCol.appendChild(labelSpan);
        binder.appendChild(gridCol);

        new DigitalSticker(wrapEl, {
            imgUrl: imgVal,
            color: colorVal,
            text: textVal
        });

        // Soft spawn animation
        gridCol.style.opacity = '0';
        gridCol.style.transform = 'scale(0.3)';
        gridCol.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        setTimeout(() => {
            gridCol.style.opacity = '1';
            gridCol.style.transform = 'scale(1)';
        }, 50);
    });

    // Initial run
    updatePreview();
});
