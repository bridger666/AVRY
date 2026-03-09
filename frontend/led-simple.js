/**
 * LED Panel Background Animation - Canvas-Based
 * Creates a dot matrix LED display with glow effects
 */

class LEDPanel {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dots = [];
        this.litDots = new Set();
        this.frame = 0;
        
        // LED colors
        this.colors = ['#4b47d6', '#5b5bef', '#75fbc4'];
        
        // Grid settings
        this.dotRadius = 3;
        this.spacing = 25;
        this.cols = 0;
        this.rows = 0;
        
        // Animation settings
        this.maxLitDots = 40;
        this.fadeSpeed = 0.05;
        
        this.init();
    }
    
    init() {
        // Set canvas size
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Create dot grid
        this.createGrid();
        
        // Light up initial dots
        this.lightUpInitialDots(30);
        
        console.log(`LED Panel: Initialized ${this.dots.length} dots (${this.cols}x${this.rows})`);
        console.log(`LED Panel: ${this.litDots.size} dots initially lit`);
        
        // Start animation
        this.animate();
    }
    
    resize() {
        const hero = this.canvas.parentElement;
        this.canvas.width = hero.offsetWidth;
        this.canvas.height = hero.offsetHeight;
        console.log(`LED Panel: Canvas resized to ${this.canvas.width}x${this.canvas.height}`);
    }
    
    createGrid() {
        this.dots = [];
        this.cols = Math.floor(this.canvas.width / this.spacing);
        this.rows = Math.floor(this.canvas.height / this.spacing);
        
        const offsetX = (this.canvas.width - (this.cols * this.spacing)) / 2;
        const offsetY = (this.canvas.height - (this.rows * this.spacing)) / 2;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.dots.push({
                    x: offsetX + col * this.spacing + this.spacing / 2,
                    y: offsetY + row * this.spacing + this.spacing / 2,
                    opacity: 0,
                    targetOpacity: 0,
                    color: null,
                    index: this.dots.length
                });
            }
        }
    }
    
    lightUpInitialDots(count) {
        for (let i = 0; i < count; i++) {
            const idx = Math.floor(Math.random() * this.dots.length);
            const dot = this.dots[idx];
            dot.color = this.colors[Math.floor(Math.random() * this.colors.length)];
            dot.opacity = 1;
            dot.targetOpacity = 1;
            this.litDots.add(idx);
        }
    }
    
    animate() {
        this.frame++;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw dots
        this.dots.forEach((dot, idx) => {
            // Fade towards target opacity
            if (dot.opacity < dot.targetOpacity) {
                dot.opacity = Math.min(dot.opacity + this.fadeSpeed, dot.targetOpacity);
            } else if (dot.opacity > dot.targetOpacity) {
                dot.opacity = Math.max(dot.opacity - this.fadeSpeed, dot.targetOpacity);
                if (dot.opacity === 0) {
                    this.litDots.delete(idx);
                }
            }
            
            // Draw dot if visible
            if (dot.opacity > 0) {
                this.drawDot(dot);
            }
        });
        
        // Random animation: turn some dots on/off
        if (this.frame % 20 === 0) {
            // Turn off some dots
            const litArray = Array.from(this.litDots);
            for (let i = 0; i < 3; i++) {
                if (litArray.length > 0) {
                    const randomIdx = litArray[Math.floor(Math.random() * litArray.length)];
                    this.dots[randomIdx].targetOpacity = 0;
                }
            }
            
            // Turn on new dots
            const dotsToAdd = this.maxLitDots - this.litDots.size;
            for (let i = 0; i < Math.min(5, dotsToAdd); i++) {
                const idx = Math.floor(Math.random() * this.dots.length);
                if (!this.litDots.has(idx)) {
                    const dot = this.dots[idx];
                    dot.color = this.colors[Math.floor(Math.random() * this.colors.length)];
                    dot.targetOpacity = 1;
                    this.litDots.add(idx);
                }
            }
        }
        
        // Log every 60 frames
        if (this.frame % 60 === 0) {
            console.log(`LED Panel: Frame ${this.frame}, Lit dots: ${this.litDots.size}`);
        }
        
        requestAnimationFrame(() => this.animate());
    }
    
    drawDot(dot) {
        const ctx = this.ctx;
        
        // Draw glow
        ctx.save();
        ctx.globalAlpha = dot.opacity * 0.6;
        ctx.shadowBlur = 15;
        ctx.shadowColor = dot.color;
        ctx.fillStyle = dot.color;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, this.dotRadius + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Draw core
        ctx.save();
        ctx.globalAlpha = dot.opacity;
        ctx.fillStyle = dot.color;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, this.dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    console.log('LED Panel: Starting initialization...');
    
    const hero = document.querySelector('.hero');
    if (!hero) {
        console.error('LED Panel: Hero section not found');
        return;
    }
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'led-bg';
    hero.insertBefore(canvas, hero.firstChild);
    
    console.log('LED Panel: Canvas created and inserted');
    
    // Initialize LED panel
    const ledPanel = new LEDPanel(canvas);
    
    console.log('LED Panel: Animation started successfully');
});
