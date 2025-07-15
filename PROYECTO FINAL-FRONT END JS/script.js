// Variables globales
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const API_URL = 'https://api.rawg.io/api/games';
const API_KEY = '3a017e47c38f43efba719fd38efb17c1';

// DOM
const gamesGrid = document.querySelector('.games-grid');
const cartCount = document.querySelector('.cart-count');
const cartModal = document.querySelector('.cart-modal');
const cartItemsContainer = document.querySelector('.cart-items');
const cartTotal = document.querySelector('.total-amount');
const cartLink = document.querySelector('.cart-link');
const closeCart = document.querySelector('.close-cart');
const checkoutBtn = document.querySelector('.checkout-btn');

// Datos de juegos por defecto (si la API falla)
const defaultGames = [
    {
        id: 1091500,
        name: 'Cyberpunk 2077',
        background_image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/header.jpg',
        rating: 4.7
    },
    {
        id: 1245620,
        name: 'Elden Ring',
        background_image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/header.jpg',
        rating: 5
    },
    {
        id: 1593500,
        name: 'God of War: Ragnarök',
        background_image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1593500/header.jpg',
        rating: 5
    },
    {
        id: 1174180,
        name: 'Red Dead Redemption 2',
        background_image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/header.jpg',
        rating: 5
    }
];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    fetchGames();
    updateCartCount();
    setupEventListeners();
});

// Fetch API para obtener los juegos
async function fetchGames() {
    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}&page_size=4`);
        
        if (!response.ok) throw new Error('API no disponible');
        
        const data = await response.json();
        displayGames(data.results.length ? data.results : defaultGames);
    } catch (error) {
        console.error('Error fetching games:', error);
        displayGames(defaultGames);
    }
}

// Muestra juegos en el grid
function displayGames(games) {
    gamesGrid.innerHTML = '';
    
    games.forEach((game, index) => {
        const gameCard = document.createElement('article');
        gameCard.className = 'game-card';
        gameCard.style.setProperty('--delay', `${0.1 * (index + 1)}s`);
        
        // Genera precios aleatorios
        const price = (game.id % 3 === 0) 
            ? { 
                current: (Math.random() * 50 + 20).toFixed(2), 
                original: (Math.random() * 70 + 30).toFixed(2) 
              }
            : { 
                current: (Math.random() * 70 + 30).toFixed(2) 
              };
        
        // Determina si mostrar badge y de qué tipo
        const badge = (game.id % 3 === 0) 
            ? `<div class="game-badge ${game.id % 2 ? 'new' : 'discount'}">${game.id % 2 ? 'NUEVO' : '-30%'}</div>`
            : '';
        
        // Calcula rating basado en datos o aleatorio
        const rating = game.rating || (Math.random() * 0.5 + 4.5).toFixed(1);
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        // Genera estrellas de rating
        let starsHTML = '';
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starsHTML += '<span class="icon icon-star"></span>';
            } else if (i === fullStars && hasHalfStar) {
                starsHTML += '<span class="icon icon-star-half"></span>';
            } else {
                starsHTML += '<span class="icon icon-star-half"></span>';
            }
        }
        
        gameCard.innerHTML = `
            ${badge}
            <div class="game-img" style="background-image: url('${game.background_image}')" 
                 alt="${game.name} - Portada del juego"></div>
            <div class="game-info">
                <h3>${game.name}</h3>
                <div class="game-rating">
                    ${starsHTML}
                    <span>${rating}/5</span>
                </div>
                <div class="game-price">
                    <span class="current">$${price.current}</span>
                    ${price.original ? `<span class="original">$${price.original}</span>` : ''}
                </div>
                <button class="game-btn" data-id="${game.id}" data-name="${game.name}" 
                        data-price="${price.current}" data-image="${game.background_image}">
                    AÑADIR AL CARRITO
                </button>
            </div>
        `;
        
        gamesGrid.appendChild(gameCard);
    });
    
    // Agrega event listeners a los botones
    document.querySelectorAll('.game-btn').forEach(btn => {
        btn.addEventListener('click', addToCart);
    });
}

// Carrito de compras
function addToCart(e) {
    const button = e.target;
    const id = button.dataset.id;
    const name = button.dataset.name;
    const price = parseFloat(button.dataset.price);
    const image = button.dataset.image;
    
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ id, name, price, image, quantity: 1 });
    }
    
    updateCart();
    showFeedback(`${name} añadido al carrito`);
}

function updateCart() {
    saveCart();
    updateCartCount();
    renderCartItems();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = count;
    cartCount.style.display = count > 0 ? 'inline-block' : 'none';
}

function renderCartItems() {
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Tu carrito está vacío</p>';
        cartTotal.textContent = '$0';
        return;
    }
    
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                <div class="cart-item-controls">
                    <button class="quantity-btn minus" data-id="${item.id}">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    <button class="remove-btn" data-id="${item.id}">Eliminar</button>
                </div>
                <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>
            </div>
        `;
        
        cartItemsContainer.appendChild(cartItem);
    });
    
    cartTotal.textContent = `$${total.toFixed(2)}`;
    
    // Agrega event listeners a los controles del carrito
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', updateQuantity);
    });
    
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', removeItem);
    });
}

