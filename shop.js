// shop.js - relies on global 'db' from firebase-config.js

function fixImageUrl(url) {
    if (!url) return 'assets/placeholder.png';
    let fixedUrl = url.trim();
    
    // Dropbox Fix
    if (fixedUrl.includes('dropbox.com')) {
        // Replace domain
        fixedUrl = fixedUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
        // Remove trailing parameters like ?dl=0 or ?dl=1
        fixedUrl = fixedUrl.split('?')[0];
    }
    
    return fixedUrl;
}

function renderProduct(product) {
    const rawImg = (product.variants && product.variants[0] && product.variants[0].images && product.variants[0].images[0])
                   ? product.variants[0].images[0]
                   : (product.image || 'assets/placeholder.png');
    
    const image = fixImageUrl(rawImg);

    return `
        <div class="product-card reveal">
            <div class="btn-3d-container">
                <a href="product.html?id=${product.id}" class="product-img-wrap">
                    <img src="${image}" alt="${product.name}" onerror="this.src='assets/placeholder.png'">
                </a>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">₹${product.price}</p>
                    <button class="btn-3d" onclick="handleAddToBag3D(this, { 
                        id: '${product.id}', 
                        name: '${(product.name || "").replace(/'/g, "\\'")}', 
                        price: ${product.price || 0}, 
                        image: '${image}' 
                    })">
                        <div class="btn-front">Add to Bag</div>
                        <div class="btn-back">Added!</div>
                    </button>
                </div>
            </div>
        </div>
    `;
}

let currentUnsubscribe = null;

function loadProducts(filterType, filterValue) {
    const container = document.getElementById('shop-products-grid');
    const loadingEl = document.getElementById('shop-loading');
    
    if (currentUnsubscribe) {
        currentUnsubscribe();
    }

    if (container) container.innerHTML = '';
    if (loadingEl) loadingEl.style.display = 'block';

    let q = db.collection('products').orderBy('createdAt', 'desc');

    if (filterType === 'category') {
        q = q.where('category', '==', filterValue);
    } else if (filterType === 'collection') {
        q = q.where('collection', '==', filterValue);
    }

    currentUnsubscribe = q.onSnapshot((snapshot) => {
        if (loadingEl) loadingEl.style.display = 'none';
        if (container) {
            container.innerHTML = '';
            if (snapshot.empty) {
                container.innerHTML = '<div class="no-products">No products found for this selection.</div>';
                return;
            }
            snapshot.forEach((doc) => {
                const product = { id: doc.id, ...doc.data() };
                container.innerHTML += renderProduct(product);
            });

            // Trigger ScrollReveal for new items
            if (window.ScrollReveal) {
                ScrollReveal().reveal('.reveal', {
                    distance: '30px',
                    duration: 800,
                    interval: 100,
                    opacity: 0,
                    origin: 'bottom',
                    viewFactor: 0.2
                });
            }
        }
    }, (error) => {
        console.error("Error loading products:", error);
        if (loadingEl) loadingEl.style.display = 'none';
        if (container) container.innerHTML = '<div class="no-products">Error loading products. Please try again.</div>';
    });
}

// ── Search Logic ──────────────────────────────────────────────
function handleShopSearch(query) {
    if (!query) {
        loadProducts(); // Load all
        return;
    }
    const q = query.toLowerCase();
    // For simple client-side search since Firestore doesn't support partial match easily
    db.collection('products').get().then(snap => {
        const container = document.getElementById('shop-products-grid');
        container.innerHTML = '';
        let count = 0;
        snap.forEach(doc => {
            const p = doc.data();
            if (p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q))) {
                container.innerHTML += renderProduct({ id: doc.id, ...p });
                count++;
            }
        });
        if (count === 0) container.innerHTML = '<div class="no-products">No matches found.</div>';
    });
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const coll = params.get('collection');
    const cat  = params.get('category');
    
    if (coll) {
        loadProducts('collection', coll);
        // Update UI if there's a title
        const titleEl = document.getElementById('shop-title');
        if (titleEl) titleEl.textContent = coll;
    } else if (cat) {
        loadProducts('category', cat);
        const titleEl = document.getElementById('shop-title');
        if (titleEl) titleEl.textContent = cat;
    } else {
        loadProducts();
    }
});
