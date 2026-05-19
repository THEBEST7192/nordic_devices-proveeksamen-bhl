import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy = ({ onBack }: PrivacyPolicyProps) => {
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary-500 font-bold hover:text-primary-600 transition-all mb-8 group active:scale-95"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          Tilbake til forsiden
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-slate max-w-none"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary-50 rounded-2xl">
              <ShieldCheck className="h-8 w-8 text-primary-500" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 m-0">Personvernerklæring</h1>
          </div>

          <p className="text-xl text-slate-600 leading-relaxed mb-12 italic">
            Sist oppdatert: 19. mai 2026
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introduksjon</h2>
            <p className="text-slate-700 leading-relaxed">
              Nordic Devices AS ("vi", "oss", eller "vår") er forpliktet til å beskytte ditt personvern. 
              Denne personvernerklæringen forklarer hvordan vi samler inn, bruker og sikrer din informasjon 
              når du besøker vår nettside og bruker våre tjenester.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Informasjon vi samler inn</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Vi samler kun inn informasjon som er nødvendig for å levere våre tjenester til deg:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li><strong>Kontaktinformasjon:</strong> Navn, e-postadresse og telefonnummer når du fyller ut vårt kontaktskjema.</li>
              <li><strong>Betalingsinformasjon:</strong> Informasjon nødvendig for å gjennomføre transaksjoner ved kjøp av varer.</li>
              <li><strong>Meldinger:</strong> Informasjon du velger å dele med oss i meldingsfeltet i kontaktskjemaet.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Hvordan vi bruker din informasjon</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Dine data brukes utelukkende til følgende formål:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li>For å svare på dine henvendelser og forespørsler.</li>
              <li>For å behandle bestillinger og betalinger av varer og tjenester.</li>
              <li>For å administrere og forbedre våre tjenester og nettside.</li>
              <li>For å overholde juridiske forpliktelser, inkludert bokføringsloven.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Dine rettigheter</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              I samsvar med personvernforordningen (GDPR) har du rett til å:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li>Be om innsyn i personopplysningene vi har lagret om deg.</li>
              <li>Be om korrigering eller sletting av dine personopplysninger.</li>
              <li>Trekke tilbake ditt samtykke til behandling av data når som helst.</li>
            </ul>
            <p className="mt-6 text-slate-700 font-semibold">
              Kontakt oss på post@nordicdevices.no for å utøve dine rettigheter.
            </p>
          </section>

          <div className="pt-8 border-t border-slate-100 text-slate-500 text-sm italic">
            Dette er en demoside for eksamen. I en ekte produksjonssetting ville denne erklæringen vært juridisk bindende og tilpasset selskapets faktiske databehandling.
          </div>
        </motion.div>
      </div>
    </div>
  );
};
