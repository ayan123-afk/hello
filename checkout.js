// checkout.js
import { supabase } from './supabase.js';

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    loadOrderSummary();
    
    // Get form and add submit event listener
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});

// Update cart count in navbar
function updateCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = totalItems;
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Load order summary from cart
function loadOrderSummary() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
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
        
    } catch (error) {
        console.error('Error loading order summary:', error);
    }
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    try {
        // Get cart data
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Check if cart is empty
        if (cart.length === 0) {
            alert('Your cart is empty! Please add items to your cart before checking out.');
            window.location.href = 'index.html';
            return;
        }
        
        // Get form values
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const notes = document.getElementById('notes').value.trim();
        
        // Simple validation
        if (!name || !email || !phone || !address) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // Calculate total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Show loading state
        const placeOrderBtn = document.getElementById('place-order-btn');
        const originalText = placeOrderBtn.innerHTML;
        placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        placeOrderBtn.disabled = true;
        
        // Insert order into Supabase
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([{
                customer_name: name,
                email: email,
                phone: phone,
                address: address,
                notes: notes || null,
                total: total,
                status: 'pending',
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (orderError) {
            console.error('Order error:', orderError);
            alert('Error placing order: ' + orderError.message);
            placeOrderBtn.innerHTML = originalText;
            placeOrderBtn.disabled = false;
            return;
        }
        
        // Insert order items
        const orderItems = cart.map(item => ({
            order_id: order.id,
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
        }));
        
        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);
        
        if (itemsError) {
            console.error('Order items error:', itemsError);
            alert('Error saving order items. Please contact support.');
            placeOrderBtn.innerHTML = originalText;
            placeOrderBtn.disabled = false;
            return;
        }
        
        // Success - clear cart and show confirmation
        localStorage.removeItem('cart');
        updateCartCount();
        
        alert('✅ Order placed successfully!\n\nOrder ID: #' + order.id + '\nTotal: PKR ' + total + '\n\nThank you for shopping with Mashallah Boutique!');
        
        // Redirect to home page
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Form submission error:', error);
        alert('An unexpected error occurred. Please try again.');
        
        // Reset button state
        const placeOrderBtn = document.getElementById('place-order-btn');
        if (placeOrderBtn) {
            placeOrderBtn.innerHTML = '<i class="fas fa-lock"></i> Place Order & Pay';
            placeOrderBtn.disabled = false;
        }
    }
}

// Export functions if needed elsewhere
export { updateCartCount, loadOrderSummary };
