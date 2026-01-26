// checkout.js
import { supabase } from './supabase.js';

const form = document.getElementById('checkout-form');
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    loadOrderSummary();
});

// Update cart count in navbar
function updateCartCount() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
}

// Load order summary from cart
function loadOrderSummary() {
    const orderItemsContainer = document.getElementById('order-items');
    const subtotalElement = document.getElementById('subtotal');
    const totalElement = document.getElementById('total');
    const placeOrderBtn = document.getElementById('place-order-btn');
    
    if (cart.length === 0) {
        orderItemsContainer.innerHTML = `
            <div class="empty-cart-message">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <p style="margin-top: 1rem; font-size: 0.9rem;">
                    <a href="index.html" style="color: var(--primary); text-decoration: none;">
                        <i class="fas fa-shopping-bag"></i> Continue Shopping
                    </a>
                </p>
            </div>
        `;
        subtotalElement.textContent = 'PKR 0';
        totalElement.textContent = 'PKR 0';
        
        if (placeOrderBtn) {
            placeOrderBtn.disabled = true;
            placeOrderBtn.textContent = 'Cart is Empty';
            placeOrderBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Cart is Empty';
        }
        return;
    }
    
    let subtotal = 0;
    let itemsHTML = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        itemsHTML += `
            <div class="order-item">
                <div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-quantity">Quantity: ${item.quantity}</div>
                </div>
                <div class="item-price">PKR ${itemTotal}</div>
            </div>
        `;
    });
    
    orderItemsContainer.innerHTML = itemsHTML;
    subtotalElement.textContent = `PKR ${subtotal}`;
    totalElement.textContent = `PKR ${subtotal}`;
    
    if (placeOrderBtn) {
        placeOrderBtn.disabled = false;
    }
}

// Form submit handler (your original code)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(cart.length === 0) return alert('Cart is empty!');

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const total = cart.reduce((a,c)=>a+c.price*c.quantity, 0);

    // Insert order
    const { data: order, error: orderError } = await supabase.from('orders').insert([{
        customer_name:name,
        email,
        phone,
        address,
        total
    }]).select().single();

    if(orderError) return alert(orderError.message);

    // Insert order items
    for(let item of cart){
        await supabase.from('order_items').insert([{
            order_id: order.id,
            product_id: item.id,
            quantity: item.quantity
        }]);
    }

    alert('Order placed successfully!');
    localStorage.removeItem('cart');
    window.location.href = 'index.html';
});
