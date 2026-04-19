import os

files = ['index.html', 'shop.html', 'product.html', 'checkout.html', 'admin.html']
link_tag = '    <link rel="stylesheet" href="cssanimation.min.css">\n'

for file in files:
    if not os.path.exists(file): continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'cssanimation.min.css' not in content:
        content = content.replace('</head>', link_tag + '</head>')
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Added to", file)
