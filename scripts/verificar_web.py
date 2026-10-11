#!/usr/bin/env python3
"""Comprueba archivos locales y catálogo sin cambiar la web. Requiere Python y Node."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import collections
import json
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
        self.ids = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag in ('img', 'script') and attrs.get('src'):
            self.refs.append(attrs['src'])
        if tag == 'link' and attrs.get('href'):
            self.refs.append(attrs['href'])
        if tag == 'a' and attrs.get('href'):
            self.refs.append(attrs['href'])


def local_target(page, ref):
    url = urlsplit(ref)
    if url.scheme or url.netloc or not url.path:
        return None
    return (ROOT if url.path.startswith('/') else page.parent) / unquote(url.path.lstrip('/'))


def main():
    errors = []
    pages = list(ROOT.glob('*.html')) + list((ROOT / 'articles').glob('*.html'))
    scripts_checked = 0
    references = 0
    for page in pages:
        source = page.read_text(encoding='utf-8')
        parsed = Page()
        parsed.feed(source)
        for item, n in collections.Counter(parsed.ids).items():
            if n > 1:
                errors.append(f'{page.relative_to(ROOT)}: id duplicado {item}')
        for ref in parsed.refs:
            target = local_target(page, ref)
            if target is not None:
                references += 1
                if not target.is_file():
                    errors.append(f'{page.relative_to(ROOT)}: archivo ausente {ref}')
        for script in re.findall(r'<script\b([^>]*)>(.*?)</script>', source, re.S):
            attrs, code = script
            if not code.strip() or re.search(r'type=[\"\']application/', attrs):
                continue
            with tempfile.TemporaryDirectory() as tmp:
                path = Path(tmp) / 'script.js'
                path.write_text(code, encoding='utf-8')
                result = subprocess.run(['node', '--check', str(path)], capture_output=True, text=True)
            scripts_checked += 1
            if result.returncode:
                errors.append(f'{page.relative_to(ROOT)}: JavaScript inválido\n{result.stderr}')

    for path in list((ROOT / 'data').glob('*.js')):
        result = subprocess.run(['node', '--check', str(path)], capture_output=True, text=True)
        scripts_checked += 1
        if result.returncode:
            errors.append(f'{path.relative_to(ROOT)}: JavaScript inválido\n{result.stderr}')

    home = (ROOT / 'index.html').read_text(encoding='utf-8')
    catalog_path = ROOT / 'data/productos.js'
    catalog = catalog_path.read_text(encoding='utf-8') if catalog_path.is_file() else ''
    match = re.search(r'const productsDB\s*=\s*(\[.*?\]);', catalog, re.S)
    if 'const productsDB' in home:
        errors.append('El catálogo sigue duplicado dentro de index.html')
    catalog_tag = '<script src="data/productos.js"></script>'
    if catalog_tag not in home or home.index(catalog_tag) > home.index('    let cart = []'):
        errors.append('Cargar data/productos.js antes del código de la tienda')
    if not match:
        errors.append('No se encontró productsDB en data/productos.js.')
        products = []
    else:
        # Ejecuta únicamente la declaración del catálogo del repositorio, sin APIs del navegador.
        code = 'const productsDB = ' + match[1] + '; console.log(JSON.stringify(productsDB));'
        result = subprocess.run(['node', '-e', code], capture_output=True, text=True, check=True)
        products = json.loads(result.stdout)
    ids = []
    tabs = set(re.findall(r'data-category="([^\"]+)"', home))
    for p in products:
        ids.append(p.get('id'))
        for field in ('id', 'category', 'name', 'image', 'price'):
            if not p.get(field):
                errors.append(f"{p.get('id')}: falta {field}")
        if p.get('category') not in tabs:
            errors.append(f"{p.get('id')}: categoría sin filtro")
        if not (ROOT / p.get('image', '')).is_file():
            errors.append(f"{p.get('id')}: imagen ausente")
        if not p.get('variants'):
            errors.append(f"{p.get('id')}: faltan variantes")
        if 'priceNum' in p and (not isinstance(p['priceNum'], (int, float)) or p['priceNum'] < 0):
            errors.append(f"{p.get('id')}: precio numérico inválido")
    if len(ids) != len(set(ids)):
        errors.append('Hay identificadores de productos duplicados')
    slides = len(re.findall(r'class="hero-slide(?:\s|\")', home))
    dots = len(re.findall(r'data-dot-index=', home))
    if slides != dots or not slides:
        errors.append(f'Hero: {slides} slides y {dots} indicadores; revisar selectores')
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'OK: {len(pages)} páginas, {references} referencias locales, {scripts_checked} scripts válidos.')
    print(f'OK: {len(products)} productos, {len(set(p["category"] for p in products))} categorías, {slides} slides.')
    print('Esta revisión no sustituye la prueba interactiva en navegador.')


if __name__ == '__main__':
    main()
