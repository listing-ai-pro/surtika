import re
import os

files = {
    'index.html': {
        'title': 'Surtika | Premium Modern Indian Fashion & Designer Wear',
        'desc': 'Discover Surtika, your ultimate destination for premium modern Indian fashion. Shop exclusive designer sarees, elegant tunics, and luxurious ethnic wear.',
        'keywords': 'Indian fashion, designer sarees, modern ethnic wear, premium kurtis, Surtika fashion, luxury Indian clothing'
    },
    'shop.html': {
        'title': 'Shop All Collections | Surtika Indian Fashion',
        'desc': 'Browse the complete Surtika collection. Find authentic Indian textiles, hand-crafted designer wear, and contemporary traditional clothing.',
        'keywords': 'shop Indian wear, buy sarees online, ethnic fashion store, designer tunics, traditional dresses'
    },
    'product.html': {
        'title': 'Exclusive Designer Wear | Surtika',
        'desc': 'Elevate your wardrobe with our exclusive designer pieces. Handcrafted with premium fabrics and traditional techniques for the modern woman.',
        'keywords': 'designer clothes, premium fabric, handloom fashion, exclusive ethnic wear'
    },
    'checkout.html': {
        'title': 'Secure Checkout | Surtika',
        'desc': 'Complete your purchase securely at Surtika. Fast shipping and premium packaging for your luxury fashion items.',
        'keywords': 'checkout, secure payment, buy clothes online'
    }
}

for file, seo in files.items():
    if not os.path.exists(file): continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove existing basic SEO tags to avoid duplicates
    content = re.sub(r'<title>.*?</title>', '', content, flags=re.IGNORECASE)
    content = re.sub(r'<meta name="description".*?>', '', content, flags=re.IGNORECASE)
    content = re.sub(r'<meta name="keywords".*?>', '', content, flags=re.IGNORECASE)
    content = re.sub(r'<meta property="og:.*?>', '', content, flags=re.IGNORECASE)

    # Prepare robust SEO block
    seo_block = f"""
    <title>{seo['title']}</title>
    <meta name="description" content="{seo['desc']}">
    <meta name="keywords" content="{seo['keywords']}">
    <meta property="og:title" content="{seo['title']}">
    <meta property="og:description" content="{seo['desc']}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Surtika">
    """
    
    # Inject after <head> or <meta name="viewport">
    content = re.sub(r'(<meta name="viewport" content="[^"]*">)', r'\1' + seo_block, content, count=1)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
print("SEO Applied")
