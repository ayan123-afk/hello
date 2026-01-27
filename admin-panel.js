import { supabase } from './supabase.js';

// Check if user is logged in
const session = JSON.parse(localStorage.getItem('admin_session'));
if (!session) {
  window.location.href = 'admin-login.html';
}

/* ========== TAB FUNCTIONS ========== */
function showTab(tabName) {
  // Update active tab button
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Show selected tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabName}-tab`).classList.add('active');

  // Load data for the tab
  if (tabName === 'dashboard') {
    loadDashboard();
  } else if (tabName === 'products') {
    loadProducts();
  } else if (tabName === 'orders') {
    loadOrders();
  }
}

/* ========== DASHBOARD FUNCTIONS ========== */
async function loadDashboard() {
  const loadingDiv = document.getElementById('dashboard-loading');
  const contentDiv = document.getElementById('dashboard-content');
  
  try {
    // Load products count
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    document.getElementById('total-products').textContent = productCount || 0;

    // Load orders count
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    document.getElementById('total-orders').textContent = orderCount || 0;

    // Load total revenue
    const { data: orders } = await supabase
      .from('orders')
      .select('total');
    
    let totalRevenue = 0;
    if (orders) {
      totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
    }
    document.getElementById('total-revenue').textContent = `₹${totalRevenue.toFixed(2)}`;

    // Load unique customers
    const { data: uniqueCustomers } = await supabase
      .from('orders')
      .select('email');
    
    let customerCount = 0;
    if (uniqueCustomers) {
      const uniqueEmails = new Set(uniqueCustomers.map(c => c.email));
      customerCount = uniqueEmails.size;
    }
    document.getElementById('total-customers').textContent = customerCount;

    // Hide loading, show content
    loadingDiv.style.display = 'none';
    contentDiv.style.display = 'block';
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    loadingDiv.innerHTML = 'Error loading dashboard. Please refresh.';
  }
}

/* ========== PRODUCT FUNCTIONS ========== */
async function addProduct() {
  const name = document.getElementById('pname').value.trim();
  const desc = document.getElementById('pdesc').value.trim();
  const price = parseFloat(document.getElementById('pprice').value);
  const imageInput = document.getElementById('pimage');

  if (!name || !desc || !price || !imageInput.files.length) {
    alert('Please fill all fields and select an image');
    return;
  }

  const file = imageInput.files[0];
  const ext = file.name.split('.').pop();
  const filePath = `products/${Date.now()}.${ext}`;

  try {
    // Upload image
    const { error: uploadError } = await supabase
      .storage
      .from('product-images')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('product-images')
      .getPublicUrl(filePath);

    const image_url = urlData.publicUrl;

    // Insert product
    const { error } = await supabase
      .from('products')
      .insert([{
        name,
        description: desc,
        price,
        image_url
      }]);
    
    if (error) throw error;

    alert('✅ Product Added Successfully!');
    
    // Reset form
    document.getElementById('pname').value = '';
    document.getElementById('pdesc').value = '';
    document.getElementById('pprice').value = '';
    document.getElementById('pimage').value = '';
    document.getElementById('preview').innerHTML = '';

    // Update dashboard stats
    loadDashboard();
    
  } catch (err) {
    console.error(err);
    alert('Error: ' + err.message);
  }
}

// Image preview
document.getElementById('pimage').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('preview').innerHTML = `
      <img src="${reader.result}" width="150" style="border-radius:8px;border:2px solid #3b82f6;">
    `;
  };
  reader.readAsDataURL(file);
});

async function loadProducts() {
  const loadingDiv = document.getElementById('products-loading');
  const productsDiv = document.getElementById('product-list-admin');
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    loadingDiv.style.display = 'none';
    
    if (!data || data.length === 0) {
      productsDiv.innerHTML = '<p style="text-align:center;color:#cbd5e1;padding:40px;">No products found. Add your first product!</p>';
      return;
    }

    productsDiv.innerHTML = data.map(p => `
      <div class="product-card">
        <img src="${p.image_url}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x180?text=No+Image'">
        <div class="content">
          <h4>${p.name}</h4>
          <p style="color:#94a3b8;margin-bottom:10px;font-size:14px;">${p.description}</p>
          <div class="price">₹${p.price}</div>
          <button onclick="deleteProduct(${p.id}, '${p.image_url}')" class="delete-btn">
            Delete Product
          </button>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Error loading products:', error);
    loadingDiv.innerHTML = 'Error loading products. Please refresh.';
  }
}

async function deleteProduct(id, imageUrl) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  try {
    // Extract file path from URL
    const path = imageUrl.split('/product-images/')[1];
    if (path) {
      await supabase.storage.from('product-images').remove([path]);
    }

    // Delete from database
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;

    alert('🗑️ Product Deleted');
    loadProducts();
    loadDashboard(); // Update stats
    
  } catch (err) {
    console.error(err);
    alert('Error: ' + err.message);
  }
}

/* ========== ORDER FUNCTIONS ========== */
async function loadOrders() {
  const loadingDiv = document.getElementById('orders-loading');
  const ordersBody = document.getElementById('orders-list');
  
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    loadingDiv.style.display = 'none';
    
    if (!orders || orders.length === 0) {
      ordersBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:40px;color:#cbd5e1;">
            No orders found yet.
          </td>
        </tr>
      `;
      return;
    }

    ordersBody.innerHTML = orders.map(o => `
      <tr>
        <td>#${o.id}</td>
        <td>
          <strong>${o.customer_name}</strong><br>
          <small>${o.email}</small>
        </td>
        <td>₹${o.total}</td>
        <td>
          <span class="status-badge ${o.status === 'delivered' ? 'status-delivered' : 'status-pending'}">
            ${o.status}
          </span>
        </td>
        <td>${new Date(o.created_at).toLocaleDateString()}</td>
        <td>
          <button onclick="updateOrderStatus(${o.id}, 'delivered')" class="action-btn btn-success">
            Delivered
          </button>
          <button onclick="updateOrderStatus(${o.id}, 'pending')" class="action-btn btn-warning">
            Pending
          </button>
        </td>
      </tr>
    `).join('');
    
  } catch (error) {
    console.error('Error loading orders:', error);
    loadingDiv.innerHTML = 'Error loading orders. Please refresh.';
  }
}

async function updateOrderStatus(orderId, status) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    
    if (error) throw error;

    alert(`✅ Order status updated to ${status}`);
    loadOrders();
    loadDashboard(); // Update stats
    
  } catch (err) {
    console.error(err);
    alert('Error updating order: ' + err.message);
  }
}

/* ========== LOGOUT ========== */
async function logout() {
  await supabase.auth.signOut();
  localStorage.removeItem('admin_session');
  window.location.href = 'admin-login.html';
}

/* ========== INITIAL LOAD ========== */
// Load dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
  loadDashboard();
  loadProducts();
  loadOrders();
});

// Make functions available globally
window.showTab = showTab;
window.addProduct = addProduct;
window.deleteProduct = deleteProduct;
window.updateOrderStatus = updateOrderStatus;
window.logout = logout;
