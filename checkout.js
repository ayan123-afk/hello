// product.js
import { supabase } from './supabase.js';

const productList = document.getElementById('product-list');
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Update cart count on all pages
function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }
}

// Initialize cart count when page loads
updateCartCount();

async function loadProducts() {
    // Only run on index.html page
    if (!productList) return;
    
    const { data: products, error } = await supabase.from('products').select('*');
    if(error) return console.log(error);

    if(!products.length) {
        productList.innerHTML = '<p style="text-align: center; padding: 60px; color: #666;">No products available yet.</p>';
    } else {
        productList.innerHTML = products.map(p => `
            <div class="product-card">
                <div class="image-container">
                    <img src="${p.image_url}" alt="${p.name}" loading="lazy">
                </div>
                <h3>${p.name}</h3>
                <div class="product-description truncated">
                    ${p.description}
                    ${p.description.length > 100 ? '<button class="read-more-btn">Read more</button>' : ''}
                </div>
                <div class="product-price">${p.price}</div>
                <button class="add-to-cart" onclick="addToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image_url}')">
                    Add to Cart
                </button>
            </div>
        `).join('');
        
        // Add event listeners for Read More buttons
        document.querySelectorAll('.read-more-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const desc = this.parentElement;
                if(desc.classList.contains('truncated')) {
                    desc.classList.remove('truncated');
                    desc.classList.add('full');
                    this.textContent = 'Read less';
                } else {
                    desc.classList.remove('full');
                    desc.classList.add('truncated');
                    this.textContent = 'Read more';
                }
            });
        });
    }
}

function addToCart(id, name, price, image_url){
    const idx = cart.findIndex(c=>c.id===id);
    if(idx > -1) {
        cart[idx].quantity += 1;
    } else {
        cart.push({id, name, price, image_url, quantity:1});
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Show notification
    showNotification(`${name} added to cart`);
}

function showNotification(message) {
    // Remove existing notification
    const existingNotification = document.querySelector('.cart-notification');
    if (existingNotification) existingNotification.remove();
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #ff5c5c;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Export functions for global use
window.addToCart = addToCart;
window.loadProducts = loadProducts;

// Load products when on index page
if (productList) {
    loadProducts();
}
