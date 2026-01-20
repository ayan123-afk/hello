import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

export const supabase = createClient(
  'https://lkwtqyqjccurtpvhutsj.supabase.co',
  'sb_publishable_rcK2wyn_PsxA8QDzu8YzVA_iJoVrawj'
);

// Check admin login
const session = JSON.parse(localStorage.getItem('admin_session'));
if(!session) window.location.href = 'admin-login.html';

// Preview image
document.getElementById('pimage').addEventListener('change', function(){
    const file = this.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        document.getElementById('preview').innerHTML = `<img src="${reader.result}" width="150" style="border-radius:10px;">`;
    }
    reader.readAsDataURL(file);
});

// Upload product
export async function addProduct() {
    const name = document.getElementById('pname').value.trim();
    const desc = document.getElementById('pdesc').value.trim();
    const price = parseFloat(document.getElementById('pprice').value);
    const fileInput = document.getElementById('pimage');

    if(!name || !price || !fileInput.files.length) return alert('Fill all fields');

    const file = fileInput.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;

    try {
        // Upload image to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images') // Bucket must exist
            .upload(fileName, file);

        if(uploadError) throw uploadError;

        // Get public URL
        const { publicUrl } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

        // Insert product
        const { error } = await supabase.from('products').insert([{
            name, description: desc, price, image_url: publicUrl
        }]);

        if(error) throw error;

        alert('Product uploaded successfully!');
        document.getElementById('pname').value = '';
        document.getElementById('pdesc').value = '';
        document.getElementById('pprice').value = '';
        document.getElementById('pimage').value = '';
        document.getElementById('preview').innerHTML = '';
        loadProducts();

    } catch(err) {
        console.log(err);
        alert('Error uploading product: ' + err.message);
    }
}

// Load products
export async function loadProducts() {
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
export async function loadOrders() {
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

// Update order status
export async function markDelivered(id) {
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', id);
    loadOrders();
}
export async function markPending(id) {
    await supabase.from('orders').update({ status: 'pending' }).eq('id', id);
    loadOrders();
}

// Logout
export async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('admin_session');
    window.location.href = 'admin-login.html';
}

// Expose globally
window.addProduct = addProduct;
window.loadProducts = loadProducts;
window.loadOrders = loadOrders;
window.markDelivered = markDelivered;
window.markPending = markPending;
window.logout = logout;

// Initial load
loadProducts();
loadOrders();
