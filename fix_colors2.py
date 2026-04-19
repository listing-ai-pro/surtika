import re
import os

files = ['index.html', 'shop.html', 'product.html', 'checkout.html']

for file in files:
    if not os.path.exists(file): continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # We will search for the specific order.status line and replace it
    pattern = r"<span style=\"font-size:0\.8rem;background:#2ecc71;color:#003919;padding:2px 8px;border-radius:4px;font-weight:600;\">\$\{order\.status \|\| 'Confirmed'\}</span>"
    
    # Replacement block that will evaluate the status string
    # Since this is inside a template literal, we can do `${(() => { ... })()}`
    replacement = """${(() => {
                                let st = order.status || 'Confirmed';
                                let bg = '#2ecc71';
                                let co = '#003919';
                                if (st === 'Confirmed') { bg = '#f59e0b'; co = '#4d3200'; st = 'Pending'; }
                                else if (st === 'Processing') { bg = '#3b82f6'; co = '#00253f'; }
                                return `<span style="font-size:0.8rem;background:${bg};color:${co};padding:2px 8px;border-radius:4px;font-weight:600;">${st}</span>`;
                            })()}"""
                            
    content = re.sub(pattern, replacement, content)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
print("done")