function updateQuantity(e) {
    const button = e.target;
    const id = button.dataset.id;
    const item = cart.find(item => item.id === id);
    
    if (button.classList.contains('plus')) {
        item.quantity++;
    } else if (button.classList.contains('minus') && item.quantity > 1) {
        item.quantity--;
    }
    
    updateCart();
}

function removeItem(e) {
    const id = e.target.dataset.id;
    cart = cart.filter(item => item.id !== id);
    updateCart();
    showFeedback('Producto eliminado del carrito');
}

// Manejo del modal del carrito
function setupEventListeners() {
    // Menú móvil
    const mobileBtn = document.querySelector('.mobile-btn');
    const navList = document.querySelector('.nav-list');
    
    mobileBtn.addEventListener('click', () => {
        navList.classList.toggle('active');
    });
    
    // Carrito
    cartLink.addEventListener('click', (e) => {
        e.preventDefault();
        cartModal.setAttribute('aria-hidden', 'false');
        cartModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });
    
    closeCart.addEventListener('click', () => {
        closeCartModal();
    });
    
    // Cierra al hacer clic fuera del modal
    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            closeCartModal();
        }
    });
    
    // Finaliza la compra
    checkoutBtn.addEventListener('click', () => {
        if (cart.length > 0) {
            showFeedback('Compra finalizada con éxito', 'success');
            cart = [];
            updateCart();
            closeCartModal();
        } else {
            showFeedback('El carrito está vacío', 'error');
        }
    });
    
    // Validación del formulario
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', validateForm);
    }
}

function closeCartModal() {
    cartModal.setAttribute('aria-hidden', 'true');
    cartModal.style.display = 'none';
    document.body.style.overflow = '';
}

// Validación de formulario
function validateForm(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('input[type="text"]');
    const email = form.querySelector('input[type="email"]');
    const message = form.querySelector('textarea');
    let isValid = true;
    
    // Valida el nombre
    if (!name.value.trim()) {
        showError(name, 'Por favor ingresa tu nombre');
        isValid = false;
    } else {
        clearError(name);
    }
    
    // Valida el email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim()) {
        showError(email, 'Por favor ingresa tu email');
        isValid = false;
    } else if (!emailRegex.test(email.value)) {
        showError(email, 'Por favor ingresa un email válido');
        isValid = false;
    } else {
        clearError(email);
    }
    
    // Valida el mensaje
    if (!message.value.trim()) {
        showError(message, 'Por favor ingresa tu mensaje');
        isValid = false;
    } else {
        clearError(message);
    }
    
    if (isValid) {
        showFeedback('Mensaje enviado con éxito', 'success');
        form.reset();
    }
}

function showError(input, message) {
    const formGroup = input.closest('.form-group');
    let error = formGroup.querySelector('.error-message');
    
    if (!error) {
        error = document.createElement('div');
        error.className = 'error-message';
        formGroup.appendChild(error);
    }
    
    error.textContent = message;
    input.style.borderColor = 'var(--color-primary)';
}

function clearError(input) {
    const formGroup = input.closest('.form-group');
    const error = formGroup.querySelector('.error-message');
    
    if (error) {
        error.remove();
    }
    
    input.style.borderColor = '';
}

function showFeedback(message, type = 'info') {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.textContent = message;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        feedback.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        feedback.classList.remove('show');
        setTimeout(() => feedback.remove(), 500);
    }, 3000);
}