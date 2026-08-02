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
            // Recalculate and restart animation
            const newOriginalWidth = totalCards * newCardWidth;
            const newStartOffset = cloneCount * newCardWidth;
            track.classList.remove('animating');
            track.style.transform = `translateX(-${newStartOffset}%)`;
            track.offsetHeight;
            // Update keyframes
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
                    animation: infiniteScroll ${totalCards *20}s linear infinite;
                }
            `;
            track.classList.add('animating');
        }, 200);
    });
})();