// shop.js - relies on global 'db' from firebase-config.js

const productGrid = document.querySelector('.product-grid');
const showingText = document.querySelector('.text-sm.color-muted'); // Updated selector
let currentUnsubscribe = null;
let allLoadedProducts = [];

function fixImageUrl(url) {
    if (!url) return 'assets/placeholder.png';
    let fixedUrl = url.trim();
    
    // Dropbox Fix
    if (fixedUrl.includes('dropbox.com')) {
        // Replace domain to point to direct content
        fixedUrl = fixedUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
        
        // Preserve parameters but force raw=1 for direct rendering
        if (fixedUrl.includes('?')) {
            // Replace dl=0 or dl=1 with raw=1
            fixedUrl = fixedUrl.replace('dl=0', 'raw=1').replace('dl=1', 'raw=1');
            // If raw=1 is not there at all, add it
            if (!fixedUrl.includes('raw=1')) {
                fixedUrl += '&raw=1';
            }
        } else {
            fixedUrl += '?raw=1';
        }
    }
    
    return fixedUrl;
}

function renderProduct(product) {
    const card = document.createElement('div');
    card.className = 'product-card reveal';
    
    // Priority: Explicit Main Image > First Variant Image > Placeholder
    let rawImage = product.image || 
                  (product.variants && product.variants[0] && product.variants[0].images && product.variants[0].images[0] 
                   ? product.variants[0].images[0] : 'assets/placeholder.png');
    
    const image = fixImageUrl(rawImage);

    card.innerHTML = `
        <a href="product.html?id=${product.id}" class="product-img-wrap">
            <img src="${image}" alt="${product.name}">
        </a>
        <div class="product-info">
            <div>
                <h3 class="product-title">${product.name}</h3>
                <span class="product-price">₹${(product.price || 0).toLocaleString('en-IN')}</span>
            </div>
            <div class="btn-3d-container" style="width: 120px; height: 40px; margin-top: 10px;">
                <button class="btn-3d" onclick="handleAddToBag3D(this, { id: '${product.id}', name: '${(product.name || "").replace(/'/g, "\\'")}', price: ${product.price || 0}, image: '${image}' })">
                    <div class="btn-3d-front btn btn-primary" style="font-size: 0.75rem; padding: 0; display: flex; align-items: center; justify-content: center;">Add to Bag</div>
                    <div class="btn-3d-back" style="font-size: 0.75rem; display: flex; align-items: center; justify-content: center;">Added ✓</div>
                </button>
            </div>
        </div>
    `;
    return card;
}

function loadProducts(category = 'All', collectionName = 'All') {
    if (currentUnsubscribe) currentUnsubscribe();
    
    if (productGrid) productGrid.innerHTML = '<div class="loading-shimmer" style="grid-column: 1/-1;"></div>';
    
    let q = db.collection('products').orderBy('createdAt', 'desc');
    
    if (category !== 'All') {
        q = q.where('category', '==', category);
    }
    if (collectionName !== 'All') {
        q = q.where('collection', '==', collectionName);
    }

    currentUnsubscribe = q.onSnapshot((snapshot) => {
        allLoadedProducts = [];
        if (productGrid) productGrid.innerHTML = '';
        
        if (snapshot.empty) {
            if (productGrid) productGrid.innerHTML = '<p class="color-muted" style="grid-column: 1/-1; text-align: center; padding: 40px;">No products found.</p>';
            if (showingText) showingText.textContent = 'Showing 0 products';
            return;
        }

        snapshot.forEach((doc) => {
            const product = { id: doc.id, ...doc.data() };
            allLoadedProducts.push(product);
            if (productGrid) productGrid.appendChild(renderProduct(product));
        });

        if (showingText) showingText.textContent = `Showing ${allLoadedProducts.length} products`;
        
        // Re-init ScrollReveal for new elements
        if (window.ScrollReveal) {
            ScrollReveal().reveal('.product-card', {
                delay: 200,
                distance: '30px',
                origin: 'bottom',
                interval: 100
            });
        }
    }, (error) => {
        console.error("Firestore error:", error);
        if (productGrid) productGrid.innerHTML = '<p class="color-muted" style="grid-column: 1/-1; text-align: center; padding: 40px;">Error loading products.</p>';
    });
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category') || 'All';
    const collectionName = params.get('collection') || 'All';
    
    loadProducts(category, collectionName);

    // Category Filter Listeners
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            loadProducts(tag.textContent.trim(), 'All');
        });
    });

    // Collection Filter Listeners (if any in sidebar)
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const coll = link.textContent.trim();
            loadProducts('All', coll);
        });
    });
});
