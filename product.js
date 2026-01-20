import { supabase } from './supabase.js';

const productList = document.getElementById('product-list');
let cart = JSON.parse(localStorage.getItem('cart')) || [];

async function loadProducts() {
    const { data: products, error } = await supabase.from('products').select('*');
    if(error) return console.log(error);

    if(!products.length) productList.innerHTML = '<p>No products available yet.</p>';
    else {
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
}

function addToCart(id, name, price){
    const idx = cart.findIndex(c=>c.id===id);
    if(idx > -1) cart[idx].quantity += 1;
    else cart.push({id, name, price, quantity:1});
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${name} added to cart`);
}

window.addToCart = addToCart;
window.loadProducts = loadProducts;
loadProducts();
