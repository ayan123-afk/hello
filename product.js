import { supabase } from './supabase.js';

const productList = document.getElementById('product-list');
let cart = JSON.parse(localStorage.getItem('cart')) || [];

async function loadProducts() {
    const { data: products, error } = await supabase.from('products').select('*');
    if(error) return console.log(error);

    if(!products.length) {
        productList.innerHTML = '<p>No products available yet.</p>';
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
                <div class="product-price">₹${p.price}</div>
                <button class="add-to-cart" onclick="addToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price})">
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

function addToCart(id, name, price){
    const idx = cart.findIndex(c=>c.id===id);
    if(idx > -1) cart[idx].quantity += 1;
    else cart.push({id, name, price, quantity:1});
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    document.getElementById('cart-count').textContent = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Show notification
    const notification = document.createElement('div');
    notification.textContent = `${name} added to cart`;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #ff5c5c;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Initialize cart count
document.getElementById('cart-count').textContent = cart.reduce((total, item) => total + item.quantity, 0);

window.addToCart = addToCart;
window.loadProducts = loadProducts;
loadProducts();

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
