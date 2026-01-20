import { supabase } from './supabase.js';

// IMDB API Key
const IMDB_API_KEY = '6a988d483bd741da6bba140240e912e8';

// Redirect to login if not logged in
const session = JSON.parse(localStorage.getItem('admin_session'));
if(!session){
    window.location.href = 'admin-login.html';
}

// Add product
async function addProduct() {
    const name = document.getElementById('pname').value.trim();
    const desc = document.getElementById('pdesc').value.trim();
    const price = parseFloat(document.getElementById('pprice').value);
    const imdb = document.getElementById('pimdb').value.trim();

    if(!name || !price || !imdb) return alert('Fill all fields');

    try {
        // Fetch image from IMDB API
        const res = await fetch(`https://imdb-api.com/en/API/SearchMovie/${IMDB_API_KEY}/${imdb}`);
        const data = await res.json();
        const image_url = data.results?.[0]?.image || '';

        if(!image_url) return alert('No image found from IMDB');

        // Insert product into Supabase
        const { error } = await supabase.from('products').insert([{
            name,
            description: desc,
            price,
            image_url
        }]);

        if(error) return alert('Failed to add product: ' + error.message);

        alert('Product added successfully!');
        document.getElementById('pname').value = '';
        document.getElementById('pdesc').value = '';
        document.getElementById('pprice').value = '';
        document.getElementById('pimdb').value = '';
        loadProducts();
    } catch(err) {
        console.log(err);
        alert('Error fetching IMDB image');
    }
}

// Load products in admin panel
async function loadProducts() {
    const { data: products, error } = await supabase.from('products').select('*');
    if(error) return console.log(error);

    const list = document.getElementById('product-list-admin');
    list.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.image_url}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p>₹${p.price}</p>
        </div>
    `).join('');
}

// Load orders
async function loadOrders(){
    const { data: orders } = await supabase.from('orders').select('*');
    const ordersDiv = document.getElementById('orders-list');

    ordersDiv.innerHTML = orders.map(o => `
        <div style="margin-bottom:10px; border:1px solid #ccc; padding:10px;">
            <b>${o.customer_name}</b> - ₹${o.total} - Status: ${o.status}<br>
            Email: ${o.email} | Phone: ${o.phone} | Address: ${o.address}<br>
            <button onclick="markDelivered(${o.id})">Delivered ✅</button>
            <button onclick="markPending(${o.id})">Pending ❌</button>
        </div>
    `).join('');
}

// Order status
async function markDelivered(id){
    await supabase.from('orders').update({status:'delivered'}).eq('id', id);
    loadOrders();
}
async function markPending(id){
    await supabase.from('orders').update({status:'pending'}).eq('id', id);
    loadOrders();
}

// Logout
async function logout(){
    await supabase.auth.signOut();
    localStorage.removeItem('admin_session');
    window.location.href = 'admin-login.html';
}

window.addProduct = addProduct;
window.loadProducts = loadProducts;
window.loadOrders = loadOrders;
window.markDelivered = markDelivered;
window.markPending = markPending;
window.logout = logout;

loadProducts();
loadOrders();
