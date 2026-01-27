import { supabase } from './supabase.js';

/* =====================
   INITIALIZATION
===================== */
let currentUser = null;
let isInitialized = false;

/* =====================
   AUTH CHECK
===================== */
async function checkAuth() {
  const session = JSON.parse(localStorage.getItem('admin_session'));
  
  if (!session) {
    window.location.href = 'admin-login.html';
    return false;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      localStorage.removeItem('admin_session');
      window.location.href = 'admin-login.html';
      return false;
    }
    
    currentUser = user;
    return true;
  } catch (err) {
    console.error('Auth check failed:', err);
    window.location.href = 'admin-login.html';
    return false;
  }
}

/* =====================
   PAGE NAVIGATION
===================== */
function showDashboard() {
  setActiveNav('dashboard');
  document.getElementById('page-title').textContent = 'Dashboard';
  document.getElementById('dashboard-content').style.display = 'block';
  document.getElementById('products-content').style.display = 'none';
  document.getElementById('add-product-content').style.display = 'none';
  document.getElementById('orders-content').style.display = 'none';
  if (!isInitialized) initializeDashboard();
}

function showProducts() {
  setActiveNav('products');
  document.getElementById('page-title').textContent = 'Products';
  document.getElementById('dashboard-content').style.display = 'none';
  document.getElementById('products-content').style.display = 'block';
  document.getElementById('add-product-content').style.display = 'none';
  document.getElementById('orders-content').style.display = 'none';
  loadProducts();
}

function showAddProduct() {
  setActiveNav('add-product');
  document.getElementById('page-title').textContent = 'Add Product';
  document.getElementById('dashboard-content').style.display = 'none';
  document.getElementById('products-content').style.display = 'none';
  document.getElementById('add-product-content').style.display = 'block';
  document.getElementById('orders-content').style.display = 'none';
}

function showOrders() {
  setActiveNav('orders');
  document.getElementById('page-title').textContent = 'Orders';
  document.getElementById('dashboard-content').style.display = 'none';
  document.getElementById('products-content').style.display = 'none';
  document.getElementById('add-product-content').style.display = 'none';
  document.getElementById('orders-content').style.display = 'block';
  loadOrders();
}

function setActiveNav(page) {
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => link.classList.remove('active'));
  document.querySelector(`.nav-links a[onclick*="${page}"]`).classList.add('active');
}

/* =====================
   DASHBOARD INITIALIZATION
===================== */
async function initializeDashboard() {
  if (isInitialized) return;
  
  try {
    // Load stats
    await loadStats();
    
    // Load recent orders
    await loadRecentOrders();
    
    // Load recent products
    await loadRecentProducts();
    
    isInitialized = true;
  } catch (error) {
    console.error('Dashboard initialization failed:', error);
    showToast('Failed to load dashboard data', 'error');
  }
}

