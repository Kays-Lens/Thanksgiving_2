/**
 * Thanksgiving E-Commerce App Script
 * Strictly 3 Colors Theme & No Emojis
 */

// ---- Global App State (accessible by all functions) ----
let cart = JSON.parse(localStorage.getItem('thanksgiving_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('thanksgiving_wishlist')) || [];
let currentFilter = 'all';
let searchQuery = '';
let discountRate = 0;
let currentPromoCode = '';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Components
    initHeroTitleAnimation();
    initParticleCanvas();
    initNavbarScroll();
    renderProducts();
    updateCartUI();
    initFeastCalculator();
    init3DTiltEffects();
    initEventListeners();
    initCountdown();
    initScrollReveal();
});

/* ----------------------------------------------------
   0. HERO TITLE LETTER-BY-LETTER CASCADE ANIMATION
      Each character drops in from above with blur, bounce
      and rotateX. Accent span gets an ongoing shimmer sweep.
---------------------------------------------------- */
function initHeroTitleAnimation() {
    const titleEl = document.getElementById('hero-title-anim');
    if (!titleEl) return;

    // Small initial delay so page chrome settles first
    const globalDelay = 300; // ms before first letter
    const charInterval = 38; // ms between each character
    let charIndex = 0;

    // Process every direct .title-line span inside the h1
    const lines = titleEl.querySelectorAll('.title-line');

    lines.forEach((lineSpan, lineIdx) => {
        const isAccent = lineSpan.classList.contains('accent-text');
        const originalText = lineSpan.textContent;

        // Clear inner text; we'll rebuild as individual char spans
        lineSpan.textContent = '';
        lineSpan.style.display = 'inline';
        lineSpan.style.whiteSpace = 'normal';

        // If accent line, wrap in shimmer container
        let targetContainer = lineSpan;
        if (isAccent) {
            const shimmer = document.createElement('span');
            shimmer.className = 'hero-title-shimmer';
            shimmer.dataset.text = originalText;
            lineSpan.appendChild(shimmer);
            targetContainer = shimmer;
        }

        // Split into individual character spans
        Array.from(originalText).forEach((char) => {
            const span = document.createElement('span');
            if (char === ' ') {
                span.className = 'hero-char is-space';
                span.innerHTML = '&nbsp;';
            } else {
                span.className = isAccent ? 'hero-char hero-char--accent' : 'hero-char';
                span.textContent = char;
                const delay = globalDelay + charIndex * charInterval;
                span.style.animationDelay = `${delay}ms`;
                charIndex++;
            }
            targetContainer.appendChild(span);
        });
    });
}

