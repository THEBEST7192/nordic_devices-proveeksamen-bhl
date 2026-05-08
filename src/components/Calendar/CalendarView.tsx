import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Mail, ShieldCheck, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface Reservation {
  id: number;
  name: string;
  email: string;
  date: string;
  time: string;
  message: string;
}

// --- Komponent for Offentlig Kalender ---
function PublicCalendar() {
  const [appointments, setAppointments] = useState<{ date: string, time: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/reservations/public`);
        if (response.ok) {
          const data = await response.json();
          // Ekstra filtrering i frontend for å sikre at vi kun viser fremtidige avtaler (fra og med inneværende time)
          const now = new Date();
          const currentHour = now.getHours();
          const todayStr = now.toISOString().split('T')[0];
          
          const filteredData = data.filter((app: { date: string, time: string }) => {
            const appDate = new Date(app.date).toISOString().split('T')[0];
            if (appDate > todayStr) return true;
            if (appDate === todayStr) {
              const appHour = parseInt(app.time.split(':')[0]);
              return appHour >= currentHour;
            }
            return false;
          });
          
          setAppointments(filteredData);
        }
      } catch (error) {
        console.error("Feil ved henting av offentlige avtaler:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  if (loading) return <div className="p-8 text-center">Laster kalender...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 pb-6 pt-0">
      <h2 className="text-3xl font-bold text-primary-500 mb-6 flex items-center gap-2">
        <Calendar className="h-8 w-8" /> Opptatte tidspunkter
      </h2>
      <p className="text-slate-600 mb-8">Her kan du se når helsesykepleier er opptatt. Du kan ikke se hvem som har avtale.</p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {appointments.length === 0 ? (
          <p className="col-span-full text-center py-12 bg-slate-50 rounded-2xl text-slate-500">Ingen registrerte avtaler ennå.</p>
        ) : (
          appointments.map((app, index) => (
            <div key={index} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center gap-6">
              <div className="flex flex-col items-center justify-center bg-primary-500 text-white rounded-xl px-4 py-3 min-w-[80px]">
                <span className="text-3xl font-black leading-none">{new Date(app.date).getDate()}</span>
                <span className="text-xs font-bold uppercase tracking-wider">{new Date(app.date).toLocaleDateString('nb-NO', { month: 'short' }).replace('.', '')}</span>
              </div>
              <div className="flex-1">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
                  {new Date(app.date).toLocaleDateString('nb-NO', { weekday: 'long' })}
                </p>
                <div className="flex items-center gap-2 text-slate-900">
                  <Clock className="h-5 w-5 text-primary-500" />
                  <span className="text-xl font-bold">Kl. {app.time.substring(0, 5)}</span>
                </div>
                <p className="text-primary-500 text-sm font-semibold mt-1">Opptatt</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- Komponent for Lege-oversikt ---
function DoctorCalendar() {
  const [appointments, setAppointments] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [hasDoctors, setHasDoctors] = useState<boolean | null>(null);

  useEffect(() => {
    const checkDoctors = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/doctors/check`);
        if (response.ok) {
          const data = await response.json();
          setHasDoctors(data.hasDoctors);
        }
      } catch (error) {
        console.error("Feil ved sjekk av legestatus:", error);
      }
    };
    checkDoctors();
  }, []);

  const fetchAppointments = async (user?: string, pass?: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/reservations`, {
        headers: {
          'x-username': user || username,
          'x-password': pass || password
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Ekstra filtrering i frontend for å sikre at vi kun viser fremtidige avtaler (fra og med inneværende time)
        const now = new Date();
        const currentHour = now.getHours();
        const todayStr = now.toISOString().split('T')[0];
        
        const filteredData = data.filter((app: Reservation) => {
          const appDate = new Date(app.date).toISOString().split('T')[0];
          if (appDate > todayStr) return true;
          if (appDate === todayStr) {
            const appHour = parseInt(app.time.split(':')[0]);
            return appHour >= currentHour;
          }
          return false;
        });
        
        setAppointments(filteredData);
      }
    } catch (error) {
      console.error("Feil ved henting av lege-avtaler:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        fetchAppointments(username, password);
      } else {
        setLoginError(data.error || 'Feil brukernavn eller passord');
      }
    } catch (error) {
      console.error("Innloggingsfeil:", error);
      setLoginError('Kunne ikke koble til serveren');
    }
  };

  if (hasDoctors === false) {
    return (
      <div className="max-w-md mx-auto p-12 bg-white border border-red-200 rounded-3xl shadow-xl">
        <div className="text-center">
          <div className="inline-flex p-4 bg-red-50 rounded-full text-red-500 mb-4">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-red-700">Systemvarsel</h2>
          <p className="text-slate-600 mt-4 leading-relaxed">
            Det er ingen leger registrert i systemet ennå. 
          </p>
          <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-sm text-slate-500 font-mono">
            Vennligst opprett en lege manuelt i databasens "doctors"-tabell før du kan logge inn.
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto p-12 bg-white border border-slate-200 rounded-3xl shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-primary-50 rounded-full text-primary-500 mb-4">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold">Kun for ansatte</h2>
          <p className="text-slate-500 mt-2">Vennligst logg inn for å se pasientoversikt.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Brukernavn</label>
            <input 
              type="text" 
              className={`w-full px-4 py-3 rounded-xl border ${loginError ? 'border-red-500 bg-red-50' : 'border-slate-200'} focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Skriv inn brukernavn..."
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Passord</label>
            <input 
              type="password" 
              className={`w-full px-4 py-3 rounded-xl border ${loginError ? 'border-red-500 bg-red-50' : 'border-slate-200'} focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Skriv inn passord..."
              autoComplete="current-password"
            />
            {loginError && <p className="text-red-500 text-xs mt-1 font-medium">{loginError}</p>}
          </div>
          <button type="submit" className="w-full bg-primary-500 text-white py-3 rounded-xl font-bold hover:bg-primary-600 transition-all shadow-md">
            Logg inn
          </button>
        </form>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center">Laster pasientdata...</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 pb-6 pt-0">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-primary-500 flex items-center gap-2">
          <User className="h-8 w-8" /> Pasientoversikt
        </h2>
        <button 
          onClick={() => {
            setIsAuthenticated(false);
            setUsername('');
            setPassword('');
          }} 
          className="text-sm text-slate-500 hover:text-red-500 flex items-center gap-1"
        >
          <EyeOff className="h-4 w-4" /> Logg ut
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-bold text-slate-700">Pasient</th>
                <th className="p-4 font-bold text-slate-700">Tidspunkt</th>
                <th className="p-4 font-bold text-slate-700">Kontakt</th>
                <th className="p-4 font-bold text-slate-700">Beskrivelse</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500 italic">Ingen registrerte avtaler ennå.</td>
                </tr>
              ) : (
                appointments.map((app) => (
                  <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{app.name}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center bg-slate-100 text-slate-700 rounded-lg px-2 py-1.5 min-w-[50px]">
                          <span className="text-xl font-black leading-none">{new Date(app.date).getDate()}</span>
                          <span className="text-[10px] font-bold uppercase tracking-tight">{new Date(app.date).toLocaleDateString('nb-NO', { month: 'short' }).replace('.', '')}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(app.date).toLocaleDateString('nb-NO', { weekday: 'short' })}</span>
                          <span className="text-sm font-bold text-primary-500">Kl. {app.time.substring(0, 5)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col text-sm">
                        <span className="flex items-center gap-1 text-slate-600"><Mail className="h-3 w-3" /> {app.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-600 max-w-xs truncate" title={app.message}>{app.message || '-'}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Komponent for Kalender-container med bryter ---
export function CalendarView() {
  const [subView, setSubView] = useState<'public' | 'doctor'>('public');

  useEffect(() => {
    const handleHashChange = () => {
      const fullHash = window.location.hash.replace('#', '');
      const parts = fullHash.split('#');
      
      if (parts[0] === 'calendar' && parts[1]) {
        if (parts[1] === 'public' || parts[1] === 'doctor') {
          setSubView(parts[1] as 'public' | 'doctor');
        }
      }
    };

    // Sjekk ved mount
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSubViewChange = (view: 'public' | 'doctor') => {
    setSubView(view);
    window.location.hash = `calendar#${view}`;
  };

  return (
    <div className="pt-8 pb-20">
      <div className="max-w-4xl mx-auto px-6 mb-8">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center shadow-inner">
          <button 
            onClick={() => handleSubViewChange('public')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
              subView === 'public' 
                ? 'bg-white text-primary-500 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Eye className="h-5 w-5" /> Offentlig Kalender
          </button>
          <button 
            onClick={() => handleSubViewChange('doctor')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
              subView === 'doctor' 
                ? 'bg-white text-primary-500 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShieldCheck className="h-5 w-5" /> Lege-oversikt
          </button>
        </div>
      </div>
      <motion.div
        key={subView}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {subView === 'public' ? <PublicCalendar /> : <DoctorCalendar />}
      </motion.div>
    </div>
  );
}
