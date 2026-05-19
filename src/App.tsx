import { useState, useEffect, useCallback } from 'react';
import { Phone, MapPin, Info, ArrowRight, ExternalLink, Menu, X, User, Mail, ChevronDown, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarView } from './components/Calendar/CalendarView';
import personImg from './assets/person.jpg';

const navLinks = [
  { name: 'Hjem', id: 'home', view: 'landing' as const },
  { name: 'Tjenester', id: 'services', view: 'landing' as const },
  { name: 'Kontakt', id: 'contact', view: 'landing' as const },
  { name: 'Om oss', id: 'about', view: 'landing' as const },
  { name: 'Ansatte', id: 'employees', view: 'landing' as const },
  { name: 'FAQ', id: 'faq', view: 'landing' as const },
  { name: 'Status', id: 'calendar', view: 'calendar' as const },
];

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'calendar'>('landing');
  const [activeNavId, setActiveNavId] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [reservation, setReservation] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const setSelectedNav = (id: string) => {
    setActiveNavId(id);
    localStorage.setItem('activeNavId', id);
  };

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const header = document.querySelector('nav') as HTMLElement | null;
    const offset = header ? header.offsetHeight : 60;
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
  }, []);

  const scrollToSectionWhenReady = useCallback((id: string) => {
    let attempts = 0;
    const maxAttempts = 20;
    const tryScroll = () => {
      const element = document.getElementById(id);
      if (element) {
        scrollToSection(id);
      } else if (attempts++ < maxAttempts) {
        setTimeout(tryScroll, 50);
      }
    };
    tryScroll();
  }, [scrollToSection]);

  const handleNavClick = (view: 'landing' | 'calendar', id: string) => {
    setCurrentView(view);
    setIsMenuOpen(false);
    setSelectedNav(id);
    
    if (view === 'landing') {
      if (currentView === 'landing') {
        if (isMenuOpen) {
          setTimeout(() => scrollToSection(id), 260);
        } else {
          scrollToSection(id);
        }
        window.history.replaceState(null, '', `#${id}`);
      } else {
        window.location.hash = id;
      }
    } else {
      window.location.hash = id;
    }
  };

  // Håndter scrolling til hash ved oppstart og endring av hash
  useEffect(() => {
    const storedActiveNavId = localStorage.getItem('activeNavId');
    if (storedActiveNavId) {
      setActiveNavId(storedActiveNavId);
    }

    const handleHashChange = () => {
      const fullHash = window.location.hash.replace('#', '');
      if (!fullHash) return;

      // Håndter nøstede hashes som calendar#public ved å splitte
      const [mainHash] = fullHash.split('#');
      const link = navLinks.find(l => l.id === mainHash);
      
      if (link) {
        setCurrentView(link.view);
        setSelectedNav(mainHash || 'home');
        if (link.view === 'landing') {
          setTimeout(() => {
            scrollToSectionWhenReady(mainHash);
          }, 250);
        }
      }
      if (!link && !mainHash) {
        setSelectedNav('home');
      }
    };

    // Sjekk hash ved oppstart
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [scrollToSectionWhenReady]); // navLinks er nå utenfor komponenten, så denne er tom og trygg

  const handleReservationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!privacyAccepted) {
      setSubmitStatus({ type: 'error', message: 'Du må godta personvernerklæringen for å sende inn skjemaet.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const url = apiUrl ? `${apiUrl}/api/reservations` : '/api/reservations';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservation),
      });

      if (response.ok) {
        setSubmitStatus({ type: 'success', message: 'Takk! Din henvendelse er mottatt.' });
        setReservation({ name: '', email: '', message: '' });
        setPrivacyAccepted(false);
      } else {
        throw new Error('Noe gikk galt. Prøv igjen senere.');
      }
    } catch {
      setSubmitStatus({ type: 'error', message: 'Kunne ikke koble til serveren. Vennligst prøv igjen senere.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navigasjon */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => handleNavClick('landing', 'home')}
            >
              <img src="/logo.svg" alt="Nordic Devices AS" className="h-10 w-auto group-hover:opacity-80 transition-opacity" />
            </div>
            
            {/* Desktop Meny */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const isActive = activeNavId === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link.view, link.id)}
                    className={`transition-all duration-200 ${
                      isActive
                        ? 'text-lg font-bold text-primary-500 hover:text-primary-600'
                        : 'text-sm font-medium text-slate-600 hover:text-primary-600 hover:font-bold'
                    }`}
                  >
                    {link.name}
                  </button>
                );
              })}
              <button 
                onClick={() => handleNavClick('landing', 'contact')}
                className="bg-primary-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-600 transition-all shadow-sm active:scale-95"
              >
                Kontakt oss
              </button>
            </div>

            {/* Knapp for mobilmeny */}
            <button 
              className="md:hidden p-2 text-slate-600 hover:text-primary-500 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobilmeny-overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                {navLinks.map((link) => {
                  const isActive = activeNavId === link.id;
                  return (
                    <button 
                      key={link.id}
                      className={`block w-full text-left transition-all py-2 ${
                        isActive 
                          ? 'text-primary-500 font-bold text-xl'
                          : 'text-slate-900 text-lg font-medium hover:text-primary-600 hover:font-bold'
                      }`}
                      onClick={() => handleNavClick(link.view, link.id)}
                    >
                      {link.name}
                    </button>
                  );
                })}
                <button 
                  className="block w-full text-center bg-primary-500 text-white py-3 rounded-3xl font-bold"
                  onClick={() => handleNavClick('landing', 'contact')}
                >
                  Kontakt oss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main>
        {currentView === 'landing' ? (
          <>
            {/* Hero-seksjon */}
            <section id="home" className="relative overflow-hidden bg-white pt-36 pb-28 lg:pt-32 lg:pb-40">
              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <motion.div {...fadeIn}>
                  <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
                    Nordic <span className="text-primary-500">Devices</span>
                    <span className="block text-2xl sm:text-3xl text-slate-400 mt-2">IT-løsninger for små og store bedrifter</span>
                  </h1>
                  <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed">
                    Vi leverer og administrerer IT-utstyr og digitale tjenester skreddersydd for din bedrift.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                      onClick={() => handleNavClick('landing', 'contact')}
                      className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-primary-500 text-white font-semibold text-lg hover:bg-primary-600 transition-all shadow-sm group"
                    >
                      <Phone className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      Kontakt oss
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleNavClick('landing', 'services')}
                      className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-white text-slate-900 border-2 border-slate-200 font-semibold text-lg hover:border-primary-300 transition-all group"
                    >
                      Våre tjenester
                    </button>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Funksjoner / Ikoner */}
            <section id="services" className="pt-24 pb-12 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold mb-4">Våre tjenester</h2>
                  <p className="text-slate-600 max-w-xl mx-auto">
                    Moderne IT-løsninger for fremtidens bedrifter
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { icon: <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>, title: "IT-drift og support", desc: "Levering og administrasjon av IT-utstyr og digitale tjenester for din bedrift." },
                    { icon: <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>, title: "Sikre nettverksløsninger", desc: "Brannmurer, VPN, nettverkssegmentering og overvåkning for å beskytte din bedriftsdata." },
                    { icon: <svg className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>, title: "Brukeradministrasjon", desc: "Active Directory, Microsoft 365 og SSO-løsninger for effektiv og sikker brukerstyring." }
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                    >
                      <div className="mb-4">{item.icon}</div>
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                      <p className="text-slate-600">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Kontaktseksjon */}
            <section id="contact" className="py-24 bg-primary-50">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-primary-100"
                >
                  <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold mb-4">Ta kontakt med oss</h2>
                    <p className="text-slate-600">
                      Fyll ut skjemaet under, så tar vi kontakt med deg innen 24 timer på hverdager.
                    </p>
                  </div>

                  <form onSubmit={handleReservationSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <User className="h-4 w-4 text-primary-500" /> Fullt navn
                        </label>
                        <input
                          type="text"
                          id="name"
                          required
                          value={reservation.name}
                          onChange={(e) => setReservation({ ...reservation, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                          placeholder="Ditt navn"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary-500" /> E-post eller mobil
                        </label>
                        <input
                          type="text"
                          id="email"
                          required
                          value={reservation.email}
                          onChange={(e) => setReservation({ ...reservation, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                          placeholder="Hvordan kan vi nå deg?"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-semibold text-slate-700">
                        Hva trenger du hjelp med?
                      </label>
                      <textarea
                        id="message"
                        rows={4}
                        value={reservation.message}
                        onChange={(e) => setReservation({ ...reservation, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                        placeholder="Beskriv hva du trenger hjelp til..."
                      />
                    </div>

                    {submitStatus && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className={`p-4 rounded-xl text-sm font-medium ${
                          submitStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}
                      >
                        {submitStatus.message}
                      </motion.div>
                    )}

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex gap-3 items-start">
                        <ShieldCheck className="h-5 w-5 text-primary-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-slate-600 leading-relaxed">
                          <p className="font-semibold text-slate-700 mb-1">Personvern og sikkerhet</p>
                          Informasjonen du sender her behandles konfidensielt. 
                          Vi lagrer kun nødvendige opplysninger for å kunne følge opp din henvendelse, 
                          og dataene slettes automatisk {import.meta.env.VITE_RESERVATION_RETENTION_DAYS || '1'} {(import.meta.env.VITE_RESERVATION_RETENTION_DAYS || '1') === '1' ? 'dag' : 'dager'} etter at saken er avsluttet.
                        </div>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          required
                          checked={privacyAccepted}
                          onChange={(e) => setPrivacyAccepted(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500/20 cursor-pointer"
                        />
                        <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">
                          Jeg godtar at mine opplysninger behandles i henhold til personvernerklæringen.
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary-500 text-white py-4 rounded-xl font-bold hover:bg-primary-600 transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Send forespørsel <ArrowRight className="h-5 w-5" /></>
                      )}
                    </button>
                  </form>
                </motion.div>
              </div>
            </section>

            {/* Om oss */}
            <section id="about" className="pt-12 pb-0 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold mb-8 text-center">Om Nordic Devices</h2>
                <div className="max-w-3xl mx-auto">
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-primary-50 border border-primary-100">
                      <h3 className="text-xl font-bold text-primary-900 mb-4">Om selskapet</h3>
                      <p className="text-slate-700 mb-4 leading-relaxed">
                        Nordic Devices AS er et nystartet selskap som skal levere og administrere IT-utstyr 
                        og digitale tjenester for små og store bedrifter.
                      </p>
                      <p className="text-slate-700 leading-relaxed">
                        Selskapet tilbyr sikre nettverksløsninger og systemer for brukeradministrasjon. 
                        Våre løsninger er godt dokumentert, sikre og enkle å videreutvikle.
                      </p>
                    </div>

                      <div className="p-6 rounded-3xl bg-white border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                            <Info className="h-4 w-4 text-primary-600" />
                          </div>
                          <h4 className="font-bold text-slate-900">Kontaktinformasjon</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                            <span className="text-slate-600">E-post</span>
                            <span className="font-bold text-primary-700">post@nordicdevices.no</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                            <span className="text-slate-600">Telefon</span>
                            <span className="font-bold text-primary-700">+47 400 00 000</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Svar innen</span>
                            <span className="font-bold text-primary-700">24 timer på hverdager</span>
                          </div>
                        </div>
                      </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Våre ansatte */}
            <section id="employees" className="py-24 bg-slate-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold mb-4">Møt våre ansatte</h2>
                  <p className="text-slate-600 max-w-xl mx-auto">
                    Vårt team av eksperter står klare til å hjelpe din bedrift med alle IT-utfordringer.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                     { name: 'Bjørn Johansen', role: 'Daglig Leder', email: 'bjorn@nordicdevices.no' },
                     { name: 'Bjørnar Nilsen', role: 'Senior IT-Konsulent', email: 'bjornar@nordicdevices.no' },
                     { name: 'Bjørne Bakke', role: 'Nettverksspesialist', email: 'bjorne@nordicdevices.no' },
                     { name: 'Bjørn-Erik Larsen', role: 'Supportansvarlig', email: 'bjorn-erik@nordicdevices.no' }
                   ].map((employee, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
                    >
                      <div className="aspect-[4/5] overflow-hidden">
                        <img
                          src={personImg}
                          alt={employee.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{employee.name}</h3>
                        <p className="text-primary-600 font-medium text-sm mb-4">{employee.role}</p>
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <Mail className="h-4 w-4" />
                          <span>{employee.email}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* FAQ-seksjon */}
            <section id="faq" className="py-24 bg-white">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold mb-4">Ofte stilte spørsmål</h2>
                  <p className="text-slate-600">
                    Her finner du svar på det de fleste lurer på om våre IT-tjenester.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      q: "Hva koster det å leie IT-drift fra dere?",
                      a: "Vi tilbyr fleksible prisplaner tilpasset din bedrifts størrelse og behov. Kontakt oss for et uforpliktende tilbud."
                    },
                    {
                      q: "Hvor lang tid tar det å komme i gang?",
                      a: "De fleste løsninger kan settes opp i løpet av 1-3 dager. Større infrastrukturprosjekter planlegges i samarbeid med deg."
                    },
                    {
                      q: "Tilbyr dere support utenom kontortid?",
                      a: "Ja, vi har utvidet support med avtale om responstid. Vår standard support dekker hverdager 08-16."
                    },
                    {
                      q: "Hvordan sikrer dere datasikkerhet?",
                      a: "Vi bruker brannmurer, VPN, kryptering, automatiske sikkerhetsoppdateringer og overvåkning døgnet rundt. Alle løsninger følger gjeldende personvernforordning (GDPR)."
                    },
                    {
                      q: "Kan jeg bruke mine egne programmer hos dere?",
                      a: "Ja, vi støtter de fleste standard programvarelisenser og kan tilpasse miljøet til dine spesifikke behov."
                    }
                  ].map((faq, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="border border-slate-200 rounded-2xl overflow-hidden"
                    >
                      <details className="group">
                        <summary className="flex items-center justify-between p-6 cursor-pointer list-none bg-white hover:bg-slate-50 transition-colors">
                          <span className="font-bold text-slate-900 pr-4">{faq.q}</span>
                          <ChevronDown className="h-5 w-5 text-slate-400 group-open:rotate-180 transition-transform" />
                        </summary>
                        <div className="px-6 pb-6 text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                          {faq.a}
                        </div>
                      </details>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Sted-seksjon */}
            <section id="hvor" className="py-24 bg-primary-900 text-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold mb-4 text-white">Hvor finner du oss?</h2>
                  <p className="text-primary-100 max-w-xl mx-auto text-lg">
                    Vi holder til i Oslo-området og betjener kunder over hele Norge.
                  </p>
                </div>
                <div className="bg-primary-800/50 rounded-3xl p-8 md:p-12 border border-primary-700/50 flex flex-col md:flex-row gap-12 items-center">
                  <div className="flex-1 space-y-10">
                    <div className="flex gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center shrink-0 shadow-sm">
                        <MapPin className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2 text-white">Besøksadresse</h3>
                        <div className="text-primary-100 leading-relaxed">
                          <p className="text-white">Nordic Devices AS</p>
                          <p>Hellavegen 1</p>
                          <p>7504 Hell, Trondheim</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center shrink-0 shadow-sm">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" /></svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1 text-white">Fjernadministrasjon</h3>
                        <p className="text-primary-100 leading-relaxed">
                          De fleste tjenester kan settes opp og driftes eksternt.
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <a 
                        href="https://www.google.com/maps/search/?api=1&query=63.47443279429126,10.914739728742665"
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary-100 font-bold hover:text-white transition-all border-b-2 border-primary-500 hover:border-white pb-1"
                      >
                        Se i kart <ArrowRight className="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                  <div className="flex-1 w-full aspect-video bg-primary-950/50 rounded-3xl border border-primary-700/50 overflow-hidden">
                    <iframe 
                      src="https://maps.google.com/maps?q=63.47443279429126,10.914739728742665&z=15&output=embed"
                      width="100%" 
                      height="100%" 
                      style={{ border: 0 }} 
                      allowFullScreen={true} 
                      loading="lazy" 
                      referrerPolicy="no-referrer-when-downgrade"
                      className="opacity-100"
                    ></iframe>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <CalendarView />
        )}
      </main>

      {/* Bunntekst */}
      <footer className="bg-white border-t border-slate-200 pt-10 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-1 md:col-span-2">
              <img src="/logo.svg" alt="Nordic Devices AS" className="h-10 w-auto mb-4" />
              <p className="text-slate-500 max-w-sm text-sm">
                Nordic Devices AS leverer og administrerer IT-utstyr og digitale tjenester for små og mellomstore bedrifter.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-3">Lenker</h4>
              <ul className="space-y-2 text-slate-600">
                <li><a href="#" className="hover:text-primary-500 transition-colors">Hjem</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Tjenester</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Om oss</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Kontakt oss</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">Ressurser</h4>
              <ul className="space-y-2 text-slate-600">
                <li><a href="#" target="_blank" className="flex items-center gap-1 hover:text-primary-500">Personvern <ExternalLink className="h-3 w-3" /></a></li>
                <li><a href="#" target="_blank" className="flex items-center gap-1 hover:text-primary-500">Informasjonskapsler <ExternalLink className="h-3 w-3" /></a></li>
                <li><a href="#" target="_blank" className="flex items-center gap-1 hover:text-primary-500">Tilgjengelighetserklæring <ExternalLink className="h-3 w-3" /></a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-xs italic">
              Dette er en demoside for eksamen, ikke en offisiell nettside for Nordic Devices AS.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" target="_blank" className="text-slate-400 hover:text-blue-600 transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="#" target="_blank" className="text-slate-400 hover:text-slate-800 transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