/* ----------------------------------------------------
   1. PARTICLES & EMBER CANVAS ANIMATION
---------------------------------------------------- */
function initParticleCanvas() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = Math.min(Math.floor(width / 15), 65);

    let mouseX = width / 2;
    let mouseY = height / 2;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    class EmberParticle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = height + Math.random() * 100;
            this.radius = Math.random() * 2.5 + 0.8;
            this.vx = (Math.random() - 0.5) * 0.6;
            this.vy = -(Math.random() * 1.2 + 0.5);
            this.alpha = Math.random() * 0.7 + 0.2;
            this.decay = Math.random() * 0.003 + 0.001;
            this.pulse = Math.random() * 0.05;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;

            // Subtle mouse interaction pull
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
                this.x += (dx / dist) * 0.4;
                this.y += (dy / dist) * 0.4;
            }

            if (this.alpha <= 0 || this.y < -20) {
                this.reset();
            }
        }

        draw() {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(217, 119, 54, ${this.alpha})`;
            ctx.shadowBlur = 12;
            ctx.shadowColor = 'rgba(217, 119, 54, 0.8)';
            ctx.fill();
            ctx.restore();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        const p = new EmberParticle();
        p.y = Math.random() * height; // Distribute initial particles across screen
        particles.push(p);
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }

    animate();
}

/* ----------------------------------------------------
   2. NAVBAR SCROLL EFFECT
---------------------------------------------------- */
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

/* ----------------------------------------------------
   3. PRODUCTS RENDERING & FILTERING
---------------------------------------------------- */
function renderProducts() {
    const container = document.getElementById('products-grid');
    if (!container) return;

    let filtered = PRODUCTS.filter(p => {
        const matchesCategory = (currentFilter === 'all') || (p.category === currentFilter);
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              p.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: rgba(245,235,230,0.6);">
                <p style="font-family: var(--font-heading); font-size: 1.3rem; margin-bottom: 0.5rem;">Aucun produit ne correspond à votre recherche.</p>
                <p style="font-size: 0.9rem;">Essayez un autre mot-clé ou modifiez la catégorie sélectionnée.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(product => {
        const isWishlisted = wishlist.includes(product.id);
        const starSVGs = Array(5).fill(0).map((_, i) => `
            <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        `).join('');

        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image-container">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    <span class="product-badge">${product.badge}</span>
                    <div class="product-actions-floating">
                        <button class="quick-view-btn" onclick="openQuickView('${product.id}')" title="Aperçu rapide">
                            <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist('${product.id}', this)" title="Favoris">
                            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <span class="product-category">${product.categoryName}</span>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-rating">
                        <div class="stars-svg">${starSVGs}</div>
                        <span>${product.rating} (${product.reviewsCount})</span>
                    </div>
                    <div class="product-bottom">
                        <div class="product-price-box">
                            <span class="price-current">${product.price.toFixed(2)} €</span>
                            ${product.originalPrice ? `<span class="price-original">${product.originalPrice.toFixed(2)} €</span>` : ''}
                        </div>
                        <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">
                            <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                            Ajouter
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    init3DTiltEffects();
}

/* ----------------------------------------------------
   4. CART FUNCTIONALITY & STATE
---------------------------------------------------- */
function addToCart(productId, qty = 1) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = cart.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
        cart[existingIndex].qty += qty;
    } else {
        cart.push({ ...product, qty });
    }

    saveCart();
    updateCartUI();
    showToast(`"${product.name}" ajouté au panier.`);
}

function updateCartQty(productId, change) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex === -1) return;

    cart[itemIndex].qty += change;
    if (cart[itemIndex].qty <= 0) {
        cart.splice(itemIndex, 1);
    }

    saveCart();
    updateCartUI();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    showToast("Article retiré du panier.");
}

function saveCart() {
    localStorage.setItem('thanksgiving_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountAmount = subtotal * discountRate;
    const finalTotal = Math.max(0, subtotal - discountAmount);

    // Update Badges with Micro-Bounce Animation
    const cartCountElems = document.querySelectorAll('.cart-count-badge');
    cartCountElems.forEach(el => {
        el.textContent = totalCount;
        el.classList.remove('pop');
        void el.offsetWidth;
        el.classList.add('pop');
    });

    // Update Drawer Elements
    const itemsContainer = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('cart-subtotal');
    const discountRow = document.getElementById('cart-discount-row');
    const discountValEl = document.getElementById('cart-discount-val');
    const totalEl = document.getElementById('cart-total');
    const freeShippingBar = document.getElementById('shipping-bar-fill');
    const shippingTextEl = document.getElementById('shipping-text');

    if (itemsContainer) {
        if (cart.length === 0) {
            itemsContainer.innerHTML = `
                <div class="cart-empty-state">
                    <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    <p style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--c3);">Votre panier est vide</p>
                    <p style="font-size: 0.85rem; margin-top: 0.5rem;">Découvrez notre sélection artisanale de festin d'automne.</p>
                </div>
            `;
        } else {
            itemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" class="cart-item-img" alt="${item.name}">
                    <div class="cart-item-details">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <h4 class="cart-item-title">${item.name}</h4>
                            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" title="Supprimer">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                        <div class="cart-item-price">${(item.price * item.qty).toFixed(2)} €</div>
                        <div class="cart-item-qty">
                            <button class="qty-btn" onclick="updateCartQty('${item.id}', -1)">-</button>
                            <span style="font-weight: 700; font-size: 0.9rem;">${item.qty}</span>
                            <button class="qty-btn" onclick="updateCartQty('${item.id}', 1)">+</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    if (subtotalEl) subtotalEl.textContent = `${subtotal.toFixed(2)} €`;

    if (discountRate > 0 && discountRow && discountValEl) {
        discountRow.style.display = 'flex';
        discountValEl.textContent = `-${discountAmount.toFixed(2)} €`;
    } else if (discountRow) {
        discountRow.style.display = 'none';
    }

    if (totalEl) totalEl.textContent = `${finalTotal.toFixed(2)} €`;

    // Free Shipping Progress (Threshold: 150€)
    const shippingThreshold = 150;
    const progressPercent = Math.min(100, (subtotal / shippingThreshold) * 100);
    if (freeShippingBar) freeShippingBar.style.width = `${progressPercent}%`;

    if (shippingTextEl) {
        if (subtotal >= shippingThreshold) {
            shippingTextEl.textContent = "Félicitations ! Vous bénéficiez de la livraison express offerte.";
        } else {
            const remaining = shippingThreshold - subtotal;
            shippingTextEl.textContent = `Plus que ${remaining.toFixed(2)} € pour la livraison offerte.`;
        }
    }
}

/* ----------------------------------------------------
   5. PROMO CODE SYSTEM
---------------------------------------------------- */
function applyPromoCode() {
    const input = document.getElementById('promo-input');
    if (!input) return;

    const code = input.value.trim().toUpperCase();
    if (PROMO_CODES[code]) {
        discountRate = PROMO_CODES[code];
        currentPromoCode = code;
        updateCartUI();
        showToast(`Code promo ${code} appliqué (${discountRate * 100}% de réduction) !`);
    } else {
        showToast("Code promo invalide.");
    }
}

/* ----------------------------------------------------
   6. THANKSGIVING CUSTOM FEAST CALCULATOR WIDGET
---------------------------------------------------- */
function initFeastCalculator() {
    const slider = document.getElementById('guest-slider');
    if (!slider) return;

    slider.addEventListener('input', updateCustomCalculator);
    slider.addEventListener('change', updateCustomCalculator);
    updateCustomCalculator();
}

function updateCustomCalculator() {
    const slider = document.getElementById('guest-slider');
    if (!slider) return;

    const guests = parseInt(slider.value);
    const guestCountDisplay = document.getElementById('guest-count-display');
    const turkeyWeightEl = document.getElementById('calc-turkey-weight');
    const pieCountEl = document.getElementById('calc-pie-count');
    const wineBottlesEl = document.getElementById('calc-wine-bottles');
    const totalEstEl = document.getElementById('calc-total-est');

    // Helper to pulse changed values smoothly
    function updateWithPulse(el, newText) {
        if (!el) return;
        if (el.textContent !== newText) {
            el.textContent = newText;
            el.classList.remove('calc-pop');
            void el.offsetWidth;
            el.classList.add('calc-pop');
        }
    }

    // Dynamic guest text update in real time as slider moves
    if (guestCountDisplay) {
        updateWithPulse(guestCountDisplay, `${guests} Convives`);
    }

    // Portions calculation
    const turkeyKg = (guests * 0.75).toFixed(1);
    const pieSelect = document.getElementById('calc-dessert-dish');
    const isDuoPies = pieSelect && pieSelect.value === 'duo-pies';
    const pieCount = Math.ceil(guests / 6) * (isDuoPies ? 2 : 1);
    const wineBottles = Math.ceil(guests * 0.4);

    // Calculate dynamic custom price
    let basePricePerGuest = 22.50; // base food cost per guest
    let baseTotal = guests * basePricePerGuest;

    // Add option extra costs
    const mainSelect = document.getElementById('calc-main-dish');
    if (mainSelect) {
        const selectedOpt = mainSelect.options[mainSelect.selectedIndex];
        baseTotal += parseFloat(selectedOpt.dataset.extra || 0);
    }

    if (pieSelect) {
        const selectedOpt = pieSelect.options[pieSelect.selectedIndex];
        baseTotal += parseFloat(selectedOpt.dataset.extra || 0);
    }

    const bevSelect = document.getElementById('calc-beverage-choice');
    if (bevSelect) {
        const selectedOpt = bevSelect.options[bevSelect.selectedIndex];
        baseTotal += parseFloat(selectedOpt.dataset.extra || 0);
    }

    // Extras Checkboxes
    const extraStuffing = document.getElementById('calc-extra-stuffing');
    if (extraStuffing && extraStuffing.checked) baseTotal += 29.00;

    const extraChutney = document.getElementById('calc-extra-chutney');
    if (extraChutney && extraChutney.checked) baseTotal += 16.50;

    const extraTableware = document.getElementById('calc-extra-tableware');
    if (extraTableware && extraTableware.checked) baseTotal += 185.00;

    // Update DOM elements in real time with subtle pulse
    updateWithPulse(turkeyWeightEl, `${turkeyKg} kg`);
    updateWithPulse(pieCountEl, `${pieCount} Tarte(s)`);
    updateWithPulse(wineBottlesEl, `${wineBottles} Bouteille(s)`);
    updateWithPulse(totalEstEl, `${baseTotal.toFixed(2)} €`);
}

function addCustomFeastBundleToCart() {
    const slider = document.getElementById('guest-slider');
    const guests = slider ? parseInt(slider.value) : 8;

    // Get selected main dish
    const mainSelect = document.getElementById('calc-main-dish');
    const mainDishId = mainSelect ? mainSelect.value : 'prod-1';
    
    // If exact product ID exists, add it; otherwise fallback to prod-1
    const actualMainId = PRODUCTS.some(p => p.id === mainDishId) ? mainDishId : 'prod-1';
    addToCart(actualMainId, 1);

    // Dessert
    const pieSelect = document.getElementById('calc-dessert-dish');
    const pieVal = pieSelect ? pieSelect.value : 'prod-3';
    if (pieVal === 'prod-4') {
        addToCart('prod-4', 1);
    } else if (pieVal === 'duo-pies') {
        addToCart('prod-3', 1);
        addToCart('prod-4', 1);
    } else {
        addToCart('prod-3', 1);
    }

    // Beverage
    addToCart('prod-5', 1);

    // Extras
    const extraStuffing = document.getElementById('calc-extra-stuffing');
    if (extraStuffing && extraStuffing.checked) addToCart('prod-6', 1);

    const extraChutney = document.getElementById('calc-extra-chutney');
    if (extraChutney && extraChutney.checked) addToCart('prod-8', 1);

    const extraTableware = document.getElementById('calc-extra-tableware');
    if (extraTableware && extraTableware.checked) addToCart('prod-7', 1);

    openCartDrawer();
    showToast(`Festin sur-mesure pour ${guests} convives ajouté au panier !`);
}

/* ----------------------------------------------------
   7. 3D TILT EFFECT ON CARDS
---------------------------------------------------- */
function init3DTiltEffects() {
    const tiltElements = document.querySelectorAll('.hero-card-3d, .product-card');

    tiltElements.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -7;
            const rotateY = ((x - centerX) / centerX) * 7;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

/* ----------------------------------------------------
   8. QUICK VIEW MODAL
---------------------------------------------------- */
function openQuickView(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const modal = document.getElementById('quickview-modal');
    const content = document.getElementById('quickview-content');
    if (!modal || !content) return;

    content.innerHTML = `
        <div class="quickview-grid">
            <img src="${product.image}" class="quickview-img" alt="${product.name}">
            <div style="display: flex; flex-direction: column; justify-content: center;">
                <span style="color: var(--c2); font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">${product.categoryName}</span>
                <h2 style="font-family: var(--font-heading); font-size: 1.8rem; color: var(--c3); margin: 0.5rem 0 1rem 0;">${product.name}</h2>
                <p style="color: rgba(245,235,230,0.8); font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.6;">${product.description}</p>
                
                <div style="background: rgba(217,119,54,0.08); border: 1px solid rgba(217,119,54,0.2); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.85rem;">
                    <div><strong>Portion / Poids:</strong> ${product.weight}</div>
                    <div><strong>Origine:</strong> ${product.origin}</div>
                    <div><strong>Préparation:</strong> ${product.prepTime}</div>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 1rem;">
                    <span style="font-size: 2rem; font-weight: 800; color: var(--c2);">${product.price.toFixed(2)} €</span>
                    <button class="btn-primary" onclick="addToCart('${product.id}'); closeQuickView();">
                        <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                        Ajouter au Panier
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

