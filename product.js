import { supabase } from './supabase.js';

const productList = document.getElementById('product-list');
let cart = JSON.parse(localStorage.getItem('cart')) || [];

async function loadProducts() {
    const { data: products, error } = await supabase.from('products').select('*');
    if(error) return console.log(error);

    if(!products.length) {
        productList.innerHTML = '<p class="no-products">No products available yet.</p>';
    } else {
        productList.innerHTML = products.map(p => `
            <div class="product-card">
                <div class="image-container">
                    <img src="${p.image_url}" alt="${p.name}" loading="lazy">
                    ${p.original_price && p.original_price > p.price ? `
                        <div class="discount-badge">
                            ${Math.round(((p.original_price - p.price) / p.original_price) * 100)}% OFF
                        </div>
                    ` : ''}
                </div>
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <div class="product-description truncated">
                        ${p.description}
                        ${p.description.length > 100 ? '<button class="read-more-btn">Read more</button>' : ''}
                    </div>
                    <div class="price-container">
                        <div class="product-price">PKR ${p.price.toLocaleString()}</div>
                        ${p.original_price && p.original_price > p.price ? `
                            <div class="original-price">PKR ${p.original_price.toLocaleString()}</div>
                        ` : ''}
                    </div>
                    <button class="add-to-cart" onclick="addToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image_url}')">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
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

function addToCart(id, name, price, image){
    const idx = cart.findIndex(c => c.id === id);
    if(idx > -1) {
        cart[idx].quantity += 1;
        showToast(`${name} quantity increased to ${cart[idx].quantity}`);
    } else {
        cart.push({
            id, 
            name, 
            price, 
            image,
            quantity: 1
        });
        showToast(`${name} added to cart`);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;
}

// Initialize cart count
updateCartCount();

window.addToCart = addToCart;
window.loadProducts = loadProducts;
loadProducts();
