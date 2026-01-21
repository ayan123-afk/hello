import { supabase } from './supabase.js';

const productList = document.getElementById('product-list');
let cart = JSON.parse(localStorage.getItem('cart')) || [];

/* =====================
   LOAD PRODUCTS
===================== */
async function loadProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: false });

  if (error) return console.log(error);

  if (!data.length) {
    productList.innerHTML = '<p>No products yet.</p>';
    return;
  }

  productList.innerHTML = data.map(p => `
    <div class="product-card">
      <img src="${p.image_url}">
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <p>₹${p.price}</p>
      <button onclick="addToCart(${p.id}, '${p.name}', ${p.price})">
        Add to Cart
      </button>
    </div>
  `).join('');
}

/* =====================
   CART
===================== */
function addToCart(id, name, price) {
  const item = cart.find(c => c.id === id);
  if (item) item.qty++;
  else cart.push({ id, name, price, qty: 1 });

  localStorage.setItem('cart', JSON.stringify(cart));
  alert('Added to cart');
}

window.addToCart = addToCart;
loadProducts();