function closeQuickView() {
    const modal = document.getElementById('quickview-modal');
    if (modal) modal.classList.remove('active');
}

/* ----------------------------------------------------
   9. CHECKOUT MODAL & ORDER SUCCESS
---------------------------------------------------- */
function openCheckoutModal() {
    if (cart.length === 0) {
        showToast("Votre panier est vide.");
        return;
    }
    closeCartDrawer();
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.add('active');
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.remove('active');
}

function handleCheckoutSubmit(e) {
    e.preventDefault();
    const orderId = 'THX-' + Math.floor(100000 + Math.random() * 900000);
    
    // Clear Cart
    cart = [];
    saveCart();
    updateCartUI();
    closeCheckoutModal();

    // Show Success Modal
    const modal = document.getElementById('order-success-modal');
    const idEl = document.getElementById('order-success-id');
    if (idEl) idEl.textContent = orderId;
    if (modal) modal.classList.add('active');
}

function closeOrderSuccessModal() {
    const modal = document.getElementById('order-success-modal');
    if (modal) modal.classList.remove('active');
}

/* ----------------------------------------------------
   10. WISHLIST TOGGLE & TOAST SYSTEM
---------------------------------------------------- */
function toggleWishlist(productId, buttonElem) {
    const index = wishlist.indexOf(productId);
    if (index > -1) {
        wishlist.splice(index, 1);
        if (buttonElem) buttonElem.classList.remove('active');
        showToast("Retiré de vos favoris.");
    } else {
        wishlist.push(productId);
        if (buttonElem) buttonElem.classList.add('active');
        showToast("Ajouté à vos favoris.");
    }
    localStorage.setItem('thanksgiving_wishlist', JSON.stringify(wishlist));
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--c2)" fill="none" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = '0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

