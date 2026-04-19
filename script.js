// Accordion Logic
function toggleAccordion(button) {
    const content = button.nextElementSibling;
    const icon = button.querySelector('span');
    
    // Toggle active class on content
    content.classList.toggle('active');
    
    // Update icon
    if (content.classList.contains('active')) {
        icon.textContent = '-';
    } else {
        icon.textContent = '+';
    }
}

// Product Gallery Image Swapping
function changeImage(thumbnail) {
    // Get the main image element
    const mainImg = document.getElementById('main-product-img');
    
    if (mainImg) {
        // Update main image source
        mainImg.src = thumbnail.src;
        
        // Update active state on thumbnails
        const thumbnails = document.querySelectorAll('.pdp-thumbnails img');
        thumbnails.forEach(t => t.classList.remove('active'));
        thumbnail.classList.add('active');
    }
}

// Size Selector Logic
document.addEventListener('DOMContentLoaded', () => {
    const sizeBtns = document.querySelectorAll('.size-btn');
    
    sizeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all size buttons
            sizeBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
        });
    });
});

// Simple Header Scroll Effect (for adding shadow on scroll)
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 50) {
        header.style.backgroundColor = 'var(--color-spice-dark)';
        header.style.color = 'var(--color-beige-light)';
        header.style.boxShadow = 'var(--shadow-sm)';
    } else {
        // If not on the shop page (which has static dark header), revert to transparent
        if (!window.location.pathname.includes('shop.html')) {
            header.style.backgroundColor = 'transparent';
            header.style.boxShadow = 'none';
        }
    }
});

/* --- Cart System & 3D Animations --- */

window.cart = JSON.parse(localStorage.getItem('surtika_cart')) || [];
const cart = window.cart;

window.saveCart = function() {
    localStorage.setItem('surtika_cart', JSON.stringify(window.cart));
    updateCartUI();
}
const saveCart = window.saveCart;

