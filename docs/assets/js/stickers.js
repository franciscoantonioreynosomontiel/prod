/**
 * Interactive Digital Sticker Physics System
 * Powered by Canvas 2D math & CSS 3D transforms.
 */

class DigitalSticker {
    constructor(container, options = {}) {
        this.container = container;
        this.type = container.getAttribute('data-sticker-type') || options.type || 'star';
        this.color = container.getAttribute('data-sticker-color') || options.color || '#FFD1DC';
        this.text = options.text || '';

        this.width = options.width || 128;
        this.height = options.height || 128;
        this.radius = this.width / 2;

        // Coordinates & States
        // States: 'STUCK', 'PEELING', 'FLOATING', 'STICKING'
        this.state = 'STUCK';
        this.x = 0;
        this.y = 0;

        // Grab metrics
        this.grabAngle = 0;
        this.grabPoint = { x: 0, y: 0 };
        this.dragOffset = { x: 0, y: 0 };
        this.pointerPos = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.lastPointerPos = { x: 0, y: 0 };

        // Floating orientation
        this.tiltX = 0;
        this.tiltY = 0;

        this.initDOM();
        this.initEvents();
        this.drawStuck();
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

        // Put absolute positioning matching current layout offset initially
        this.container.style.width = `${this.width}px`;
        this.container.style.height = `${this.height}px`;
    }

    initEvents() {
        this.container.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        window.addEventListener('pointermove', (e) => this.onPointerMove(e));
        window.addEventListener('pointerup', (e) => this.onPointerUp(e));
        window.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    }

    // Helper to draw sticker content
    drawStickerContent(ctx, cx, cy, radius, bgColor) {
        // Draw circular border / backing
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = bgColor;
        ctx.fill();

        // White border contour
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        // Inner dotted line
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();

        // Draw icon/logo
        ctx.save();
        ctx.translate(cx, cy);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let emoji = '⭐';
        if (this.type === 'donut') emoji = '🍩';
        if (this.type === 'magic-cat') emoji = '🐱';
        if (this.type === 'planet') emoji = '🪐';
        if (this.type === 'hello-world') emoji = '💻';
        if (this.type === 'heart') emoji = '💖';
        if (this.type === 'smile') emoji = '😊';
        if (this.type === 'cloud') emoji = '☁️';
        if (this.type === 'sparkles') emoji = '✨';

        ctx.font = `${radius * 0.75}px sans-serif`;
        ctx.fillText(emoji, 0, -radius * 0.1);

        // Optional sticker text (custom labels)
        if (this.text) {
            ctx.font = `bold ${radius * 0.22}px 'Outfit', sans-serif`;
            ctx.fillStyle = '#1e293b';
            ctx.fillText(this.text, 0, radius * 0.45);
        }
        ctx.restore();
    }

