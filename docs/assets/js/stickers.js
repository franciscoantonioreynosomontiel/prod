/**
 * High-Fidelity Interactive Digital Sticker Physics System
 * Powered by centered-canvas page curl simulation & CSS 3D transforms.
 */

class DigitalSticker {
    constructor(container, options = {}) {
        this.container = container;

        // Load sticker asset URLs from data attributes or defaults
        this.imgUrl = container.getAttribute('data-sticker-img') || options.imgUrl || 'https://menutechdeveloper.github.io/bddImg/assets/mk/sticker1.png';
        this.color = container.getAttribute('data-sticker-color') || options.color || '#FFE0B2';
        this.text = options.text || '';

        // Fixed dimension parameters
        this.width = 140;
        this.height = 140;
        this.radius = this.width / 2; // 70px

        // States: 'STUCK', 'PEELING', 'FLOATING', 'STICKING'
        this.state = 'STUCK';
        this.x = 0;
        this.y = 0;

        // Interaction coordinates
        this.startX = 0;
        this.startY = 0;
        this.isPointerDown = false;
        this.dragThreshold = 6; // Click suppression threshold
        this.hasMovedPastThreshold = false;

        // Vector tracking
        this.grabPoint = { x: 0, y: 0 };
        this.dragOffset = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.lastPointerPos = { x: 0, y: 0 };

        // Floating orientation parameters
        this.tiltX = 0;
        this.tiltY = 0;

        // Image preloader
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
        // Center a larger 280x280 canvas to allow the curl to peel off in any direction without clipping
        this.canvasSize = 280;
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.canvasSize * window.devicePixelRatio;
        this.canvas.height = this.canvasSize * window.devicePixelRatio;
        this.canvas.style.width = `${this.canvasSize}px`;
        this.canvas.style.height = `${this.canvasSize}px`;
        this.canvas.style.position = 'absolute';

        // Center the 280x280 canvas exactly over the 140x140 container
        this.canvas.style.left = '-70px';
        this.canvas.style.top = '-70px';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.className = 'sticker-canvas';

        this.ctx = this.canvas.getContext('2d');
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        this.container.classList.add('sticker-element');
        this.container.appendChild(this.canvas);

        // Set fixed container dimension
        this.container.style.width = `${this.width}px`;
        this.container.style.height = `${this.height}px`;
        this.container.style.position = 'relative';
    }

    initEvents() {
        this.container.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        window.addEventListener('pointermove', (e) => this.onPointerMove(e));
        window.addEventListener('pointerup', (e) => this.onPointerUp(e));
        window.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    }

