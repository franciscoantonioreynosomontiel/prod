/**
 * KawaiiStickers Pro — 1:1 Milimetric Drag & Corner Peel System
 * Smooth, lag-free sticker peeling and unfolding.
 */

class DigitalSticker {
    constructor(container, options = {}) {
        this.container = container;

        this.imgUrl = container.getAttribute('data-sticker-img') || options.imgUrl || 'https://menutechdeveloper.github.io/bddImg/assets/mk/sticker1.png';
        this.color = container.getAttribute('data-sticker-color') || options.color || '#FFD1DC';
        this.text = options.text || '';

        this.width = 140;
        this.height = 140;
        this.radius = this.width / 2; // 70px

        this.isPointerDown = false;
        this.hasMovedPastThreshold = false;
        this.dragThreshold = 6; // 6px drag threshold to prevent click bugs

        this.startX = 0;
        this.startY = 0;
        this.offsetX = 0;
        this.offsetY = 0;

        // Image asset preloader
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

    drawStickerContent(ctx, cx, cy, radius, bgColor) {
        ctx.save();

        // Circular backing
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = bgColor;
        ctx.fill();

        // White border
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        // Inner dashed contour
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.setLineDash([4, 4]);
        ctx.stroke();

        // Draw image asset
        if (this.isImageLoaded) {
            ctx.beginPath();
            ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(this.stickerImg, cx - radius, cy - radius, radius * 2, radius * 2);
        }

        ctx.restore();

        // Text label
        if (this.text) {
            ctx.save();
            ctx.translate(cx, cy);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.roundRect(-radius * 0.7, radius * 0.2, radius * 1.4, radius * 0.35, 4);
            ctx.fill();

            ctx.font = `bold ${radius * 0.16}px 'Fredoka', sans-serif`;
            ctx.fillStyle = '#4A3E4E';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.text, 0, radius * 0.38);
            ctx.restore();
        }
    }

