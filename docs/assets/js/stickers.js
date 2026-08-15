/**
 * KawaiiStickers Pro — Major Diagonal Corner Peel & 1:1 Drag System
 * Matches physical sticker peel aesthetics with major diagonal curl.
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
        this.dragThreshold = 6; // 6px click suppression

        this.startX = 0;
        this.startY = 0;
        this.offsetX = 0;
        this.offsetY = 0;

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

        // Optional custom text plate
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

    // Major Diagonal Corner Folded Peel State (Matching exampleSticker.png)
    drawPeeled() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        const r = this.radius; // 70px
        const cx = r, cy = r;

        // Major fold line cutting across upper-left diagonal (from (0, 88) to (88, 0))
        const foldA = 88;

        // Step 1: Draw stuck portion clipped at diagonal fold line
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, foldA);
        ctx.lineTo(foldA, 0);
        ctx.lineTo(this.width, 0);
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(0, this.height);
        ctx.closePath();
        ctx.clip();

        this.drawStickerContent(ctx, cx, cy, r - 4, this.color);
        ctx.restore();

        // Step 2: Draw the major folded corner flap (reflected symmetrically over x + y = foldA)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(0, foldA);
        ctx.lineTo(foldA, 0);
        // Extended flap peak towards center
        ctx.lineTo(foldA * 1.15, foldA * 1.15);
        ctx.closePath();
        ctx.clip();

        // Rich metallic gold/silver adhesive back gradient as shown in exampleSticker.png
        const goldGrad = ctx.createLinearGradient(0, 0, foldA, foldA);
        goldGrad.addColorStop(0, '#E5C158');
        goldGrad.addColorStop(0.3, '#FDF2A9');
        goldGrad.addColorStop(0.6, '#D4A838');
        goldGrad.addColorStop(1, '#9E781B');

        ctx.fillStyle = goldGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
        ctx.fill();

        // Outer rim border on flap
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        // Soft 3D oclusion shadow along the fold line
        const shadowGrad = ctx.createLinearGradient(foldA, 0, 0, foldA);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0.35)');
        shadowGrad.addColorStop(0.5, 'rgba(0,0,0,0.12)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(0, 0, foldA * 1.3, foldA * 1.3);

        ctx.restore();
    }

    onPointerDown(e) {
        if (e.button !== undefined && e.button !== 0) return;

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
            if (dist < this.dragThreshold) return;

            this.hasMovedPastThreshold = true;
            this.container.setPointerCapture(e.pointerId);

            // Fixed positioning on body level to allow 1:1 milimetric dragging across entire screen
            this.container.style.position = 'fixed';
            this.container.style.left = `${clientX - this.offsetX}px`;
            this.container.style.top = `${clientY - this.offsetY}px`;

            this.container.classList.add('sticker-peeled-drag');
            this.drawPeeled(); // Render major diagonal fold
        }

        // 1:1 Milimetric Pointer Tracking
        this.container.style.left = `${clientX - this.offsetX}px`;
        this.container.style.top = `${clientY - this.offsetY}px`;
    }

    onPointerUp(e) {
        if (!this.isPointerDown) return;
        this.isPointerDown = false;

        if (!this.hasMovedPastThreshold) return;

        this.container.classList.remove('sticker-peeled-drag');
        this.container.classList.add('sticker-unfold-bounce');

        // Un-folding ("desdoblar") animation back to flat
        this.drawStuck();

        setTimeout(() => {
            this.container.classList.remove('sticker-unfold-bounce');
        }, 450);

        // Check if dropped over a surface target
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

// Global initialization
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

        const spawnZone = document.querySelector('#welcome');
        const wrapEl = document.createElement('div');
        wrapEl.setAttribute('data-sticker-img', imgVal);
        wrapEl.setAttribute('data-sticker-color', colorVal);
        wrapEl.style.position = 'absolute';
        wrapEl.style.top = '100px';
        wrapEl.style.right = '40px';

        spawnZone.appendChild(wrapEl);

        new DigitalSticker(wrapEl, {
            imgUrl: imgVal,
            color: colorVal,
            text: textVal
        });
    });

    updatePreview();
});
