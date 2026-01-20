import { supabase } from './supabase.js';

const IMDB_API_KEY = '6a988d483bd741da6bba140240e912e8';
let selectedImage = null;

// Redirect to login if not logged in
const session = JSON.parse(localStorage.getItem('admin_session'));
if(!session){
    window.location.href = 'admin-login.html';
}

// Search for image from IMDB API
async function searchImage() {
    const query = document.getElementById('psearch').value.trim();
    if(!query) return alert('Enter product/movie title');

    try {
        const res = await fetch(`https://imdb-api.com/en/API/SearchMovie/${IMDB_API_KEY}/${encodeURIComponent(query)}`);
        const data = await res.json();

        if(!data.results || data.results.length === 0) {
            document.getElementById('preview').innerHTML = '<p>No image found.</p>';
            selectedImage = null;
            document.getElementById('addBtn').disabled = true;
            return;
        }

        // Take first result
        selectedImage = data.results[0].image;
        document.getElementById('preview').innerHTML = `
            <img src="${selectedImage}" alt="Preview" style="width:150px; border-radius:10px;">
        `;
        document.getElementById('addBtn').disabled = false;

    } catch(err) {
        console.log(err);
        alert('Error fetching image from IMDB');
    }
}

// Add product to Supabase
async function addProduct() {
    const name = document.getElementById('pname').value.trim();
    const desc = document.getElementById('pdesc').value.trim();
    const price = parseFloat(document.getElementById('pprice').value);

    if(!name || !price || !selectedImage) return alert('Fill all fields and select image');

    const { error } = await supabase.from('products').insert([{
        name, description: desc, price, image_url: selectedImage
    }]);

    if(error) return alert('Failed to add product: ' + error.message);

    alert('Product added successfully!');
    document.getElementById('pname').value = '';
    document.getElementById('pdesc').value = '';
    document.getElementById('pprice').value = '';
    document.getElementById('psearch').value = '';
    document.getElementById('preview').innerHTML = '';
    selectedImage = null;
    document.getElementById('addBtn').disabled = true;

    loadProducts();
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

// Orders status update
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

window.searchImage = searchImage;
window.addProduct = addProduct;
window.loadProducts = loadProducts;
window.loadOrders = loadOrders;
window.markDelivered = markDelivered;
window.markPending = markPending;
window.logout = logout;

loadProducts();
loadOrders();
