// ============================================================
//  admin.js  —  Surtika Dashboard
//  All product, order, and customer data synced to Firestore.
// ============================================================

import { auth, db } from './firebase-modular.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── Utils ────────────────────────────────────────────────────
function fixImageUrl(url) {
    if (!url) return 'https://placehold.co/40x40/1a1a2e/ffffff?text=P';
    let fixedUrl = url.trim();
    
    // Dropbox Fix
    if (fixedUrl.includes('dropbox.com')) {
        fixedUrl = fixedUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
        fixedUrl = fixedUrl.split('?')[0];
    }
    return fixedUrl;
}

// ── State ────────────────────────────────────────────────────
let allProducts = [];
let allOrders = [];
let editingProductId = null;

// ── Auth Check ───────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = 'login.html';
  } else {
    // Only allow specific admin emails if needed
    // if(user.email !== 'admin@surtika.com') window.location.href = 'index.html';
    
    // Initialize Dashboard
    loadProductsFromFirestore();
    loadOrdersFromFirestore();
  }
});

// ── Firestore: Load Products ─────────────────────────────────
function loadProductsFromFirestore() {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  onSnapshot(q, (snapshot) => {
    allProducts = [];
    snapshot.forEach((docSnap) => {
      allProducts.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderProductsTable();
    updateDashboardStats();
  });
}

// ── Render Products Table ────────────────────────────────────
function renderProductsTable(filteredProducts = null) {
  const tbody = document.querySelector('#products-table tbody');
  if (!tbody) return;

  const productsToRender = filteredProducts || allProducts;

  if (productsToRender.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--admin-text-muted);">No products found.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  productsToRender.forEach((product) => {
    const stock = product.stock ?? 0;
    let statusBadge = `<span class="status-badge status-completed">Active</span>`;
    if (stock === 0) statusBadge = `<span class="status-badge status-cancelled">Out of Stock</span>`;
    else if (stock <= 5) statusBadge = `<span class="status-badge status-pending">Low Stock</span>`;

    let imgSrc = 'https://placehold.co/40x40/1a1a2e/ffffff?text=P';
    const variants = product.variants || [];
    if (product.image) {
      imgSrc = fixImageUrl(product.image);
    } else if (variants.length > 0 && variants[0].images && variants[0].images[0]) {
      imgSrc = fixImageUrl(variants[0].images[0]);
    }

    const colorTags = variants.length > 0
      ? variants.map(v => `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${v.colorHex||'#ccc'};border:1px solid rgba(0,0,0,0.2);margin-right:2px;" title="${v.colorName||''}"></span>`).join('')
      : '—';

    const sizeTags = (product.sizes || []).join(', ') || '—';
    const mrp = product.mrp ? `<span style="text-decoration:line-through;color:var(--admin-text-muted);font-size:11px;">₹${Number(product.mrp).toLocaleString('en-IN')}</span><br>` : '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="product-cell">
          <img src="${imgSrc}" class="product-thumb" alt="${product.name}" onerror="this.src='https://placehold.co/40x40/1a1a2e/ffffff?text=P'">
          <div>
            <span class="font-medium">${product.name}</span>
            <div class="text-xs text-muted">SKU: ${product.sku || '—'}</div>
          </div>
        </div>
      </td>
      <td>${product.category || '—'}</td>
      <td>${mrp}<span class="font-medium">₹${Number(product.price || 0).toLocaleString('en-IN')}</span></td>
      <td>${colorTags}</td>
      <td class="text-xs">${sizeTags}</td>
      <td>${stock}</td>
      <td>${statusBadge}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="icon-btn" onclick="openEditProduct('${product.id}')" title="Edit" style="color:var(--admin-primary);">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button class="icon-btn" onclick="deleteProduct('${product.id}')" title="Delete" style="color:#ef4444;">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Firestore: Load Orders ───────────────────────────────────
function loadOrdersFromFirestore() {
  const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
  onSnapshot(q, (snapshot) => {
    allOrders = [];
    snapshot.forEach((docSnap) => {
      allOrders.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderOrdersTable();
    renderCustomersTable();
    updateDashboardStats();
  });
}

// ── Render Orders Table ──────────────────────────────────────
function renderOrdersTable(filteredOrders = null) {
  const tbody = document.querySelector('#orders-table tbody');
  if (!tbody) return;

  const ordersToRender = filteredOrders || allOrders;

  if (ordersToRender.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--admin-text-muted);">No orders found.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  ordersToRender.forEach(data => {
    const id = data.orderNumber || '#ORD-' + data.id.substring(0, 8).toUpperCase();
    const date = data.timestamp ? data.timestamp.toDate().toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'}) : 'Just now';
    const payment = (data.paymentMethod || 'N/A').toUpperCase();
    const itemsList = (data.items || []).map(item => `${item.quantity}x ${item.name}`).join(', ');
    
    let statusColor = '#f59e0b';
    if(data.status === 'Processing') statusColor = '#3b82f6';
    if(data.status === 'Shipped') statusColor = '#10b981';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="font-medium">${id}</td>
      <td>
        <div class="font-medium">${data.shippingDetails?.name || 'Guest'}</div>
        <div class="text-xs text-muted">${data.shippingDetails?.phone || ''}</div>
        <div class="text-xs text-muted" style="max-width:200px;">${data.shippingDetails?.address || ''}, ${data.shippingDetails?.city || ''}</div>
      </td>
      <td class="text-muted">${date}</td>
      <td>${payment}</td>
      <td class="font-medium">₹${(data.total || 0).toLocaleString('en-IN')}</td>
      <td>
        <select onchange="updateOrderStatus('${data.id}', this)" style="padding: 4px 8px; border-radius: 4px; border: 1px solid ${statusColor}; color: ${statusColor}; background: transparent; font-size: 12px; font-weight: 600; cursor: pointer;">
          <option value="Confirmed" ${data.status === 'Confirmed' ? 'selected' : ''}>Pending</option>
          <option value="Processing" ${data.status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="Shipped" ${data.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
        </select>
      </td>
      <td class="text-xs" title="${itemsList}">${itemsList.substring(0, 30)}${itemsList.length > 30 ? '...' : ''}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ── Render Customers Table ───────────────────────────────────
function renderCustomersTable() {
  const tbody = document.getElementById('customers-tbody');
  if (!tbody) return;

  const customersMap = {};
  allOrders.forEach(order => {
    const details = order.shippingDetails || {};
    let identifier = order.userId || details.phone || details.name || 'Guest';
    
    if (!customersMap[identifier]) {
      customersMap[identifier] = {
        name: details.name || 'Guest User',
        email: order.userId && order.userId !== 'guest' ? 'Registered' : 'Guest',
        location: details.city || 'N/A',
        orders: 0,
        spent: 0
      };
    }
    customersMap[identifier].orders++;
    customersMap[identifier].spent += (order.total || 0);
  });

  const list = Object.values(customersMap).sort((a,b) => b.spent - a.spent);
  tbody.innerHTML = '';
  list.forEach(c => {
    const initials = c.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
    tbody.innerHTML += `
      <tr>
        <td>
          <div class="product-cell">
            <div style="width:32px;height:32px;border-radius:50%;background:#e8f0fe;color:#1a73e8;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;">${initials}</div>
            <span class="font-medium">${c.name}</span>
          </div>
        </td>
        <td class="text-muted">${c.email}</td>
        <td>${c.location}</td>
        <td>${c.orders}</td>
        <td class="font-medium">₹${c.spent.toLocaleString('en-IN')}</td>
        <td><span class="status-badge ${c.email === 'Guest' ? 'status-pending' : 'status-completed'}">${c.email}</span></td>
      </tr>
    `;
  });
}

// ── Update Dashboard Stats ───────────────────────────────────
function updateDashboardStats() {
  const totalSales = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const activeProducts = allProducts.filter(p => p.stock > 0).length;
  
  const salesEl = document.querySelector('.stat-card:nth-child(1) .stat-value');
  const ordersEl = document.querySelector('.stat-card:nth-child(2) .stat-value');
  const productsEl = document.querySelector('.stat-card:nth-child(3) .stat-value');
  
  if (salesEl) salesEl.textContent = '₹' + totalSales.toLocaleString('en-IN');
  if (ordersEl) ordersEl.textContent = allOrders.length;
  if (productsEl) productsEl.textContent = activeProducts;
}

// ── Render Sales Chart ──────────────────────────────────────
function renderSalesChart() {
  const ctx = document.getElementById('salesChart');
  if (!ctx || typeof Chart === 'undefined') return;

  // Group by last 7 days
  const labels = [];
  const data = [];
  for(let i=6; i>=0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString('en-IN', {day:'numeric', month:'short'});
    labels.push(dayStr);
    
    const dayTotal = allOrders.filter(o => {
        if(!o.timestamp) return false;
        const od = o.timestamp.toDate();
        return od.toDateString() === d.toDateString();
    }).reduce((sum, o) => sum + (o.total || 0), 0);
    data.push(dayTotal);
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Daily Sales (₹)',
        data: data,
        borderColor: '#1a73e8',
        backgroundColor: 'rgba(26,115,232,0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { borderDash: [2, 2] } },
        x: { grid: { display: false } }
      }
    }
  });
}

// ── CRUD: Order Status ──────────────────────────────────────
window.updateOrderStatus = async (orderId, select) => {
    try {
        await updateDoc(doc(db, 'orders', orderId), {
            status: select.value
        });
        // Success feedback if needed
    } catch (err) {
        alert('Update failed: ' + err.message);
    }
};

// ── CRUD: Product Management ─────────────────────────────────
window.openAddProduct = () => {
    editingProductId = null;
    document.getElementById('modal-title').textContent = 'Add New Product';
    document.getElementById('product-form').reset();
    document.getElementById('variant-container').innerHTML = '';
    document.getElementById('product-modal').style.display = 'flex';
};

window.openEditProduct = (productId) => {
  editingProductId = productId;
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  document.getElementById('modal-title').textContent = 'Edit Product';
  document.getElementById('prod-name').value = product.name || '';
  document.getElementById('prod-category').value = product.category || '';
  document.getElementById('prod-price').value = product.price || '';
  document.getElementById('prod-mrp').value = product.mrp || '';
  document.getElementById('prod-stock').value = product.stock || '';
  document.getElementById('prod-collection').value = product.collection || '';
  document.getElementById('prod-sku').value = product.sku || '';
  document.getElementById('prod-desc').value = product.description || '';
  document.getElementById('prod-image').value = product.image || '';
  document.getElementById('prod-size-chart').value = product.sizeChartImage || '';

  const variantContainer = document.getElementById('variant-container');
  variantContainer.innerHTML = '';
  (product.variants || []).forEach(v => {
    addVariantRow(v);
  });

  document.getElementById('product-modal').style.display = 'flex';
};

window.closeProductModal = () => {
  document.getElementById('product-modal').style.display = 'none';
};

window.addVariantRow = (data = {}) => {
  const div = document.createElement('div');
  div.className = 'variant-row';
  div.innerHTML = `
    <input type="text" placeholder="Color Name (e.g. Ruby Red)" value="${data.colorName || ''}" class="v-name">
    <input type="color" value="${data.colorHex || '#000000'}" class="v-hex">
    <input type="text" placeholder="Image URLs (comma separated)" value="${(data.images || []).join(',')}" class="v-imgs">
    <button type="button" class="icon-btn" style="color:#ef4444;" onclick="this.parentElement.remove()">×</button>
  `;
  document.getElementById('variant-container').appendChild(div);
};

document.getElementById('product-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const variants = [];
  document.querySelectorAll('.variant-row').forEach(row => {
    const images = row.querySelector('.v-imgs').value.split(',').map(s => s.trim()).filter(s => s !== '');
    variants.push({
      colorName: row.querySelector('.v-name').value,
      colorHex: row.querySelector('.v-hex').value,
      images: images
    });
  });

  const productData = {
    name: document.getElementById('prod-name').value,
    category: document.getElementById('prod-category').value,
    price: Number(document.getElementById('prod-price').value),
    mrp: Number(document.getElementById('prod-mrp').value),
    stock: Number(document.getElementById('prod-stock').value),
    collection: document.getElementById('prod-collection').value,
    sku: document.getElementById('prod-sku').value,
    description: document.getElementById('prod-desc').value,
    image: document.getElementById('prod-image').value,
    sizeChartImage: document.getElementById('prod-size-chart').value,
    variants: variants,
    sizes: ['XS', 'S', 'M', 'L', 'XL'], // Default sizes for simplicity
    updatedAt: serverTimestamp()
  };

  try {
    if (editingProductId) {
      await updateDoc(doc(db, 'products', editingProductId), productData);
    } else {
      productData.createdAt = serverTimestamp();
      await addDoc(collection(db, 'products'), productData);
    }
    closeProductModal();
  } catch (err) {
    alert('Error saving product: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Product';
  }
});

window.deleteProduct = async (productId) => {
  if (!confirm('Are you sure you want to delete this product?')) return;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    alert('Delete failed: ' + err.message);
  }
};

// ── Search & Filter ──────────────────────────────────────────
window.handleSearch = (query) => {
    const q = query.toLowerCase();
    const filtered = allProducts.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
    renderProductsTable(filtered);
};

// ── Tab Switching ────────────────────────────────────────────
window.switchTab = (tabId, btn) => {
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  btn.classList.add('active');
};
