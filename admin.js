// Mock Initial Products Data
let products = [
    { id: 1, name: "The Crimson Chai Saree", category: "Saree", price: 14500, stock: 12, status: "Active", img: "crimson_saree.png" },
    { id: 2, name: "Turmeric Silk Tunic", category: "Tunic", price: 8200, stock: 4, status: "Low Stock", img: "turmeric_tunic.png" },
    { id: 3, name: "Clove Structured Overlay", category: "Dress", price: 12800, stock: 24, status: "Active", img: "clove_overlay.png" }
];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Load products from localStorage if they exist
    const storedProducts = localStorage.getItem('surtika_admin_products');
    if (storedProducts) {
        products = JSON.parse(storedProducts);
    } else {
        // Save initial to localStorage
        saveProducts();
    }
    
    renderProductsTable();
});

// Sidebar Mobile Toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('mobile-open');
}

// Tab Switching Logic
function switchTab(tabId) {
    // Update nav links
    document.querySelectorAll('.nav-item').forEach(item => {
        if(item.getAttribute('onclick') && item.getAttribute('onclick').includes('switchTab')) {
            item.classList.remove('active');
        }
    });
    
    event.currentTarget.classList.add('active');

    // Update views
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.getElementById(tabId + '-view').classList.add('active');
    
    // Close sidebar on mobile after clicking
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('mobile-open');
    }
}

// Modal Logic
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    // Reset form if applicable
    const form = document.querySelector(`#${modalId} form`);
    if(form) form.reset();
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// Product Management Logic
function saveProducts() {
    localStorage.setItem('surtika_admin_products', JSON.stringify(products));
}

function renderProductsTable() {
    const tbody = document.querySelector('#products-table tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    
    products.forEach((product, index) => {
        let statusBadge = '';
        if (product.status === 'Active') {
            statusBadge = `<span class="status-badge status-completed">Active</span>`;
        } else if (product.status === 'Low Stock') {
            statusBadge = `<span class="status-badge status-pending">Low Stock</span>`;
        } else {
            statusBadge = `<span class="status-badge status-cancelled">${product.status}</span>`;
        }
        
        // Provide fallback image if no img exists
        const imgSrc = product.img ? `assets/${product.img}` : 'https://via.placeholder.com/40';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="product-cell">
                    <img src="${imgSrc}" class="product-thumb" alt="${product.name}">
                    <span class="font-medium">${product.name}</span>
                </div>
            </td>
            <td>${product.category}</td>
            <td class="font-medium">₹${product.price.toLocaleString('en-IN')}</td>
            <td>${product.stock}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="icon-btn" onclick="deleteProduct(${index})" style="color: var(--admin-danger);">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function handleAddProduct(event) {
    event.preventDefault();
    
    const name = document.getElementById('p-name').value;
    const price = parseFloat(document.getElementById('p-price').value);
    const stock = parseInt(document.getElementById('p-stock').value);
    const category = document.getElementById('p-category').value;
    
    let status = 'Active';
    if (stock <= 5 && stock > 0) status = 'Low Stock';
    if (stock === 0) status = 'Out of Stock';

    const newProduct = {
        id: Date.now(),
        name,
        price,
        stock,
        category,
        status,
        img: null // using placeholder
    };
    
    // Add to front of array
    products.unshift(newProduct);
    saveProducts();
    renderProductsTable();
    closeModal('addProductModal');
    
    alert('Product added successfully!');
}

function deleteProduct(index) {
    if(confirm('Are you sure you want to delete this product?')) {
        products.splice(index, 1);
        saveProducts();
        renderProductsTable();
    }
}
