import { supabase } from './supabase.js';

const productList = document.getElementById('product-list');
let cart = JSON.parse(localStorage.getItem('cart')) || [];
document.getElementById('cart-count').innerText = cart.length;

async function loadProducts() {
    const { data: products, error } = await supabase.from('products').select('*');
    if(error) return console.log(error);

    productList.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.image_url}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p>${p.description}</p>
            <p>₹${p.price}</p>
            <button onclick="addToCart(${p.id}, '${p.name}', ${p.price})">Add to Cart</button>
        </div>
    `).join('');
}

function addToCart(id, name, price) {
    const itemIndex = cart.findIndex(c => c.id === id);
    if(itemIndex > -1) {
        cart[itemIndex].quantity += 1;
    } else {
        cart.push({id, name, price, quantity:1});
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    document.getElementById('cart-count').innerText = cart.length;
}

window.addToCart = addToCart;
loadProducts();
