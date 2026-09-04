import { useState } from 'react';
import { useCart } from '../lib/cart';
import './Shop.css';

interface Product {
  id: string;
  type: 'shirt' | 'print';
  name: string;
  price: number;
  image: string;
  altImage?: string;
}

interface Drop {
  slug: string;
  collection: string;
  place: string;
  year: string;
  products: Product[];
}

const DROPS: Drop[] = [
  {
    slug: 'sutton-farm',
    collection: 'Sutton Farm',
    place: 'Kelly, Kentucky',
    year: '1955',
    products: [
      {
        id: 'sutton-farm-shirt',
        type: 'shirt',
        name: 'Sutton Farm Tee',
        price: 34,
        image: '/shop/sutton-farm/back.png',
        altImage: '/shop/sutton-farm/front.png',
      },
      {
        id: 'sutton-farm-print',
        type: 'print',
        name: 'Sutton Farm Print',
        price: 28,
        image: '/shop/sutton-farm/poster.jpg',
      },
    ],
  },
  {
    slug: 'socorro',
    collection: 'Socorro',
    place: 'Socorro, New Mexico',
    year: '1964',
    products: [
      {
        id: 'socorro-shirt',
        type: 'shirt',
        name: 'Socorro Tee',
        price: 34,
        image: '/shop/socorro/front.png',
        altImage: '/shop/socorro/back.png',
      },
      {
        id: 'socorro-print',
        type: 'print',
        name: 'Socorro Print',
        price: 28,
        image: '/shop/socorro/poster.jpg',
      },
    ],
  },
];

function ProductCard({ product, drop }: { product: Product; drop: Drop }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({
      id: product.id,
      name: product.name,
      drop: drop.collection,
      price: product.price,
      image: product.image,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <article className="product-card">
      <div className="product-images">
        <img src={product.image} alt={product.name} className="product-image" />
        {product.altImage && (
          <img src={product.altImage} alt={`${product.name}, alternate view`} className="product-image product-image--alt" />
        )}
      </div>
      <div className="product-info">
        <p className="product-name">{product.name}</p>
        <p className="product-caption">{drop.place} · {drop.year}</p>
        <div className="product-row">
          <span className="product-price">${product.price}</span>
          <button className="btn-add" onClick={handleAdd}>
            {added ? 'Added' : 'Add to crate'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Shop() {
  return (
    <main className="shop">
      <div className="shop-inner">
        <div className="shop-header">
          <h1 className="shop-title">The Crate</h1>
          <p className="shop-desc">
            Apparel and prints tied to specific documented cases. Each drop is limited to one case at a time.
          </p>
        </div>

        {DROPS.map(drop => (
          <section key={drop.slug} className="drop-section" aria-label={drop.collection}>
            <div className="drop-header">
              <h2 className="drop-title">{drop.collection}</h2>
              <p className="drop-meta">{drop.place} · {drop.year}</p>
            </div>
            <div className="drop-grid">
              {drop.products.map(product => (
                <ProductCard key={product.id} product={product} drop={drop} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
