import { supabase } from './supabase.js';

const form = document.getElementById('checkout-form');
let cart = JSON.parse(localStorage.getItem('cart')) || [];

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