/* =====================
   LOAD STATS
===================== */
async function loadStats() {
  try {
    // Load total products
    const { count: productCount, error: productError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (!productError) {
      document.getElementById('total-products').textContent = productCount || 0;
    }

    // Load total orders
    const { count: orderCount, error: orderError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    if (!orderError) {
      document.getElementById('total-orders').textContent = orderCount || 0;
    }

    // Load total revenue
    const { data: orders, error: revenueError } = await supabase
      .from('orders')
      .select('total');
    
    if (!revenueError && orders) {
      const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
      document.getElementById('total-revenue').textContent = `₹${totalRevenue.toFixed(2)}`;
    }

    // Load total customers
    const { count: customerCount, error: customerError } = await supabase
      .from('orders')
      .select('email', { count: 'exact', head: true });
    
    if (!customerError) {
      document.getElementById('total-customers').textContent = customerCount || 0;
    }

  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

/* =====================
   LOAD RECENT ORDERS
===================== */
async function loadRecentOrders() {
  const recentOrdersDiv = document.getElementById('recent-orders');
  
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    if (!orders || orders.length === 0) {
      recentOrdersDiv.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-shopping-cart"></i>
          <h3>No orders yet</h3>
          <p>Orders will appear here when customers make purchases</p>
        </div>
      `;
      return;
    }
    
    recentOrdersDiv.innerHTML = `
      <table class="orders-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(order => `
            <tr>
              <td><strong>${order.customer_name}</strong></td>
              <td>₹${order.total}</td>
              <td><span class="order-status status-${order.status}">${order.status}</span></td>
              <td>${new Date(order.created_at).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Error loading recent orders:', error);
    recentOrdersDiv.innerHTML = `<p class="error">Failed to load orders</p>`;
  }
}

/* =====================
   LOAD RECENT PRODUCTS
===================== */
async function loadRecentProducts() {
  const recentProductsDiv = document.getElementById('recent-products');
  
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(4);
    
    if (error) throw error;
    
    if (!products || products.length === 0) {
      recentProductsDiv.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-box-open"></i>
          <h3>No products yet</h3>
          <p>Add your first product to get started</p>
        </div>
      `;
      return;
    }
    
    recentProductsDiv.innerHTML = `
      <div class="products-grid">
        ${products.map(product => `
          <div class="product-item">
            <img src="${product.image_url}" alt="${product.name}" class="product-img" onerror="this.src='https://via.placeholder.com/300x180?text=No+Image'">
            <div class="product-info">
              <h4>${product.name}</h4>
              <div class="product-price">₹${product.price}</div>
              <div class="product-actions">
                <button class="btn-delete" onclick="deleteProduct(${product.id}, '${product.image_url}')">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Error loading recent products:', error);
    recentProductsDiv.innerHTML = `<p class="error">Failed to load products</p>`;
  }
}

/* =====================
   ADD PRODUCT
===================== */
async function addProduct() {
  const name = document.getElementById('pname').value.trim();
  const desc = document.getElementById('pdesc').value.trim();
  const price = parseFloat(document.getElementById('pprice').value);
  const imageInput = document.getElementById('pimage');
  const addBtn = document.getElementById('add-product-btn');

  if (!name || !desc || !price || !imageInput.files.length) {
    showToast('Please fill all fields', 'error');
    return;
  }

  if (price <= 0) {
    showToast('Price must be greater than 0', 'error');
    return;
  }

  const file = imageInput.files[0];
  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file', 'error');
    return;
  }

  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
  const filePath = `products/${fileName}`;

  // Disable button and show loading
  addBtn.innerHTML = '<span class="spinner"></span> Uploading...';
  addBtn.disabled = true;

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
    const { error: insertError } = await supabase
      .from('products')
      .insert([{
        name,
        description: desc,
        price,
        image_url,
        created_at: new Date().toISOString()
      }]);
    
    if (insertError) throw insertError;

    // Reset form
    document.getElementById('pname').value = '';
    document.getElementById('pdesc').value = '';
    document.getElementById('pprice').value = '';
    document.getElementById('pimage').value = '';
    document.getElementById('preview').innerHTML = '';

    showToast('✅ Product added successfully!', 'success');
    
    // Update stats and recent products
    await loadStats();
    await loadRecentProducts();
    
    // Show products page
    showProducts();

  } catch (err) {
    console.error('Error adding product:', err);
    showToast('Error: ' + err.message, 'error');
  } finally {
    // Reset button
    addBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Product';
    addBtn.disabled = false;
  }
}

/* =====================
   IMAGE PREVIEW
===================== */
document.getElementById('pimage').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file', 'error');
    this.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('preview').innerHTML = `
      <img src="${reader.result}" class="preview-img" alt="Preview">
    `;
  };
  reader.readAsDataURL(file);
});

/* =====================
   LOAD PRODUCTS
===================== */
async function loadProducts() {
  const productsDiv = document.getElementById('product-list-admin');
  productsDiv.innerHTML = '<p style="text-align:center;padding:40px;"><span class="spinner"></span> Loading products...</p>';

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!products || products.length === 0) {
      productsDiv.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <i class="fas fa-box-open"></i>
          <h3>No products found</h3>
          <p>Click "Add New" to add your first product</p>
        </div>
      `;
      return;
    }

    productsDiv.innerHTML = products.map(product => `
      <div class="product-item">
        <img src="${product.image_url}" alt="${product.name}" class="product-img" onerror="this.src='https://via.placeholder.com/300x180?text=No+Image'">
        <div class="product-info">
          <h4>${product.name}</h4>
          <p style="color:#64748b;font-size:14px;margin-bottom:10px;">${product.description}</p>
          <div class="product-price">₹${product.price}</div>
          <div class="product-actions">
            <button class="btn-edit" onclick="editProduct(${product.id})">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn-delete" onclick="deleteProduct(${product.id}, '${product.image_url}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading products:', error);
    productsDiv.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Failed to load products</h3>
        <p>Please try again later</p>
      </div>
    `;
  }
}

/* =====================
   DELETE PRODUCT
===================== */
async function deleteProduct(id, imageUrl) {
  if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
    return;
  }

  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/product-images/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from('product-images').remove([filePath]);
    }

    // Delete from database
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    showToast('🗑️ Product deleted successfully!', 'success');
    
    // Refresh data
    await loadStats();
    await loadProducts();
    await loadRecentProducts();
  } catch (err) {
    console.error('Error deleting product:', err);
    showToast('Error deleting product: ' + err.message, 'error');
  }
}

/* =====================
   EDIT PRODUCT (Placeholder)
===================== */
function editProduct(id) {
  showToast('Edit feature coming soon!', 'info');
  // You can implement edit functionality here
}

/* =====================
   LOAD ORDERS
===================== */
async function loadOrders() {
  const ordersBody = document.getElementById('orders-list');
  ordersBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;"><span class="spinner"></span> Loading orders...</td></tr>';

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!orders || orders.length === 0) {
      ordersBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center;padding:40px;">
            <div class="empty-state" style="padding:0;">
              <i class="fas fa-shopping-cart"></i>
              <h3>No orders yet</h3>
              <p>Orders will appear here when customers make purchases</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    ordersBody.innerHTML = orders.map(order => `
      <tr>
        <td><strong>#${order.id}</strong></td>
        <td>
          <strong>${order.customer_name}</strong><br>
          <small>${order.email}</small>
        </td>
        <td><strong>₹${order.total}</strong></td>
        <td>
          <span class="order-status ${order.status === 'delivered' ? 'status-delivered' : 'status-pending'}">
            ${order.status}
          </span>
        </td>
        <td>${new Date(order.created_at).toLocaleDateString()}<br>
          <small>${new Date(order.created_at).toLocaleTimeString()}</small>
        </td>
        <td>
          <div class="action-buttons">
            ${order.status === 'pending' ? `
              <button class="btn-small btn-success" onclick="markDelivered(${order.id})">
                <i class="fas fa-check"></i> Deliver
              </button>
            ` : `
              <button class="btn-small btn-warning" onclick="markPending(${order.id})">
                <i class="fas fa-clock"></i> Pending
              </button>
            `}
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading orders:', error);
    ordersBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:20px;color:#ef4444;">
          Failed to load orders. Please try again.
        </td>
      </tr>
    `;
  }
}

/* =====================
   UPDATE ORDER STATUS
===================== */
async function markDelivered(id) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'delivered',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    showToast('✅ Order marked as delivered!', 'success');
    await loadOrders();
    await loadRecentOrders();
  } catch (err) {
    console.error('Error updating order:', err);
    showToast('Error: ' + err.message, 'error');
  }
}

async function markPending(id) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    showToast('⚠️ Order marked as pending!', 'info');
    await loadOrders();
    await loadRecentOrders();
  } catch (err) {
    console.error('Error updating order:', err);
    showToast('Error: ' + err.message, 'error');
  }
}

/* =====================
   REFRESH ORDERS
===================== */
function refreshOrders() {
  showToast('Refreshing orders...', 'info');
  loadOrders();
}

/* =====================
   LOGOUT
===================== */
async function logout() {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem('admin_session');
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
      window.location.href = 'admin-login.html';
    }, 1000);
  } catch (err) {
    console.error('Logout error:', err);
    window.location.href = 'admin-login.html';
  }
}

/* =====================
   TOAST NOTIFICATION
===================== */
function showToast(message, type = 'info') {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => toast.remove());

  // Create new toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    <span style="margin-left:10px;">${message}</span>
  `;

  document.body.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
}

/* =====================
   INITIALIZATION
===================== */
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) return;

  // Initialize dashboard
  await initializeDashboard();

  // Expose functions to global scope
  window.showDashboard = showDashboard;
  window.showProducts = showProducts;
  window.showAddProduct = showAddProduct;
  window.showOrders = showOrders;
  window.addProduct = addProduct;
  window.deleteProduct = deleteProduct;
  window.editProduct = editProduct;
  window.markDelivered = markDelivered;
  window.markPending = markPending;
  window.refreshOrders = refreshOrders;
  window.logout = logout;

  // Start on dashboard
  showDashboard();
});