window.updateCartUI = function() {
    // Update badges
    const badges = document.querySelectorAll('.cart-badge');
    const totalItems = (window.cart || []).reduce((sum, item) => sum + item.quantity, 0);
    badges.forEach(badge => {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    });

    let total = 0;
    if (window.cart && window.cart.length > 0) {
        total = window.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Update cart sidebar items (if present on the page)
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalEl = document.getElementById('cart-total');
    
    if (cartItemsContainer && cartTotalEl) {
        cartItemsContainer.innerHTML = '';
        if (!window.cart || window.cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align: center; color: var(--color-brown-light); margin-top: 2rem;">Your bag is empty.</p>';
        } else {
            window.cart.forEach((item, index) => {
                cartItemsContainer.innerHTML += `
                    <div class="cart-item">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                        <div class="cart-item-details">
                            <div class="cart-item-title">${item.name}</div>
                            <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
                            <div class="cart-item-actions">
                                <div class="qty-controls">
                                    <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                                    <input type="text" class="qty-input" value="${item.quantity}" readonly>
                                    <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                                </div>
                                <button class="remove-item" onclick="removeFromCart(${index})">Remove</button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        cartTotalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
    }

    // Update dedicated checkout page if it exists
    const checkoutPageItems = document.getElementById('checkout-page-items');
    const checkoutSubtotal = document.getElementById('checkout-page-subtotal');
    const checkoutTotal = document.getElementById('checkout-page-total');
    
    if (checkoutPageItems && checkoutSubtotal && checkoutTotal) {
        checkoutPageItems.innerHTML = '';
        if (!window.cart || window.cart.length === 0) {
            checkoutPageItems.innerHTML = '<p class="text-on-surface-variant font-body">Your bag is empty.</p>';
        } else {
            window.cart.forEach((item, index) => {
                checkoutPageItems.innerHTML += `
                <div class="flex gap-4 items-center">
                    <div class="w-20 h-24 bg-surface-container-low rounded overflow-hidden flex-shrink-0">
                        <img alt="${item.name}" class="w-full h-full object-cover" src="${item.image}"/>
                    </div>
                    <div class="flex-grow">
                        <h4 class="font-headline text-on-surface font-semibold">${item.name}</h4>
                        <p class="text-sm text-on-surface-variant font-body">Qty: ${item.quantity}</p>
                        <p class="text-on-surface font-medium mt-1">₹${(item.price * item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                </div>
                `;
            });
        }
        checkoutSubtotal.textContent = `₹${total.toLocaleString('en-IN')}`;
        checkoutTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
    }
}

function addToCart(product) {
    if (!window.cart) window.cart = [];
    const existingIndex = window.cart.findIndex(item => item.id === product.id);
    if (existingIndex > -1) {
        window.cart[existingIndex].quantity += 1;
    } else {
        window.cart.push({ ...product, quantity: 1 });
    }
    saveCart();
}

function updateQty(index, change) {
    if (window.cart && window.cart[index]) {
        window.cart[index].quantity += change;
        if (window.cart[index].quantity <= 0) {
            window.cart.splice(index, 1);
        }
        saveCart();
    }
}

function removeFromCart(index) {
    if (window.cart) {
        window.cart.splice(index, 1);
        saveCart();
    }
}

function toggleCart() {
    const overlay = document.getElementById('cart-overlay');
    const sidebar = document.getElementById('cart-sidebar');
    
    if (overlay && sidebar) {
        overlay.classList.toggle('active');
        sidebar.classList.toggle('active');
    }
}

// View Switching inside Cart Sidebar
function proceedToCheckoutForm() {
    if (!window.cart || window.cart.length === 0) {
        alert("Your bag is empty!");
        return;
    }
    // Navigate to the standalone Stitch checkout page
    window.location.href = 'checkout.html';
}

function backToCartItems() {
    const inner = document.getElementById('cart-scene-inner');
    if (inner) {
        inner.classList.remove('show-checkout');
    }
}

// Handle Checkout Form Submission
function handleCheckoutSubmit(event) {
    event.preventDefault(); // Prevent page reload
    
    // The form is natively validated by HTML5 'required' attributes.
    // If this function runs, it means all inputs are valid.
    
    // Trigger the 3D success animation
    handleCheckout3D();
}

// Handle Standalone Stitch Checkout Submission
function handleStitchCheckout(event) {
    event.preventDefault();
    if (!window.cart || window.cart.length === 0) {
        alert("Your bag is empty!");
        return;
    }
    
    // Clear cart and show success alert
    alert("Order Confirmed! Your exquisite pieces are being prepared.");
    window.cart = [];
    saveCart();
    
    // Redirect to home page after success
    window.location.href = 'index.html';
}

// 3D Add to Bag Animation
function handleAddToBag3D(btnElement, product) {
    const container = btnElement.closest('.btn-3d-container');
    const btn3d = container.querySelector('.btn-3d');
    
    // Add to cart logic
    addToCart(product);
    
    // Trigger 3D Flip
    btn3d.classList.add('flipped');
    
    // Open cart after animation completes
    setTimeout(() => {
        btn3d.classList.remove('flipped');
        toggleCart();
    }, 1500);
}

// 3D Checkout Animation
function handleCheckout3D() {
    if (!window.cart || window.cart.length === 0) {
        alert("Your bag is empty!");
        return;
    }

    const scene = document.getElementById('checkout-scene');
    const successScreen = document.getElementById('success-screen');
    
    // Trigger folding animation
    scene.classList.add('folding');
    
    // Show success screen and clear cart
    setTimeout(() => {
        successScreen.classList.add('active');
        window.cart = [];
        saveCart();
        
        // Reset everything after showing success
        setTimeout(() => {
            toggleCart();
            setTimeout(() => {
                scene.classList.remove('folding');
                successScreen.classList.remove('active');
                backToCartItems();
                
                // Clear the form fields across all forms
                document.querySelectorAll('#checkout-form').forEach(form => form.reset());
            }, 500); // Wait for sidebar to close before resetting
        }, 2500); // Show success for 2.5s
    }, 1500); // Match CSS transition duration
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
});
