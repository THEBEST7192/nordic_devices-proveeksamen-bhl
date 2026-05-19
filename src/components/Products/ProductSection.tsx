import { Laptop, Monitor, Network, Server, HardDrive, Cpu, Heart, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import React from 'react';

export interface Product {
  id: number;
  icon: React.ReactNode;
  name: string;
  price: number;
  category: string;
}

interface ProductSectionProps {
  wishlist: number[];
  toggleWishlist: (productId: number) => void;
  addToCart: (product: Product) => void;
}

export const ProductSection = ({ wishlist, toggleWishlist, addToCart }: ProductSectionProps) => {
  const products: Product[] = [
    { id: 1, icon: <Laptop className="h-10 w-10 text-primary-500" />, name: 'Dell Latitude 5440', price: 14500, category: 'PC' },
    { id: 6, icon: <Monitor className="h-10 w-10 text-primary-500" />, name: 'Samsung 27" Skjerm', price: 3200, category: 'Tilbehør' },
    { id: 3, icon: <Network className="h-10 w-10 text-primary-500" />, name: 'UniFi 24-port Switch', price: 5200, category: 'Nettverk' },
    { id: 8, icon: <Server className="h-10 w-10 text-primary-500" />, name: 'Synology NAS DS220+', price: 4800, category: 'Server' },
    { id: 4, icon: <HardDrive className="h-10 w-10 text-primary-500" />, name: 'UniFi Access Point U6-Lite', price: 1600, category: 'Nettverk' },
    { id: 7, icon: <Cpu className="h-10 w-10 text-primary-500" />, name: 'Raspberry Pi 5', price: 900, category: 'Utvikling' }
  ];

  return (
    <section id="products" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Våre produkter</h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Vi tilbyr et bredt utvalg av IT-utstyr for salg og utleie.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative"
            >
              <button 
                onClick={() => toggleWishlist(product.id)}
                aria-label={wishlist.includes(product.id) ? `Fjern ${product.name} fra ønskeliste` : `Legg ${product.name} i ønskeliste`}
                className={`absolute top-6 right-6 p-2 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 active:scale-90 ${
                  wishlist.includes(product.id) 
                    ? 'bg-red-50 text-red-600 active:bg-red-100' 
                    : 'bg-slate-50 text-slate-500 hover:text-red-500 active:bg-slate-200'
                }`}
              >
                <Heart className={`h-5 w-5 ${wishlist.includes(product.id) ? 'fill-current' : ''}`} />
              </button>

              <div className="mb-6 bg-primary-50 w-20 h-20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform" aria-hidden="true">
                {product.icon}
              </div>
              <span className="inline-block px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold mb-3">
                {product.category}
              </span>
              <h3 className="text-xl font-bold mb-2 text-slate-900">{product.name}</h3>
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-900">
                    {product.price.toLocaleString('no-NO')} <span className="text-sm font-normal text-slate-600">NOK</span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => addToCart(product)}
                    className="p-3 rounded-2xl bg-primary-500 text-white hover:bg-primary-600 active:scale-90 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 flex items-center gap-2"
                    aria-label={`Legg ${product.name} i handlekurv`}
                  >
                    <ShoppingBag className="h-5 w-5" />
                    <span className="text-sm font-bold">Kjøp produkt</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