/* ----------------------------------------------------
   11. CART DRAWER TOGGLE & LISTENERS
---------------------------------------------------- */
function openCartDrawer() {
    const overlay = document.getElementById('cart-drawer-overlay');
    if (overlay) overlay.classList.add('active');
}

function closeCartDrawer() {
    const overlay = document.getElementById('cart-drawer-overlay');
    if (overlay) overlay.classList.remove('active');
}

function toggleMobileMenu() {
    const drawer = document.getElementById('mobile-menu-drawer');
    if (drawer) drawer.classList.toggle('active');
}

function initEventListeners() {
    // Filter Buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderProducts();
        });
    });

    // Search Input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProducts();
        });
    }

    initBackToTop();
    initPromoCodeCopy();
}

/* ----------------------------------------------------
   12. FEAST BUNDLE DIRECT ADD
---------------------------------------------------- */
function addFeastBundleToCart() {
    addToCart('prod-1', 1);
    addToCart('prod-3', 1);
    addToCart('prod-5', 1);
    openCartDrawer();
    showToast("Le Grand Banquet d'Automne a été ajouté à votre panier !");
}

/* ----------------------------------------------------
   13. COUNTDOWN TIMER SYSTEM (THANKSGIVING 2026)
---------------------------------------------------- */
function initCountdown() {
    // Target Thanksgiving Day: November 26, 2026 at 18:00
    const targetDate = new Date('2026-11-26T18:00:00');
    const daysEl = document.getElementById('cd-days');
    const hoursEl = document.getElementById('cd-hours');
    const minsEl = document.getElementById('cd-minutes');
    const secsEl = document.getElementById('cd-seconds');
    const doneEl = document.getElementById('countdown-done');
    const gridEl = document.getElementById('countdown-grid');

    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

    function updateTimer() {
        const now = new Date();
        const diff = targetDate.getTime() - now.getTime();

        if (diff <= 0) {
            if (gridEl) gridEl.style.display = 'none';
            if (doneEl) doneEl.style.display = 'block';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);

        const dStr = String(days).padStart(2, '0');
        const hStr = String(hours).padStart(2, '0');
        const mStr = String(mins).padStart(2, '0');
        const sStr = String(secs).padStart(2, '0');

        if (daysEl.textContent !== dStr) daysEl.textContent = dStr;
        if (hoursEl.textContent !== hStr) hoursEl.textContent = hStr;
        if (minsEl.textContent !== mStr) minsEl.textContent = mStr;

        if (secsEl.textContent !== sStr) {
            secsEl.textContent = sStr;
            secsEl.classList.remove('tick');
            void secsEl.offsetWidth; // trigger reflow for tick animation
            secsEl.classList.add('tick');
        }
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

/* ----------------------------------------------------
   14. SCROLL REVEAL INTERSECTION OBSERVER SYSTEM
---------------------------------------------------- */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

    if (!('IntersectionObserver' in window)) {
        revealElements.forEach(el => el.classList.add('visible'));
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => {
        // If element is already in viewport on load, reveal immediately
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add('visible');
        } else {
            observer.observe(el);
        }
    });
}

