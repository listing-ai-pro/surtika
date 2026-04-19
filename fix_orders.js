const fs = require('fs');
const files = ['index.html', 'shop.html', 'product.html', 'checkout.html'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // Add onSnapshot to import
    content = content.replace(/import \{.*\} from 'https:\/\/www.gstatic.com\/firebasejs\/10.12.0\/firebase-firestore.js';/g, (match) => {
        if (!match.includes('onSnapshot')) {
            return match.replace(/import \{/, 'import { onSnapshot,');
        }
        return match;
    });

    // Replace the openOrderHistory block
    const oldBlockRegex = /\/\/ ── My Orders ───────────────────────────────────────────────[\s\S]*?window\.openOrderHistory = async \(\) => \{[\s\S]*?list\.innerHTML = '<p style="color:#ff6b6b;text-align:center;">Error loading orders\.<\/p>';\s*\}\s*\};/g;
    
    const newBlock = `// ── My Orders ───────────────────────────────────────────────
let orderHistoryUnsub = null;
window.openOrderHistory = () => {
    document.getElementById('profile-dropdown').style.display = 'none';
    const overlay = document.getElementById('orders-overlay');
    if(overlay) overlay.style.display = 'block';
    const modal = document.getElementById('orders-modal');
    if(modal) modal.style.display = 'flex';
    
    const list = document.getElementById('orders-list');
    if(!list) return;
    list.innerHTML = '<p style="color:#8b949e;text-align:center;">Loading orders...</p>';
    
    if (!currentUser) {
        list.innerHTML = '<p style="color:#ff6b6b;text-align:center;">Please login to view orders.</p>';
        return;
    }

    if (orderHistoryUnsub) orderHistoryUnsub();

    try {
        const q = query(collection(db, 'orders'), where('userId', '==', currentUser.uid));
        orderHistoryUnsub = onSnapshot(q, (snap) => {
            if (snap.empty) {
                list.innerHTML = '<p style="color:#8b949e;text-align:center;">No orders found yet.</p>';
                return;
            }

            let orders = [];
            snap.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
            orders.sort((a, b) => {
                const ta = a.timestamp ? a.timestamp.seconds : 0;
                const tb = b.timestamp ? b.timestamp.seconds : 0;
                return tb - ta;
            });

            let html = '';
            orders.forEach(order => {
                const date = order.timestamp ? new Date(order.timestamp.seconds * 1000).toLocaleDateString() : 'N/A';
                const idDisplay = order.orderNumber ? order.orderNumber : order.id.substring(0,8).toUpperCase();
                html += \`
                    <div style="background:#21262d;border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:15px;margin-bottom:15px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                            <span style="font-size:0.8rem;color:#8b949e;">ID: \${idDisplay}</span>
                            <span style="font-size:0.8rem;background:#2ecc71;color:#003919;padding:2px 8px;border-radius:4px;font-weight:600;">\${order.status || 'Confirmed'}</span>
                        </div>
                        <div style="color:#e6edf3;font-weight:600;margin-bottom:8px;">\${date} — Total: ₹\${order.total}</div>
                        <div style="font-size:0.85rem;color:#8b949e;">
                            \${order.items.map(item => \`\${item.name} (x\${item.quantity})\`).join(', ')}
                        </div>
                    </div>
                \`;
            });
            list.innerHTML = html;
        }, (err) => {
            console.error('Error fetching orders:', err);
            list.innerHTML = '<p style="color:#ff6b6b;text-align:center;">Error loading orders.</p>';
        });
    } catch (err) {
        console.error('Error setting up listener:', err);
        list.innerHTML = '<p style="color:#ff6b6b;text-align:center;">Error loading orders.</p>';
    }
};`;

    content = content.replace(oldBlockRegex, newBlock);
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
});