    // Flat Stuck State
    drawStuck() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawStickerContent(this.ctx, this.radius, this.radius, this.radius - 4, this.color);
    }

    // Corner Folded Peel State (Top-Left Corner Folded towards Center)
    drawPeeled() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        const r = this.radius; // 70px
        const cx = r, cy = r;
        const foldDist = 38; // Fold size in pixels

        // Step 1: Draw stuck portion clipped at the top-left corner fold line
        ctx.save();
        ctx.beginPath();
        // Polygon cutting off top-left corner (from (0, foldDist) to (foldDist, 0))
        ctx.moveTo(0, foldDist);
        ctx.lineTo(foldDist, 0);
        ctx.lineTo(this.width, 0);
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(0, this.height);
        ctx.closePath();
        ctx.clip();

        this.drawStickerContent(ctx, cx, cy, r - 4, this.color);
        ctx.restore();

        // Step 2: Draw the folded corner flap (reflected over line x + y = foldDist)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, foldDist);
        ctx.lineTo(foldDist, 0);
        ctx.lineTo(foldDist * 1.1, foldDist * 1.1);
        ctx.closePath();
        ctx.clip();

        // Silver adhesive back gradient
        const silverGrad = ctx.createLinearGradient(0, 0, foldDist, foldDist);
        silverGrad.addColorStop(0, 'rgba(235, 235, 240, 0.98)');
        silverGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
        silverGrad.addColorStop(1, 'rgba(200, 200, 205, 0.95)');

        ctx.fillStyle = silverGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
        ctx.fill();

        // Soft oclusion shadow along the fold line
        const shadowGrad = ctx.createLinearGradient(foldDist, 0, 0, foldDist);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0.25)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(0, 0, foldDist * 1.2, foldDist * 1.2);

        ctx.restore();
    }

    onPointerDown(e) {
        if (e.button !== undefined && e.button !== 0) return; // Main button only

        const rect = this.container.getBoundingClientRect();
        this.offsetX = e.clientX - rect.left;
        this.offsetY = e.clientY - rect.top;

        this.startX = e.clientX;
        this.startY = e.clientY;

        this.isPointerDown = true;
        this.hasMovedPastThreshold = false;
    }

    onPointerMove(e) {
        if (!this.isPointerDown) return;

        const clientX = e.clientX;
        const clientY = e.clientY;

        if (!this.hasMovedPastThreshold) {
            const dist = Math.hypot(clientX - this.startX, clientY - this.startY);
            if (dist < this.dragThreshold) return; // Suppress small click movements

            this.hasMovedPastThreshold = true;
            this.container.setPointerCapture(e.pointerId);

            // Promote to fixed position on document body for 1:1 milimetric dragging across entire screen
            this.container.style.position = 'fixed';
            this.container.style.left = `${clientX - this.offsetX}px`;
            this.container.style.top = `${clientY - this.offsetY}px`;

            this.container.classList.add('sticker-peeled-drag');
            this.drawPeeled(); // Render folded corner peel
        }

        // 1:1 Milimetric Drag: Position container directly under cursor offset
        this.container.style.left = `${clientX - this.offsetX}px`;
        this.container.style.top = `${clientY - this.offsetY}px`;
    }

    onPointerUp(e) {
        if (!this.isPointerDown) return;
        this.isPointerDown = false;

        if (!this.hasMovedPastThreshold) return; // Simple tap, do nothing

        this.container.classList.remove('sticker-peeled-drag');
        this.container.classList.add('sticker-unfold-bounce');

        // Play un-folding ("desdoblar") animation back to flat stuck state
        this.drawStuck();

        setTimeout(() => {
            this.container.classList.remove('sticker-unfold-bounce');
        }, 450);

        // Check if dropped over a surface mockup target
        const dropTarget = this.checkDropTargets(e.clientX, e.clientY);
        if (dropTarget) {
            const targetRect = dropTarget.getBoundingClientRect();
            const xOnTarget = e.clientX - targetRect.left - this.offsetX;
            const yOnTarget = e.clientY - targetRect.top - this.offsetY;

            this.container.style.position = 'absolute';
            this.container.style.left = `${xOnTarget}px`;
            this.container.style.top = `${yOnTarget}px`;

            dropTarget.appendChild(this.container);
        } else {
            // Keep absolute in page body where dropped
            const pageX = e.clientX + window.scrollX;
            const pageY = e.clientY + window.scrollY;

            this.container.style.position = 'absolute';
            this.container.style.left = `${pageX - this.offsetX}px`;
            this.container.style.top = `${pageY - this.offsetY}px`;

            document.body.appendChild(this.container);
        }
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
}

// Global script initialization
window.addEventListener('DOMContentLoaded', () => {
    const wrappers = document.querySelectorAll('.sticker-wrapper');
    wrappers.forEach(wrap => {
        new DigitalSticker(wrap);
    });

    // Custom design studio
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
            text: textVal
        });
    }

    // Connect color selection
    const colorButtons = document.querySelectorAll('#color-selectors button');
    colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            colorButtons.forEach(b => b.className = b.className.replace('border-slate-800 ring-2 ring-slate-200', 'border-transparent'));
            btn.className = btn.className.replace('border-transparent', 'border-slate-800 ring-2 ring-slate-200');
            updatePreview();
        });
    });

    // Connect brand logos selection
    const iconButtons = document.querySelectorAll('#icon-selectors button');
    iconButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            iconButtons.forEach(b => b.className = b.className.replace('border-slate-800', 'border-slate-200'));
            btn.className = btn.className.replace('border-slate-200', 'border-slate-800');
            updatePreview();
        });
    });

    document.getElementById('sticker-text-input').addEventListener('input', updatePreview);

    // Click Generate button
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
        labelSpan.className = 'text-xs font-kawaii font-semibold text-slate-400 mt-2';
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

    updatePreview();
});