/* ----------------------------------------------------
   15. BACK TO TOP FLOATING BUTTON WITH SMOOTH SCROLL
---------------------------------------------------- */
function initBackToTop() {
    let btn = document.getElementById('back-to-top-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'back-to-top-btn';
        btn.className = 'back-to-top-btn';
        btn.setAttribute('aria-label', 'Retour en haut de page');
        btn.innerHTML = `<svg viewBox="0 0 24 24" stroke-width="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`;
        document.body.appendChild(btn);
    }

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/* ----------------------------------------------------
   16. PROMO CODE CLICK-TO-COPY INTERACTION
---------------------------------------------------- */
function initPromoCodeCopy() {
    const promoBadges = document.querySelectorAll('.promo-code-badge, [data-copy-promo]');
    promoBadges.forEach(badge => {
        badge.addEventListener('click', () => {
            const code = badge.dataset.copyPromo || badge.textContent.trim();
            if (navigator.clipboard) {
                navigator.clipboard.writeText(code).then(() => {
                    showToast(`Code promo "${code}" copié dans le presse-papier !`);
                }).catch(() => {
                    showToast(`Code "${code}" prêt pour votre commande !`);
                });
            } else {
                showToast(`Code "${code}" prêt pour votre commande !`);
            }
        });
    });
}
