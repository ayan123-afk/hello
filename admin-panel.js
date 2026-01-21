import { supabase } from './supabase.js';

/* =====================
   LOGIN CHECK
===================== */
const session = JSON.parse(localStorage.getItem('admin_session'));
if (!session) {
  window.location.href = 'admin-login.html';
}

/* =====================
   ADD PRODUCT
===================== */
async function addProduct() {
  const name = document.getElementById('pname').value.trim();
  const desc = document.getElementById('pdesc').value.trim();
  const price = parseFloat(document.getElementById('pprice').value);
  const imageInput = document.getElementById('pimage');

  if (!name || !desc || !price || !imageInput.files.length) {
    alert('Fill all fields');
    return;
  }

  const file = imageInput.files[0];
  const ext = file.name.split('.').pop();
  const filePath = `products/${Date.now()}.${ext}`;

  try {
    /* Upload image */
    const { error: uploadError } = await supabase
      .storage
      .from('product-images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    /* Get public URL */
    const { data } = supabase
      .storage
      .from('product-images')
      .getPublicUrl(filePath);

    const image_url = data.publicUrl;

    /* Insert product */
    const { error } = await supabase.from('products').insert([{
      name,
      description: desc,
      price,
      image_url
    }]);

    if (error) throw error;

    alert('✅ Product Added');

    document.getElementById('pname').value = '';
    document.getElementById('pdesc').value = '';
    document.getElementById('pprice').value = '';
    document.getElementById('pimage').value = '';
    document.getElementById('preview').innerHTML = '';

    loadProducts();

  } catch (err) {
    console.error(err);
    alert('Error: ' + err.message);
  }
}

/* =====================
   IMAGE PREVIEW
===================== */
document.getElementById('pimage').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('preview').innerHTML =
      `<img src="${reader.result}" width="120" style="border-radius:8px;">`;
  };
  reader.readAsDataURL(file);
});

/* =====================
   LOAD PRODUCTS
===================== */
async function loadProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: false });

  if (error) return console.log(error);

  document.getElementById('product-list-admin').innerHTML = data.map(p => `
    <div class="product-card">
      <img src="${p.image_url}">
      <h4>${p.name}</h4>
      <p>₹${p.price}</p>
      <button onclick="deleteProduct(${p.id}, '${p.image_url}')"
        style="background:#e74c3c;color:#fff;border:none;padding:6px 10px;border-radius:6px;">
        🗑 Delete
      </button>
    </div>
  `).join('');
}

/* =====================
   DELETE PRODUCT
===================== */
async function deleteProduct(id, imageUrl) {
  if (!confirm('Delete this product?')) return;

  try {
    const path = imageUrl.split('/product-images/')[1];

    if (path) {
      await supabase.storage
        .from('product-images')
        .remove([path]);
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    alert('🗑 Product Deleted');
    loadProducts();

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}
// Load orders
async function loadOrders() {
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

// Orders status
async function markDelivered(id) {
  await supabase.from('orders').update({ status: 'delivered' }).eq('id', id);
  loadOrders();
}
async function markPending(id) {
  await supabase.from('orders').update({ status: 'pending' }).eq('id', id);
  loadOrders();
}


/* =====================
   LOGOUT
===================== */
async function logout() {
  await supabase.auth.signOut();
  localStorage.removeItem('admin_session');
  window.location.href = 'admin-login.html';
}

/* =====================
   EXPOSE
===================== */
window.addProduct = addProduct;
window.loadProducts = loadProducts;
window.deleteProduct = deleteProduct;
window.logout = logout;

loadProducts();
