import { useState, useEffect, useCallback } from 'react';
import { Phone, MapPin, MessageCircle, Heart, Info, ArrowRight, ExternalLink, Menu, X, Calendar, Clock, User, Mail, ChevronDown, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarView } from './components/Calendar/CalendarView';

const navLinks = [
  { name: 'Hjem', id: 'home', view: 'landing' as const },
  { name: 'Tjenester', id: 'services', view: 'landing' as const },
  { name: 'Bestill time', id: 'reservation', view: 'landing' as const },
  { name: 'Snapchat', id: 'about', view: 'landing' as const },
  { name: 'FAQ', id: 'faq', view: 'landing' as const },
  { name: 'Kalender', id: 'calendar', view: 'calendar' as const },
];

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'calendar'>('landing');
  const [activeNavId, setActiveNavId] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [reservation, setReservation] = useState({
    name: '',
    email: '',
    date: '',
    time: '',
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

  const handleSnapchatCtaClick = () => {
    setCurrentView('landing');
    setIsMenuOpen(false);
    setSelectedNav('about');

    window.location.hash = 'about';
  };

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
    
    // Valider åpningstider
    const selectedDate = new Date(reservation.date);
    const day = selectedDate.getDay(); // 0 = Søndag, 1 = Mandag, osv.
    const [hour, minute] = reservation.time.split(':').map(Number);

    let isValidTime = false;
    let errorMessage = "";

    if (day === 0 || day === 6) {
      errorMessage = "Vi har stengt i helgene. Vennligst velg en hverdag.";
    } else {
      if ((day === 1 || day === 2 || day === 4)) {
        if (hour >= 9 && hour < 14) isValidTime = true;
        if (hour === 14 && minute === 0) isValidTime = true;
      } else if (day === 3) {
        if (hour >= 9 && hour < 13) isValidTime = true;
        if (hour === 13 && minute === 0) isValidTime = true;
      } else if (day === 5) {
        if (hour >= 9 && hour < 11) isValidTime = true;
        if (hour === 11 && minute === 0) isValidTime = true;
      }
      
      if (!isValidTime && !errorMessage) {
        errorMessage = `Vi har stengt på det valgte tidspunktet. Se åpningstidene våre lenger ned.`;
      }
    }

    if (!isValidTime) {
      setSubmitStatus({ type: 'error', message: errorMessage });
      return;
    }

    if (!privacyAccepted) {
      setSubmitStatus({ type: 'error', message: 'Du må godta personvernerklæringen for å sende inn skjemaet.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:6767';
      const response = await fetch(`${apiUrl}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservation),
      });

      if (response.ok) {
        setSubmitStatus({ type: 'success', message: 'Takk! Din reservasjon er mottatt.' });
        setReservation({ name: '', email: '', date: '', time: '', message: '' });
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

  const getAvailableHours = () => {
    if (!reservation.date) return [];
    
    const selectedDate = new Date(reservation.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = selectedDate.getTime() === today.getTime();
    const currentHour = new Date().getHours();

    const day = selectedDate.getDay();
    let hours: string[] = [];
    
    if (day === 1 || day === 2 || day === 4) hours = ['09', '10', '11', '12', '13', '14'];
    else if (day === 3) hours = ['09', '10', '11', '12', '13'];
    else if (day === 5) hours = ['09', '10', '11'];
    
    // Hvis det er i dag, vis kun nåværende time og fremover
    if (isToday) {
      return hours.filter(h => parseInt(h) >= currentHour);
    }
    
    return hours;
  };

  const getAvailableMinutes = (selectedHour: string) => {
    if (!reservation.date || !selectedHour) return ['00', '15', '30', '45'];
    
    const selectedDate = new Date(reservation.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = selectedDate.getTime() === today.getTime();
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();

    const day = selectedDate.getDay();
    
    // Sjekk om dette er siste time for dagen
    const isLastHour = 
      ((day === 1 || day === 2 || day === 4) && selectedHour === '14') ||
      (day === 3 && selectedHour === '13') ||
      (day === 5 && selectedHour === '11');

    const minutes = isLastHour ? ['00'] : ['00', '15', '30', '45'];

    // Hvis det er i dag og nåværende time, vis kun fremtidige minutter
    if (isToday && parseInt(selectedHour) === currentHour) {
      return minutes.filter(m => parseInt(m) >= currentMinute);
    }

    return minutes;
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
              <img src="/logo.svg" alt="Hamar Katedralskole" className="h-10 w-auto group-hover:opacity-80 transition-opacity" />
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
                onClick={() => handleNavClick('landing', 'reservation')}
                className="bg-primary-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-600 transition-all shadow-sm active:scale-95"
              >
                Snakk med oss
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
                  onClick={() => handleNavClick('landing', 'reservation')}
                >
                  Snakk med oss
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
                    Skolehelse<span className="text-primary-500">tjenesten</span>
                    <span className="block text-2xl sm:text-3xl text-slate-400 mt-2">Hamar katedralskole</span>
                  </h1>
                  <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed">
                    Du kan snakke med oss om alt som har med din helse å gjøre: psykisk helse, fysisk helse, seksualitet og tester for kjønnssykdommer.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                      onClick={handleSnapchatCtaClick}
                      className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-primary-500 text-white font-semibold text-lg hover:bg-primary-600 transition-all shadow-sm group"
                    >
                      <Phone className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      Kontakt via SMS
                    </button>
                    <button 
                      type="button"
                      onClick={handleSnapchatCtaClick}
                      className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-white text-slate-900 border-2 border-slate-200 font-semibold text-lg hover:border-primary-300 transition-all group"
                    >
                      <MessageCircle className="mr-2 h-5 w-5 text-yellow-500 group-hover:scale-110 transition-transform" />
                      Send oss en Snap
                    </button>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Funksjoner / Ikoner */}
            <section id="services" className="pt-24 pb-12 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { icon: <Heart className="h-8 w-8 text-rose-500" />, title: "Psykisk Helse", desc: "Vi er her når livet føles vanskelig eller du trenger noen å lufte tankene med." },
                    { icon: <Info className="h-8 w-8 text-blue-500" />, title: "Fysisk Helse", desc: "Spørsmål om kropp, søvn, mat eller små plager i hverdagen." },
                    { icon: <Heart className="h-8 w-8 text-purple-500" />, title: "Seksualitet", desc: "Prevensjon, testing for kjønnssykdommer og samtaler om seksualitet." }
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

            {/* Reservasjonsseksjon */}
            <section id="reservation" className="py-24 bg-primary-50">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-primary-100"
                >
                  <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold mb-4">Reserver en samtale</h2>
                    <p className="text-slate-600">
                      Fyll ut skjemaet under for å be om en samtale. Vi tar kontakt med deg så snart som mulig.
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="date" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary-500" /> Ønsket dato
                        </label>
                        <input
                          type="date"
                          id="date"
                          required
                          min={new Date().toISOString().split('T')[0]}
                          value={reservation.date}
                          onChange={(e) => {
                            setReservation({ ...reservation, date: e.target.value, time: '' });
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="time" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary-500" /> Ønsket tidspunkt
                        </label>
                        <div className="flex gap-2">
                          <select
                            id="time-hour"
                            required
                            value={reservation.time.split(':')[0] || ''}
                            onChange={(e) => {
                              const newHour = e.target.value;
                              const availableMinutes = getAvailableMinutes(newHour);
                              const currentMinute = reservation.time.split(':')[1] || '00';
                              const finalMinute = availableMinutes.includes(currentMinute) ? currentMinute : '00';
                              setReservation({ ...reservation, time: `${newHour}:${finalMinute}` });
                            }}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                          >
                            <option value="" disabled>Time</option>
                            {getAvailableHours().map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                            {getAvailableHours().length === 0 && (
                              <option disabled>Velg en hverdag først</option>
                            )}
                          </select>
                          <div className="flex items-center text-slate-400 font-bold">:</div>
                          <select
                            id="time-minute"
                            required
                            value={reservation.time.split(':')[1] || ''}
                            onChange={(e) => {
                              const newMinute = e.target.value;
                              const currentHour = reservation.time.split(':')[0] || '09';
                              setReservation({ ...reservation, time: `${currentHour}:${newMinute}` });
                            }}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                          >
                            <option value="" disabled>Min</option>
                            {getAvailableMinutes(reservation.time.split(':')[0]).map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
                          <Info className="h-3.5 w-3.5 text-primary-500" />
                          Vennligst velg et tidspunkt innenfor våre åpningstider.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-semibold text-slate-700">
                        Hva vil du snakke om? (Valgfritt)
                      </label>
                      <textarea
                        id="message"
                        rows={4}
                        value={reservation.message}
                        onChange={(e) => setReservation({ ...reservation, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                        placeholder="Skriv litt om hva du trenger hjelp til..."
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
                          Informasjonen du sender her behandles konfidensielt av skolehelsetjenesten. 
                          Vi lagrer kun nødvendige opplysninger for å kunne følge opp din henvendelse, 
                          og dataene slettes automatisk {import.meta.env.VITE_RESERVATION_RETENTION_DAYS || '1'} {(import.meta.env.VITE_RESERVATION_RETENTION_DAYS || '1') === '1' ? 'dag' : 'dager'} etter at timen er passert.
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
                          Jeg forstår at mine opplysninger behandles konfidensielt og slettes automatisk {import.meta.env.VITE_RESERVATION_RETENTION_DAYS || '1'} {(import.meta.env.VITE_RESERVATION_RETENTION_DAYS || '1') === '1' ? 'dag' : 'dager'} etter at timen er passert.
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

            {/* Ansatte og kontakt */}
            <section id="about" className="pt-12 pb-0 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold mb-8">Vi er her for deg</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-3xl bg-primary-50 border border-primary-100">
                          <h3 className="text-xl font-bold text-primary-900 mb-2">Helsesykepleier Marianne Buvik</h3>
                          <p className="text-slate-700 mb-4">Bestill time via SMS med navn og fødselsdato.</p>
                          <a href="tel:90269665" className="inline-flex items-center font-bold text-primary-600 hover:text-primary-700">
                            <Phone className="mr-2 h-4 w-4" /> 902 69 665
                          </a>
                        </div>
                        
                        <div className="p-6 rounded-3xl bg-primary-50 border border-primary-100">
                          <h3 className="text-xl font-bold text-primary-900 mb-2">Helsesykepleier Hanne Krøtøy</h3>
                          <p className="text-slate-700 mb-4">Bestill time via SMS med navn og fødselsdato.</p>
                          <a href="tel:91248594" className="inline-flex items-center font-bold text-primary-600 hover:text-primary-700">
                            <Phone className="mr-2 h-4 w-4" /> 912 48 594
                          </a>
                        </div>
                      </div>

                      <div className="p-6 rounded-3xl bg-white border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
                            <Info className="h-4 w-4 text-primary-600" />
                          </div>
                          <h4 className="font-bold text-slate-900">Åpningstider</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                            <span className="text-slate-600">Mandag, tirsdag og torsdag</span>
                            <span className="font-bold text-primary-700">09:00 – 14:00</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-2">
                            <span className="text-slate-600">Onsdag</span>
                            <span className="font-bold text-primary-700">09:00 – 13:00</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Fredag</span>
                            <span className="font-bold text-primary-700">09:00 – 11:00</span>
                          </div>
                        </div>
                      </div>
                  </div>

                  <div id="snapchat" className="relative group">
                    <div className="relative bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col items-center">
                      <div className="flex items-center gap-4 mb-6 w-full">
                        <div className="p-3 bg-yellow-400 rounded-2xl shrink-0">
                          <MessageCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Send oss en Snap</h3>
                          <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">helsetjenesten</p>
                        </div>
                      </div>
                      <div className="w-64 h-64 mb-6">
                        <img src="/snapchat-qr.png" alt="Snapchat QR Code" className="w-full h-full object-contain" />
                      </div>
                      <p className="text-center text-slate-500 text-sm font-medium">Scan koden for å legge oss til</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ-seksjon */}
            <section id="faq" className="py-24 bg-white">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold mb-4">Ofte stilte spørsmål</h2>
                  <p className="text-slate-600">
                    Her finner du svar på det de fleste lurer på om skolehelsetjenesten.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      q: "Hva koster det å bruke skolehelsetjenesten?",
                      a: "Alle tjenester hos skolehelsetjenesten er helt gratis for alle elever ved skolen."
                    },
                    {
                      q: "Har dere taushetsplikt?",
                      a: "Ja, alle som jobber her har streng taushetsplikt. Det du forteller oss blir mellom oss, med mindre det er fare for liv og helse."
                    },
                    {
                      q: "Må jeg bestille time på forhånd?",
                      a: "Nei, du kan gjerne stikke innom på drop-in hvis døren er åpen. Men hvis du vil være sikker på å få snakket med oss, er det lurt å bestille en time her på nettsiden eller via SMS."
                    },
                    {
                      q: "Kan jeg få prevensjon hos dere?",
                      a: "Ja, vi kan skrive ut resept på prevensjon (p-piller, p-stav, spiral osv.) og vi deler ut gratis kondomer."
                    },
                    {
                      q: "Hva kan jeg snakke med dere om?",
                      a: "Du kan snakke med oss om alt! Ingenting er for lite eller for stort. Det kan være kjærlighetssorg, problemer hjemme, prevensjon, ensomhet, stress eller fysiske plager."
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
                    Vi holder til sentralt på skolen for at det skal være lett å stikke innom.
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
                          <p className="text-white">Hamar Katedralskole</p>
                          <p>Ringgata 235, 2315 Hamar</p>
                          <p>Fløy 1, 3. etasje (ved Elevtjenesten)</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center shrink-0 shadow-sm">
                        <Heart className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1 text-white">Drop-in</h3>
                        <p className="text-primary-100 leading-relaxed">
                          Kom innom hvis døra er åpen. Ingen sak er for liten.
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <a 
                        href="https://www.google.com/maps/search/?api=1&query=60.80578546070512,11.054866109563148" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary-100 font-bold hover:text-white transition-all border-b-2 border-primary-500 hover:border-white pb-1"
                      >
                        Se skolen i kart <ArrowRight className="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                  <div className="flex-1 w-full aspect-video bg-primary-950/50 rounded-3xl border border-primary-700/50 overflow-hidden">
                    <iframe 
                      src="https://maps.google.com/maps?q=60.80578546070512,11.054866109563148&z=17&output=embed" 
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
              <img src="/logo.svg" alt="Logo" className="h-10 w-auto mb-4" />
              <p className="text-slate-500 max-w-sm text-sm">
                En del av Innlandet fylkeskommune. Vi jobber for å fremme god helse og trivsel blant våre elever.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-3">Lenker</h4>
              <ul className="space-y-2 text-slate-600">
                <li><a href="#" className="hover:text-primary-500 transition-colors">Utdanningstilbud</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">For elever</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Om skolen</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Kontakt oss</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-3">Ressurser</h4>
              <ul className="space-y-2 text-slate-600">
                <li><a href="https://innlandetfylke.no/om-fylkeskommunen/personvern/" target="_blank" className="flex items-center gap-1 hover:text-primary-500">Personvern <ExternalLink className="h-3 w-3" /></a></li>
                <li><a href="https://innlandetfylke.no/om-fylkeskommunen/informasjonskapsler/" target="_blank" className="flex items-center gap-1 hover:text-primary-500">Informasjonskapsler <ExternalLink className="h-3 w-3" /></a></li>
                <li><a href="https://uustatus.no/nb/erklaringer/publisert/947710bb-4ba7-43d7-8638-def79b4ab3dd" target="_blank" className="flex items-center gap-1 hover:text-primary-500">Tilgjengelighetserklæring <ExternalLink className="h-3 w-3" /></a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-xs italic">
              Dette er en demoside, ikke den offisielle siden.
            </p>
            <div className="flex gap-6">
              <a href="https://www.facebook.com/hamarkatedralskole/" target="_blank" className="text-slate-400 hover:text-blue-600 transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://www.instagram.com/hamarkatedralskole1153/" target="_blank" className="text-slate-400 hover:text-pink-600 transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.334.06-2.244.272-3.04.581-.824.319-1.522.747-2.217 1.442-.695.695-1.123 1.392-1.442 2.217-.309.796-.521 1.706-.581 3.04-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.06 1.334.272 2.244.581 3.04.319.824.747 1.522 1.442 2.217.695.695 1.392 1.123 2.217 1.442.796.309 1.706.521 3.04.581 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.334-.06 2.244-.272 3.04-.581.824-.319 1.522-.747 2.217-1.442.695-.695 1.123-1.392 1.442-2.217.309-.796.521-1.706.581-3.04.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.06-1.334-.272-2.244-.581-3.04-.319-.824-.747-1.522-1.442-2.217-.695-.695-1.392-1.123-2.217-1.442-.796-.309-1.706-.521-3.04-.581-1.28-.058-1.688-.072-4.947-.072z"/><path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
