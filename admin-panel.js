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
  const fileInput = document.getElementById('pimage');

  if (!name || !desc || !price || !fileInput.files.length) {
    alert('Fill all fields');
    return;
  }

  const file = fileInput.files[0];
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
    const { data: urlData } = supabase
      .storage
      .from('product-images')
      .getPublicUrl(filePath);

    const image_url = urlData.publicUrl;

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
   LOAD PRODUCTS (ADMIN)
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
    </div>
  `).join('');
}

/* =====================
   LOAD ORDERS
===================== */
async function loadOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('id', { ascending: false });

  if (error) return console.log(error);

  document.getElementById('orders-list').innerHTML = data.map(o => `
    <div class="order-card">
      <b>${o.customer_name}</b> (${o.phone})<br>
      ${o.address}<br>
      <b>Total:</b> ₹${o.total}<br>
      <b>Status:</b> ${o.status}
      <br><br>
      <button onclick="setStatus(${o.id}, 'delivered')">✅ Delivered</button>
      <button onclick="setStatus(${o.id}, 'pending')">❌ Pending</button>
    </div>
  `).join('');
}

/* =====================
   UPDATE ORDER STATUS
===================== */
async function setStatus(id, status) {
  await supabase.from('orders').update({ status }).eq('id', id);
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
window.loadOrders = loadOrders;
window.setStatus = setStatus;
window.logout = logout;

loadProducts();
loadOrders();
