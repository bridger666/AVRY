/**
 * LED Hero Background Animation
 * Matrix-style digital rain with chaotic cascading dots
 * Masks text/CTA areas to prevent overlap
 */

class LEDHeroBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas element not found:', canvasId);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.dots = [];
        this.columns = [];
        this.animationFrame = null;
        
        // Configuration
        this.config = {
            dotRadius: 2,
            dotSpacing: 15,
            defaultColor: '#4a3df4',
            litColors: ['#7b7bff', '#3dd3a8', '#4a3df4'],
            cascadeSpeed: 0.15, // Speed of rain drops
            spawnChance: 0.03, // Chance to spawn new cascade per frame
            trailLength: 8, // How many dots trail behind
            fadeSpeed: 0.08
        };

        // Animation state
        this.state = {
            frameCount: 0,
            activeCascades: [],
            litDotsCount: 0
        };

        // Text masking areas (will be calculated)
        this.maskAreas = [];

        this.init();
    }

    init() {
        // Wait for canvas to have dimensions
        if (!this.setupCanvas()) {
            console.log('Canvas not ready, retrying in 100ms...');
            setTimeout(() => this.init(), 100);
            return;
        }
        
        this.calculateMaskAreas();
        this.generateDotGrid();
        this.initializeColumns();
        this.startAnimation();
        
        // Handle resize
        window.addEventListener('resize', () => {
            if (this.setupCanvas()) {
                this.calculateMaskAreas();
                this.generateDotGrid();
                this.initializeColumns();
            }
        });

        console.log('LED Hero Background initialized - Matrix Rain Mode');
        console.log(`Grid: ${this.dots.length} dots`);
        console.log(`Columns: ${this.columns.length}`);
    }

    setupCanvas() {
        const hero = this.canvas.parentElement;
        const rect = hero.getBoundingClientRect();
        
        // Set canvas size to match hero section
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Guard against zero dimensions
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            console.warn('Canvas has zero dimensions, waiting for layout...');
            return false;
        }
        
        console.log(`Canvas size: ${this.canvas.width}x${this.canvas.height}`);
        return true;
    }

    calculateMaskAreas() {
        // Calculate areas where text and buttons are located
        const hero = this.canvas.parentElement;
        
        // Get text elements
        const tagline = hero.querySelector('.hero-tagline');
        const title = hero.querySelector('.hero-title');
        const subline = hero.querySelector('.hero-subline');
        const ctaGroup = hero.querySelector('.hero-cta-group');
        
        this.maskAreas = [];
        
        // Add mask for each text element
        [tagline, title, subline, ctaGroup].forEach(el => {
            if (el) {
                const rect = el.getBoundingClientRect();
                const heroRect = hero.getBoundingClientRect();
                
                this.maskAreas.push({
                    x: rect.left - heroRect.left - 20,
                    y: rect.top - heroRect.top - 10,
                    width: rect.width + 40,
                    height: rect.height + 20
                });
            }
        });

        console.log(`Mask areas calculated: ${this.maskAreas.length} regions`);
    }

    isInMaskArea(x, y) {
        return this.maskAreas.some(area => {
            return x >= area.x && 
                   x <= area.x + area.width && 
                   y >= area.y && 
                   y <= area.y + area.height;
        });
    }

    generateDotGrid() {
        this.dots = [];
        const { dotSpacing } = this.config;
        
        // Guard against zero dimensions
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            console.warn('Cannot generate dot grid: canvas has zero dimensions');
            return;
        }
        
        const cols = Math.ceil(this.canvas.width / dotSpacing);
        const rows = Math.ceil(this.canvas.height / dotSpacing);
        
        // Create 2D array for easy column/row access
        this.dotGrid = [];
        
        for (let row = 0; row < rows; row++) {
            this.dotGrid[row] = [];
            for (let col = 0; col < cols; col++) {
                const x = col * dotSpacing + dotSpacing / 2;
                const y = row * dotSpacing + dotSpacing / 2;
                
                // Skip dots in mask areas
                if (!this.isInMaskArea(x, y)) {
                    const dot = {
                        x,
                        y,
                        row,
                        col,
                        opacity: 0,
                        color: this.config.defaultColor,
                        lastLitTime: 0,
                        intensity: 0
                    };
                    this.dots.push(dot);
                    this.dotGrid[row][col] = dot;
                } else {
                    this.dotGrid[row][col] = null;
                }
            }
        }

        this.gridCols = cols;
        this.gridRows = rows;

        console.log(`Generated ${this.dots.length} dots (${cols}x${rows} grid, masked areas excluded)`);
    }

    initializeColumns() {
        // Initialize column data for cascades
        this.columns = [];
        for (let col = 0; col < this.gridCols; col++) {
            this.columns.push({
                col,
                lastCascadeTime: 0,
                activeCascade: null
            });
        }
    }

    getRandomLitColor() {
        const colors = this.config.litColors;
        return colors[Math.floor(Math.random() * colors.length)];
    }

    spawnCascade() {
        // Randomly spawn new cascades
        if (Math.random() < this.config.spawnChance) {
            const col = Math.floor(Math.random() * this.gridCols);
            const columnData = this.columns[col];
            
            // Don't spawn if column already has active cascade
            if (!columnData.activeCascade) {
                columnData.activeCascade = {
                    col,
                    position: 0, // Start at top
                    speed: this.config.cascadeSpeed + Math.random() * 0.1,
                    color: this.getRandomLitColor(),
                    trailLength: this.config.trailLength + Math.floor(Math.random() * 5),
                    intensity: 0.7 + Math.random() * 0.3
                };
                this.state.activeCascades.push(columnData.activeCascade);
            }
        }
    }

    updateCascades() {
        // Update all active cascades
        this.state.activeCascades = this.state.activeCascades.filter(cascade => {
            cascade.position += cascade.speed;
            
            // Light up dots in the cascade trail
            for (let i = 0; i < cascade.trailLength; i++) {
                const row = Math.floor(cascade.position - i);
                
                if (row >= 0 && row < this.gridRows) {
                    const dot = this.dotGrid[row][cascade.col];
                    
                    if (dot) {
                        // Calculate intensity based on position in trail
                        const trailPosition = i / cascade.trailLength;
                        const intensity = cascade.intensity * (1 - trailPosition * 0.7);
                        
                        dot.opacity = intensity;
                        dot.color = cascade.color;
                        dot.lastLitTime = Date.now();
                        dot.intensity = intensity;
                    }
                }
            }
            
            // Remove cascade if it's past the bottom
            if (cascade.position - cascade.trailLength > this.gridRows) {
                const columnData = this.columns[cascade.col];
                if (columnData) {
                    columnData.activeCascade = null;
                }
                return false;
            }
            
            return true;
        });
    }

    updateAnimation() {
        this.state.frameCount++;
        const now = Date.now();
        
        // Spawn new cascades randomly
        this.spawnCascade();
        
        // Update existing cascades
        this.updateCascades();
        
        // Fade out dots that aren't being actively lit
        this.state.litDotsCount = 0;
        this.dots.forEach(dot => {
            if (dot.opacity > 0 && now - dot.lastLitTime > 50) {
                dot.opacity = Math.max(0, dot.opacity - this.config.fadeSpeed);
            }
            if (dot.opacity > 0.1) {
                this.state.litDotsCount++;
            }
        });
        
        // Add some random sparkles for extra chaos
        if (Math.random() < 0.02) {
            const randomDot = this.dots[Math.floor(Math.random() * this.dots.length)];
            if (randomDot && randomDot.opacity < 0.3) {
                randomDot.opacity = 0.4 + Math.random() * 0.3;
                randomDot.color = this.getRandomLitColor();
                randomDot.lastLitTime = now;
            }
        }
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw dots
        this.dots.forEach(dot => {
            if (dot.opacity > 0.05) {
                this.ctx.fillStyle = dot.color;
                this.ctx.globalAlpha = dot.opacity;
                
                this.ctx.beginPath();
                this.ctx.arc(dot.x, dot.y, this.config.dotRadius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        this.ctx.globalAlpha = 1.0;
    }

    animate() {
        this.updateAnimation();
        this.render();
        
        // Log stats every 120 frames (~2 seconds)
        if (this.state.frameCount % 120 === 0) {
            console.log(`Active cascades: ${this.state.activeCascades.length}, Lit dots: ${this.state.litDotsCount}, Frame: ${this.state.frameCount}`);
        }
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    startAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.state.frameCount = 0;
        this.animate();
        console.log('Matrix rain animation started');
    }

    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
            console.log('Animation stopped');
        }
    }
}

// Auto-initialize when DOM is ready and canvas has dimensions
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit for layout to complete
        setTimeout(() => {
            window.ledHeroBackground = new LEDHeroBackground('led-hero-bg');
        }, 50);
    });
} else {
    // DOM already loaded, wait for next frame to ensure layout is complete
    requestAnimationFrame(() => {
        window.ledHeroBackground = new LEDHeroBackground('led-hero-bg');
    });
}
