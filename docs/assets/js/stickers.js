/**
 * KawaiiStickers Pro — Major Diagonal Corner Peel & 1:1 Drag System
 * Matches physical sticker peel aesthetics with mathematically exact circular fold.
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

    // Circular Folded Peel State (White Adhesive Backing + Circular Arc Reflection)
    drawPeeled() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        const r = this.radius; // 70px
        const cx = r, cy = r;
        const R = r - 4; // 66px

        // Diagonal fold line x + y = d
        const d = 86;

        // Step 1: Draw remaining stuck portion in region x + y >= d
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(d, 0);
        ctx.lineTo(this.width, 0);
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(0, this.height);
        ctx.lineTo(0, d);
        ctx.closePath();
        ctx.clip();

        this.drawStickerContent(ctx, cx, cy, R, this.color);
        ctx.restore();

        // Step 2: Draw the reflected circular flap (white paper backing) in region x + y >= d
        const refCx = d - cx; // 86 - 70 = 16
        const refCy = d - cy; // 16

        ctx.save();
        // Clip to half plane x + y >= d
        ctx.beginPath();
        ctx.moveTo(d, 0);
        ctx.lineTo(this.width, 0);
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(0, this.height);
        ctx.lineTo(0, d);
        ctx.closePath();
        ctx.clip();

        // Draw reflected circle path
        ctx.beginPath();
        ctx.arc(refCx, refCy, R, 0, Math.PI * 2);

        // White paper / adhesive backing fill gradient
        const paperGrad = ctx.createLinearGradient(0, d, d, 0);
        paperGrad.addColorStop(0, '#EAEFF5');
        paperGrad.addColorStop(0.4, '#F8FAFC');
        paperGrad.addColorStop(1, '#FFFFFF');

        ctx.fillStyle = paperGrad;
        ctx.fill();

        // Outer white border and subtle contour on the turned flap
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.stroke();

        // Soft 3D occlusion shadow line along fold line x + y = d
        ctx.beginPath();
        ctx.moveTo(0, d);
        ctx.lineTo(d, 0);
        ctx.lineWidth = 6;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.stroke();

        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.stroke();

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
            this.drawPeeled(); // Render circular fold
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
});
