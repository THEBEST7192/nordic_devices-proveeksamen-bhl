# Nettside-Mal

En mal/template for å bygge moderne nettsider med React, TypeScript og Tailwind CSS v4. Dette er en generell mal basert på [Katta-Helse](https://github.com/THEBEST7192/Katta-Helse) - som ble opprinnelig utviklet for en halvårs vurderingsoppgave.

## Funksjoner

- **Moderne brukergrensesnitt**: Rent og responsivt design med tilpassbar fargeprofil.
- **Timebestilling**: Fullstack-system for reservasjon av avtaler/bookinger.
- **Kalender-visninger**: Offentlig oversikt og passordbeskyttet admin-oversikt.
- **Åpningstider**: Oversiktlig visning av tilgjengelighet.
- **Sosial medier-integrasjon**: Enkel tilgang via QR-koder.
- **Interaktivt kart**: Informasjon om lokasjon og kontaktinformasjon.

## Teknologier

- **Frontend**: Vite, React, TypeScript, Tailwind CSS v4, Framer Motion, Lucide React.
- **Backend**: Node.js, Express, PostgreSQL, Cors, Dotenv.

## Kom i gang

### Forutsetninger

- Node.js installert
- En PostgreSQL-database (f.eks. via Supabase, Render, eller lokalt)

### Oppsett av Backend

1. Gå til server-mappen:
   ```bash
   cd server
   ```
2. Installer avhengigheter:
   ```bash
   npm install
   ```
3. Konfigurer miljøvariabler:
   - Endre navn på `.env.example` til `.env`
   - Oppdater `DATABASE_URL` med din PostgreSQL-tilkoblingsstreng.
   - For å generere krypteringsnøkkel kan du bruke `openssl rand -base64 32` (kan kjøres i WSL) og lagre verdien i `MESSAGE_ENCRYPTION_KEY`.
   - Valgfritt: sett `RESERVATION_RETENTION_DAYS` for hvor lenge gamle reservasjoner lagres (standard: `1` dag).
     - `0` = slett umiddelbart dagen etter behandling.
     - `1` = behold i 1 dag.
     - `30` = behold i en måned.
   - Standard port er `6767`.
4. Opprett en lege i databasen:
   - Siden systemet ikke har en offentlig registreringsside, må den første legen legges til manuelt i `doctors`-tabellen.
   - Passordet må hashes med bcrypt.
5. Start serveren:
   ```bash
   npm run dev
   ```

### Oppsett av Frontend

1. Gå tilbake til rotmappen:
   ```bash
   cd ..
   ```
2. Installer avhengigheter:
   ```bash
   npm install
   ```
3. Start utviklingsserveren:
   ```bash
   npm run dev
   ```
4. Åpne nettleseren på adressen oppgitt av Vite (vanligvis `http://localhost:8001`).

Du kan endre porten ved å lage en `.env`-fil i rotmappen og sette `PORT=din_port`.

## Prosjektstruktur

- `/src`: Kildekode for React frontend.
- `/server`: Node.js backend med API-endepunkter og databaselogikk.
- `/public`: Statiske filer som logo og Snapchat QR-kode.
