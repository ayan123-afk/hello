import { supabase } from './supabase.js';
const IMDB_API_KEY = '6a988d483bd741da6bba140240e912e8';

async function addProduct() {
    const name = document.getElementById('pname').value;
    const desc = document.getElementById('pdesc').value;
    const price = document.getElementById('pprice').value;
    const title = document.getElementById('pimg').value;

    // Fetch image from IMDB API
    const res = await fetch(`https://imdb-api.com/en/API/SearchMovie/${IMDB_API_KEY}/${title}`);
    const data = await res.json();
    const image_url = data.results?.[0]?.image || '';

    const { error } = await supabase.from('products').insert([{ name, description: desc, price, image_url }]);
    if(error) return alert(error.message);

    alert('Product added!');
    loadOrders();
}

async function loadOrders() {
    const { data: orders, error } = await supabase.from('orders').select('*');
    if(error) return console.log(error);

    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = orders.map(o => `
        <div>
            <p><b>${o.customer_name}</b> - ₹${o.total} - Status: ${o.status}</p>
            <button onclick="markDelivered(${o.id})">Delivered ✅</button>
            <button onclick="markPending(${o.id})">Pending ❌</button>
        </div>
    `).join('');
}

async function markDelivered(id){
    await supabase.from('orders').update({status:'delivered'}).eq('id', id);
    loadOrders();
}

async function markPending(id){
    await supabase.from('orders').update({status:'pending'}).eq('id', id);
    loadOrders();
}

window.addProduct = addProduct;
window.markDelivered = markDelivered;
window.markPending = markPending;

loadOrders();