    // Centered drawing helper
    drawStickerContent(ctx, cx, cy, radius, bgColor) {
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

        // Custom label text (phone / details)
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
        this.ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);
        // Center is (140, 140) inside the 280x280 canvas
        this.drawStickerContent(this.ctx, 140, 140, this.radius - 4, this.color);
    }

    onPointerDown(e) {
        if (this.state === 'STICKING') return;

        // Save initial coordinates to verify threshold drag
        this.startX = e.pageX;
        this.startY = e.pageY;
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

        // Calculate drag distance
        const dx = e.pageX - this.startX;
        const dy = e.pageY - this.startY;
        const dist = Math.hypot(dx, dy);

        if (!this.hasMovedPastThreshold) {
            if (dist < this.dragThreshold) {
                return; // Suppress movement, click is just a tap
            }
            // Transitioning to active drag/peel!
            this.hasMovedPastThreshold = true;
            this.container.setPointerCapture(e.pointerId);

            // Determine grab angle relative to sticker center
            const rect = this.container.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            const rx = clickX - this.radius;
            const ry = clickY - this.radius;
            const grabAngle = Math.atan2(ry, rx);

            // Grab point starts at the exact outer edge in the direction of the grab
            this.grabPoint = {
                x: 140 + Math.cos(grabAngle) * this.radius,
                y: 140 + Math.sin(grabAngle) * this.radius
            };

            // Only peel if dragging from near edge, otherwise just float/drag immediately
            const isNearEdge = Math.hypot(rx, ry) > this.radius * 0.55;
            this.state = isNearEdge ? 'PEELING' : 'FLOATING';

            if (this.state === 'FLOATING') {
                this.container.classList.remove('sticker-stuck');
                this.container.classList.add('sticker-floating');

                // Lift container to body space absolute placement to avoid relative clipping
                const bodyRect = document.body.getBoundingClientRect();
                this.x = rect.left - bodyRect.left;
                this.y = rect.top - bodyRect.top;

                this.container.style.position = 'absolute';
                this.container.style.left = `${this.x}px`;
                this.container.style.top = `${this.y}px`;
                this.container.style.zIndex = '1000';
            }
        }

        // Active dragging state machine
        this.velocity = {
            x: e.pageX - this.lastPointerPos.x,
            y: e.pageY - this.lastPointerPos.y
        };
        this.lastPointerPos = { x: e.pageX, y: e.pageY };

        if (this.state === 'PEELING') {
            // During peeling, container stays static. The canvas renders the curl!
            // The curl follows the mouse drag. Max distance to fully peel is 140px (the diameter)
            if (dist > this.width) {
                // Completely peeled off! Transition to FLOATING state.
                this.state = 'FLOATING';
                this.container.classList.remove('sticker-stuck');
                this.container.classList.add('sticker-floating');

                const rect = this.container.getBoundingClientRect();
                const bodyRect = document.body.getBoundingClientRect();
                const parentRect = this.container.offsetParent ? this.container.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
                this.x = e.pageX - parentRect.left - this.dragOffset.x;
                this.y = e.pageY - parentRect.top - this.dragOffset.y;

                this.container.style.position = 'absolute';
                this.container.style.left = `${this.x}px`;
                this.container.style.top = `${this.y}px`;
                this.container.style.zIndex = '1000';

                this.drawStuck();
                return;
            }

            // Render peeling using the drag vector
            this.renderPeel(this.grabPoint, dx, dy, dist);
        } else if (this.state === 'FLOATING') {
            const parentRect = this.container.offsetParent ? this.container.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
            this.x = e.pageX - parentRect.left - this.dragOffset.x;
            this.y = e.pageY - parentRect.top - this.dragOffset.y;

            this.container.style.left = `${this.x}px`;
            this.container.style.top = `${this.y}px`;

            // Elegant inertial tilting
            this.tiltX = Math.max(-15, Math.min(15, -this.velocity.y * 0.4));
            this.tiltY = Math.max(-15, Math.min(15, this.velocity.x * 0.4));

            this.container.style.transform = `perspective(600px) rotateX(${this.tiltX}deg) rotateY(${this.tiltY}deg) scale(1.1)`;
        }
    }

    onPointerUp(e) {
        this.isPointerDown = false;
        if (!this.hasMovedPastThreshold) return;

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

    renderPeel(grabPoint, dx, dy, dist) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);

        const r = this.radius;
        const cx = 140, cy = 140;

        // Current peeled pointer relative to the grab point on canvas
        const p1 = grabPoint;
        const p2 = {
            x: grabPoint.x + dx,
            y: grabPoint.y + dy
        };

        // Mid point of the segment is on the fold line
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;

        const peelAngle = Math.atan2(dy, dx);

        // Step 1: Draw the stuck portion of sticker (clipped by the fold line)
        ctx.save();

        ctx.beginPath();
        const clipSize = this.canvasSize * 2;
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

        // Step 2: Draw the peeled flap (Reflected symmetrically over fold line)
        ctx.save();

        ctx.beginPath();
        ctx.moveTo(mx + foldNormalX * clipSize, my + foldNormalY * clipSize);
        ctx.lineTo(mx - foldNormalX * clipSize, my - foldNormalY * clipSize);
        ctx.lineTo(mx - foldNormalX * clipSize + Math.cos(peelAngle) * clipSize, my - foldNormalY * clipSize + Math.sin(peelAngle) * clipSize);
        ctx.lineTo(mx + foldNormalX * clipSize + Math.cos(peelAngle) * clipSize, my + foldNormalY * clipSize + Math.sin(peelAngle) * clipSize);
        ctx.closePath();
        ctx.clip();

        // Symmetrical reflection transformation over fold line at Midpoint
        ctx.translate(mx, my);
        ctx.rotate(peelAngle);
        ctx.scale(-1, 1);
        ctx.rotate(-peelAngle);
        ctx.translate(-mx, -my);

        ctx.save();
        // Draw sticker backside backing
        this.drawStickerContent(ctx, cx, cy, r - 4, 'rgba(255,255,255,0.95)');

        // Overlay vinyl silver foil reflection
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

        // Step 3: Draw soft oclusion shadow under the curl on the base layer
        ctx.save();
        const outerShadowGrad = ctx.createLinearGradient(mx, my, mx - Math.cos(peelAngle) * 20, my - Math.sin(peelAngle) * 20);
        outerShadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        outerShadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = 'transparent';
        ctx.fillStyle = outerShadowGrad;

        ctx.beginPath();
        ctx.moveTo(mx + foldNormalX * r, my + foldNormalY * r);
        ctx.lineTo(mx - foldNormalX * r, my - foldNormalY * r);
        ctx.lineTo(mx - foldNormalX * r - Math.cos(peelAngle) * 20, my - foldNormalY * r - Math.sin(peelAngle) * 20);
        ctx.lineTo(mx + foldNormalX * r - Math.cos(peelAngle) * 20, my + foldNormalY * r - Math.sin(peelAngle) * 20);
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
