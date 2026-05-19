import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, ArrowRight, CreditCard, Truck, ShieldCheck } from 'lucide-react';
import type { Product } from '../Products/ProductSection';

interface CartItem extends Product {
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (productId: number) => void;
  onUpdateQuantity: (productId: number, delta: number) => void;
}

export const CartDrawer = ({ isOpen, onClose, items, onRemove, onUpdateQuantity }: CartDrawerProps) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[120] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-xl">
                  <ShoppingBag className="h-6 w-6 text-primary-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Handlekurv</h2>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
                  {items.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-6 bg-slate-50 rounded-full">
                    <ShoppingBag className="h-12 w-12 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Kurven er tom</h3>
                    <p className="text-slate-500 text-sm">Se våre produkter for å legge til noe her.</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-primary-600 font-bold hover:underline"
                  >
                    Fortsett å handle
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-slate-900 truncate pr-4">{item.name}</h3>
                        <button
                          onClick={() => onRemove(item.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-500 mb-3">{item.category}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="px-2 py-1 hover:bg-slate-50 text-slate-600 transition-colors border-r border-slate-200"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-sm font-bold text-slate-700">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="px-2 py-1 hover:bg-slate-50 text-slate-600 transition-colors border-l border-slate-200"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-bold text-slate-900">
                          {(item.price * item.quantity).toLocaleString('no-NO')} NOK
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Checkout */}
            {items.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Delsum</span>
                    <span>{total.toLocaleString('no-NO')} NOK</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Frakt</span>
                    <span className="text-green-600 font-medium">Gratis</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-100">
                    <span>Total</span>
                    <span>{total.toLocaleString('no-NO')} NOK</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2">
                  <div className="flex flex-col items-center gap-1">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Betaling</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Truck className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Levering</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Sikker</span>
                  </div>
                </div>

                <button
                  className="w-full bg-primary-500 text-white py-4 rounded-2xl font-bold hover:bg-primary-600 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 group"
                >
                  Gå til kassen
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <p className="text-[11px] text-slate-400 text-center">
                  Sikker betaling med Stripe og Klarna. Ved å bestille godtar du våre kjøpsvilkår.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