    drawStuck() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawStickerContent(this.ctx, this.radius, this.radius, this.radius - 4, this.color);
    }

    onPointerDown(e) {
        if (this.state === 'STICKING') return;
        e.preventDefault();
        this.container.setPointerCapture(e.pointerId);

        const rect = this.container.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;

        // Calculate distance from center to find grab angle
        const dx = px - this.radius;
        const dy = py - this.radius;
        const dist = Math.hypot(dx, dy);

        // We only allow peeling if grab is near the edges (outer 30% margin)
        const isNearEdge = dist > this.radius * 0.65;

        this.grabAngle = Math.atan2(dy, dx);

        // Save the exact edge point where peeling begins
        this.grabPoint = {
            x: this.radius + Math.cos(this.grabAngle) * this.radius,
            y: this.radius + Math.sin(this.grabAngle) * this.radius
        };

        this.dragOffset = { x: px, y: py };
        this.state = isNearEdge ? 'PEELING' : 'FLOATING';

        if (this.state === 'FLOATING') {
            this.container.classList.remove('sticker-stuck');
            this.container.classList.add('sticker-floating');

            // Promote to absolute body position
            const bodyRect = document.body.getBoundingClientRect();
            this.x = rect.left - bodyRect.left;
            this.y = rect.top - bodyRect.top;

            this.container.style.position = 'absolute';
            this.container.style.left = `${this.x}px`;
            this.container.style.top = `${this.y}px`;
        }

        this.lastPointerPos = { x: e.pageX, y: e.pageY };
    }

    onPointerMove(e) {
        if (this.state === 'STUCK' || this.state === 'STICKING') return;

        const currentPointer = { x: e.pageX, y: e.pageY };

        // Calculate velocity for interactive tilt
        this.velocity = {
            x: currentPointer.x - this.lastPointerPos.x,
            y: currentPointer.y - this.lastPointerPos.y
        };
        this.lastPointerPos = currentPointer;

        if (this.state === 'PEELING') {
            const rect = this.container.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;

            // Compute peeling math
            // The curl fold line lies exactly halfway between the grabPoint and the current pointer
            const p1 = this.grabPoint;
            const p2 = { x: px, y: py };

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dragDistance = Math.hypot(dx, dy);

            // If dragged completely past center/diameter, it completely detaches!
            if (dragDistance > this.radius * 1.5) {
                this.state = 'FLOATING';
                this.container.classList.remove('sticker-stuck');
                this.container.classList.add('sticker-floating');

                // Get absolute page offset
                const bodyRect = document.body.getBoundingClientRect();
                const parentRect = this.container.offsetParent ? this.container.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
                this.x = e.pageX - parentRect.left - this.dragOffset.x;
                this.y = e.pageY - parentRect.top - this.dragOffset.y;

                this.container.style.position = 'absolute';
                this.container.style.left = `${this.x}px`;
                this.container.style.top = `${this.y}px`;

                this.drawStuck(); // Render completely circular sticker again
                return;
            }

            this.renderPeel(p1, p2, dragDistance);
        } else if (this.state === 'FLOATING') {
            // Drag circular sticker smoothly following pointer
            const parentRect = this.container.offsetParent ? this.container.offsetParent.getBoundingClientRect() : { left: 0, top: 0 };
            this.x = e.pageX - parentRect.left - this.dragOffset.x;
            this.y = e.pageY - parentRect.top - this.dragOffset.y;

            this.container.style.left = `${this.x}px`;
            this.container.style.top = `${this.y}px`;

            // Calculate elegant 3D tilt based on velocity
            this.tiltX = Math.max(-15, Math.min(15, -this.velocity.y * 0.4));
            this.tiltY = Math.max(-15, Math.min(15, this.velocity.x * 0.4));

            this.container.style.transform = `perspective(600px) rotateX(${this.tiltX}deg) rotateY(${this.tiltY}deg) scale(1.1)`;
        }
    }

    onPointerUp(e) {
        if (this.state === 'STUCK' || this.state === 'STICKING') return;

        if (this.state === 'PEELING') {
            // Spring back if let go mid-peel
            this.state = 'STICKING';
            this.animateSpringBack();
        } else if (this.state === 'FLOATING') {
            this.state = 'STICKING';

            // Check for valid workspace drops (Laptop, Phone, Notebook)
            const dropTarget = this.checkDropTargets(e.clientX, e.clientY);
            if (dropTarget) {
                this.stickToTarget(dropTarget, e.clientX, e.clientY);
            } else {
                // Otherwise stick exactly where it was let go
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

        // Angle of curl perpendicular fold
        const peelAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

        // Step 1: Draw the stuck portion of sticker (clipped by the fold line)
        ctx.save();

        // Define clipping path
        ctx.beginPath();
        // Big polygon covering the stuck side
        const clipSize = this.width * 2;
        const foldNormalX = -Math.sin(peelAngle);
        const foldNormalY = Math.cos(peelAngle);

        // Define half-space clipping box
        ctx.moveTo(mx + foldNormalX * clipSize, my + foldNormalY * clipSize);
        ctx.lineTo(mx - foldNormalX * clipSize, my - foldNormalY * clipSize);
        // Extend to the non-peeled side (opposite direction of drag vector p2 - p1)
        const backDirX = -Math.cos(peelAngle);
        const backDirY = -Math.sin(peelAngle);
        ctx.lineTo(mx - foldNormalX * clipSize + backDirX * clipSize, my - foldNormalY * clipSize + backDirY * clipSize);
        ctx.lineTo(mx + foldNormalX * clipSize + backDirX * clipSize, my + foldNormalY * clipSize + backDirY * clipSize);
        ctx.closePath();
        ctx.clip();

        // Draw standard flat backing sticker inside clip path
        this.drawStickerContent(ctx, cx, cy, r - 4, this.color);
        ctx.restore();

        // Step 2: Draw the peeled flap (Reflected symmetrical segment)
        ctx.save();

        // Clip to the peeled half-space region (towards the drag vector)
        ctx.beginPath();
        ctx.moveTo(mx + foldNormalX * clipSize, my + foldNormalY * clipSize);
        ctx.lineTo(mx - foldNormalX * clipSize, my - foldNormalY * clipSize);
        ctx.lineTo(mx - foldNormalX * clipSize + Math.cos(peelAngle) * clipSize, my - foldNormalY * clipSize + Math.sin(peelAngle) * clipSize);
        ctx.lineTo(mx + foldNormalX * clipSize + Math.cos(peelAngle) * clipSize, my + foldNormalY * clipSize + Math.sin(peelAngle) * clipSize);
        ctx.closePath();
        ctx.clip();

        // Reflect coordinate system over fold line to draw the flipped sticker portion!
        ctx.translate(mx, my);
        ctx.rotate(peelAngle);
        ctx.scale(-1, 1);
        ctx.rotate(-peelAngle);
        ctx.translate(-mx, -my);

        // Draw the reflected sticker backing (slightly darker for backside transition)
        ctx.save();
        this.drawStickerContent(ctx, cx, cy, r - 4, 'rgba(255,255,255,0.95)');

        // Draw elegant silver reflection backing (vinyl foil aesthetic)
        ctx.globalCompositeOperation = 'source-atop';
        const silverGrad = ctx.createLinearGradient(mx, my, p2.x, p2.y);
        silverGrad.addColorStop(0, 'rgba(220, 220, 225, 0.95)');
        silverGrad.addColorStop(0.3, 'rgba(240, 240, 245, 0.95)');
        silverGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
        silverGrad.addColorStop(0.7, 'rgba(225, 225, 230, 0.95)');
        silverGrad.addColorStop(1, 'rgba(180, 180, 185, 0.9)');

        ctx.fillStyle = silverGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Soft 3D shadow near the bend line inside fold
        const shadowGrad = ctx.createLinearGradient(mx, my, mx + Math.cos(peelAngle) * 30, my + Math.sin(peelAngle) * 30);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0.3)');
        shadowGrad.addColorStop(0.5, 'rgba(0,0,0,0.1)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ctx.restore();

        // Step 3: Draw a dark drop shadow along the fold line on the base layer
        ctx.save();
        const outerShadowGrad = ctx.createLinearGradient(mx, my, mx - Math.cos(peelAngle) * 16, my - Math.sin(peelAngle) * 16);
        outerShadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
        outerShadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = 'transparent';
        ctx.fillStyle = outerShadowGrad;

        ctx.beginPath();
        ctx.moveTo(mx + foldNormalX * r, my + foldNormalY * r);
        ctx.lineTo(mx - foldNormalX * r, my - foldNormalY * r);
        ctx.lineTo(mx - foldNormalX * r - Math.cos(peelAngle) * 16, my - foldNormalY * r - Math.sin(peelAngle) * 16);
        ctx.lineTo(mx + foldNormalX * r - Math.cos(peelAngle) * 16, my + foldNormalY * r - Math.sin(peelAngle) * 16);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    animateSpringBack() {
        const startState = {
            p2: { x: this.grabPoint.x, y: this.grabPoint.y }
        };

        this.container.classList.add('sticker-impact-bounce');
        setTimeout(() => {
            this.container.classList.remove('sticker-impact-bounce');
            this.state = 'STUCK';
            this.drawStuck();
        }, 450);
    }

    checkDropTargets(clientX, clientY) {
        const targetIds = ['laptop-screen', 'phone-body', 'notebook-body'];
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

        // Calculate offset coordinates relative to target element
        const xOnTarget = clientX - targetRect.left - this.radius;
        const yOnTarget = clientY - targetRect.top - this.radius;

        // Move container inside the target DOM so it scrolls / scales perfectly
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

// Global script initialisation
window.addEventListener('DOMContentLoaded', () => {
    const wrappers = document.querySelectorAll('.sticker-wrapper');
    wrappers.forEach(wrap => {
        new DigitalSticker(wrap);
    });

    // Handle Custom Sticker Studio Generation
    const previewContainer = document.getElementById('preview-sticker-wrapper');
    let previewSticker = null;

    function updatePreview() {
        const textVal = document.getElementById('sticker-text-input').value;
        const colorVal = document.querySelector('#color-selectors button.ring-2').getAttribute('data-color');
        const iconVal = document.querySelector('#icon-selectors button.border-slate-800').getAttribute('data-icon');

        previewContainer.innerHTML = '';
        previewContainer.setAttribute('data-sticker-type', iconVal);
        previewContainer.setAttribute('data-sticker-color', colorVal);

        previewSticker = new DigitalSticker(previewContainer, {
            type: iconVal,
            color: colorVal,
            text: textVal,
            width: 128,
            height: 128
        });
    }

    // Connect control elements
    const colorButtons = document.querySelectorAll('#color-selectors button');
    colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            colorButtons.forEach(b => b.className = b.className.replace('border-slate-800 ring-2 ring-slate-200', 'border-transparent'));
            btn.className = btn.className.replace('border-transparent', 'border-slate-800 ring-2 ring-slate-200');
            updatePreview();
        });
    });

    const iconButtons = document.querySelectorAll('#icon-selectors button');
    iconButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            iconButtons.forEach(b => b.className = b.className.replace('border-slate-800', 'border-slate-200'));
            btn.className = btn.className.replace('border-slate-200', 'border-slate-800');
            updatePreview();
        });
    });

    document.getElementById('sticker-text-input').addEventListener('input', updatePreview);

    // Click Generate/Print Sticker button to spawn it into the binder
    document.getElementById('generate-sticker-btn').addEventListener('click', () => {
        const textVal = document.getElementById('sticker-text-input').value;
        const colorVal = document.querySelector('#color-selectors button.ring-2').getAttribute('data-color');
        const iconVal = document.querySelector('#icon-selectors button.border-slate-800').getAttribute('data-icon');

        // Spawn a new sticker element in the center of the binder page grid
        const binder = document.querySelector('#sticker-sheet .grid');
        const gridCol = document.createElement('div');
        gridCol.className = 'w-32 h-32 relative flex items-center justify-center';

        const wrapEl = document.createElement('div');
        wrapEl.setAttribute('data-sticker-type', iconVal);
        wrapEl.setAttribute('data-sticker-color', colorVal);

        gridCol.appendChild(wrapEl);
        binder.appendChild(gridCol);

        new DigitalSticker(wrapEl, {
            type: iconVal,
            color: colorVal,
            text: textVal
        });

        // Soft spawn animation for generated grid item
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
