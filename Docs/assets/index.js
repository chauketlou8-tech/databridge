(function() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;

    const cards = track.querySelectorAll('.db-card');
    const totalCards = cards.length;
    const cardsPerView = window.innerWidth < 600 ? 1 : window.innerWidth < 900 ? 2 : 3;
    const cardWidth = 100 / cardsPerView;

    // Set card widths
    cards.forEach(card => {
        card.style.minWidth = cardWidth + '%';
        card.style.maxWidth = cardWidth + '%';
        card.style.flexShrink = '0';
    });

    // Clone cards for seamless loop
    const cloneCount = cardsPerView * 2;
    const originalCards = Array.from(cards);

    // Add clones at the end
    for (let i = 0; i < cloneCount; i++) {
        const clone = originalCards[i % totalCards].cloneNode(true);
        track.appendChild(clone);
    }

    // Add clones at the beginning
    for (let i = cloneCount - 1; i >= 0; i--) {
        const clone = originalCards[i % totalCards].cloneNode(true);
        track.insertBefore(clone, track.firstChild);
    }

    // Get total width of original cards
    const originalWidth = totalCards * cardWidth;

    // Set initial position to show first original card
    const startOffset = cloneCount * cardWidth;
    track.style.transform = `translateX(-${startOffset}%)`;

    // Create keyframes for smooth infinite animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes infiniteScroll {
            0% {
                transform: translateX(-${startOffset}%);
            }
            100% {
                transform: translateX(-${startOffset + originalWidth}%);
            }
        }
        .carousel-track.animating {
            animation: infiniteScroll ${totalCards * 20}s linear infinite;
        }
    `;
    document.head.appendChild(style);

    // Start the animation
    track.classList.add('animating');

    // Pause on hover
    const carousel = document.querySelector('.carousel-container');
    if (carousel) {
        carousel.addEventListener('mouseenter', () => {
            track.style.animationPlayState = 'paused';
        });
        carousel.addEventListener('mouseleave', () => {
            track.style.animationPlayState = 'running';
        });
    }

    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const newCardsPerView = window.innerWidth < 600 ? 1 : window.innerWidth < 900 ? 2 : 3;
            const newCardWidth = 100 / newCardsPerView;
            const allCards = track.querySelectorAll('.db-card');
            allCards.forEach(card => {
                card.style.minWidth = newCardWidth + '%';
                card.style.maxWidth = newCardWidth + '%';
            });

            const newOriginalWidth = totalCards * newCardWidth;
            const newStartOffset = cloneCount * newCardWidth;

            track.classList.remove('animating');
            track.style.transform = `translateX(-${newStartOffset}%)`;
            track.offsetHeight;

            style.textContent = `
                @keyframes infiniteScroll {
                    0% {
                        transform: translateX(-${newStartOffset}%);
                    }
                    100% {
                        transform: translateX(-${newStartOffset + newOriginalWidth}%);
                    }
                }
                .carousel-track.animating {
                    animation: infiniteScroll ${totalCards * 20}s linear infinite;
                }
            `;
            track.classList.add('animating');
        }, 200);
    });
})();

// ---------------------------------------------------------------------
// Hero Particle Animation
// ---------------------------------------------------------------------

(function() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const hero = document.querySelector('.hero');

    let width, height;
    let particles = [];
    const particleCount = 80;
    const connectionDistance = 150;
    const maxSpeed = 0.8;

    // -----------------------------------------------------------------
    // Resize handler
    // -----------------------------------------------------------------

    function resize() {
        const rect = hero.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        canvas.width = width;
        canvas.height = height;
    }

    // -----------------------------------------------------------------
    // Particle class
    // -----------------------------------------------------------------

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * maxSpeed * 2;
            this.vy = (Math.random() - 0.5) * maxSpeed * 2;
            this.radius = Math.random() * 2.5 + 1.5;
            this.opacity = Math.random() * 0.5 + 0.3;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(88, 166, 255, ${this.opacity})`;
            ctx.fill();
        }
    }

    // -----------------------------------------------------------------
    // Draw connecting lines between particles
    // -----------------------------------------------------------------

    function drawLines() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < connectionDistance) {
                    const opacity = 1 - (dist / connectionDistance);
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(88, 166, 255, ${opacity * 0.3})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
    }

    // -----------------------------------------------------------------
    // Animation loop
    // -----------------------------------------------------------------

    function init() {
        resize();
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
        animate();
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        drawLines();

        requestAnimationFrame(animate);
    }

    // -----------------------------------------------------------------
    // Event listeners
    // -----------------------------------------------------------------

    window.addEventListener('resize', () => {
        resize();

        particles.forEach(p => {
            p.x = Math.min(p.x, width);
            p.y = Math.min(p.y, height);
        });
    });

    init();
})();