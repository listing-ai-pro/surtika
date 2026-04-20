// index_dynamic.js - For Home Page Collections (Compat Mode)
// This script relies on 'db' being defined globally by firebase-config.js

function fixImageUrl(url) {
    if (!url) return 'assets/placeholder.png';
    let fixedUrl = url.trim();
    
    // Dropbox Fix
    if (fixedUrl.includes('dropbox.com')) {
        fixedUrl = fixedUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
        if (fixedUrl.includes('?')) {
            fixedUrl = fixedUrl.replace('dl=0', 'raw=1').replace('dl=1', 'raw=1');
            if (!fixedUrl.includes('raw=1')) {
                fixedUrl += '&raw=1';
            }
        } else {
            fixedUrl += '?raw=1';
        }
    }
    return fixedUrl;
}

async function loadCollectionProducts(collectionName, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        // Using Compat SDK (v8 style) to match firebase-config.js
        const snapshot = await db.collection('products')
            .where('collection', '==', collectionName)
            .orderBy('createdAt', 'desc')
            .limit(4)
            .get();

        container.innerHTML = '';
        
        if (snapshot.empty) {
            container.innerHTML = '<p style="color:white; opacity:0.6;">No products found in this collection.</p>';
            return;
        }

        snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            const rawImg = (product.variants && product.variants[0] && product.variants[0].images && product.variants[0].images[0])
                           ? product.variants[0].images[0]
                           : (product.image || 'assets/placeholder.png');
            
            const productImg = fixImageUrl(rawImg);

            const card = document.createElement('div');
            card.className = 'product-card reveal';
            card.innerHTML = `
                <a href="product.html?id=${product.id}" class="product-img-wrap">
                    <img src="${productImg}" alt="${product.name}" onerror="this.src='assets/placeholder.png'">
                </a>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">₹${product.price}</p>
                    <button class="btn-3d" onclick="handleAddToBag3D(this, { 
                        id: '${product.id}', 
                        name: '${product.name.replace(/'/g, "\\'")}', 
                        price: ${product.price}, 
                        image: '${productImg}' 
                    })">
                        <div class="btn-3d-front btn btn-primary" style="font-size:0.75rem; padding:8px 16px;">Add to Bag</div>
                        <div class="btn-3d-back" style="font-size:0.75rem;">Added!</div>
                    </button>
                </div>
            `;
            container.appendChild(card);
        });

        // Trigger ScrollReveal if it exists
        if (window.ScrollReveal) {
            ScrollReveal().reveal('.product-card', {
                interval: 100,
                distance: '20px',
                origin: 'bottom',
                opacity: 0,
                delay: 300
            });
        }

    } catch (error) {
        console.error(`Error loading collection ${collectionName}:`, error);
        container.innerHTML = '<p style="color:white; opacity:0.6;">Unable to load products.</p>';
    }
}

// Initial execution
document.addEventListener('DOMContentLoaded', () => {
    loadCollectionProducts('Mera Tops', 'collection-mera-container');
    loadCollectionProducts('Best Sellers', 'collection-bestsellers-container');
});
