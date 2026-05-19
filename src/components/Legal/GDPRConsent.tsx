import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';

interface GDPRConsentProps {
  onAccept: () => void;
  onDecline: () => void;
  onReadMore: () => void;
}

export const GDPRConsent = ({ onAccept, onDecline, onReadMore }: GDPRConsentProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('gdpr-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('gdpr-consent', 'accepted');
    setIsVisible(false);
    onAccept();
  };

  const handleDecline = () => {
    setIsVisible(false);
    onDecline();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[100]"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-primary-50 rounded-2xl shrink-0">
                <ShieldCheck className="h-6 w-6 text-primary-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Vi bryr oss om ditt personvern</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Vi bruker nødvendig informasjon for å levere våre tjenester. 
                  Ved å fortsette godtar du vår behandling av data i henhold til personvernerklæringen.
                </p>
              </div>
              <button 
                onClick={handleDecline}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
                aria-label="Lukk"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 bg-primary-500 text-white font-bold py-3 px-6 rounded-2xl hover:bg-primary-600 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                Jeg aksepterer
              </button>
              <button
                onClick={onReadMore}
                className="flex-1 bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-2xl hover:bg-slate-100 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                Les mer
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
