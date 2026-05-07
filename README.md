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

### Forutsetninger og Installasjon

**For lokal utvikling:**
- Node.js installert
- En PostgreSQL-database (f.eks. via Supabase, Render, eller lokalt)

**For Docker:**
```bash
# Installer avhengigheter på Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose nodejs npm
```

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

## Docker Deploying

### Forutsetninger

- Docker og Docker Compose installert

### Docker Compose

**1. Opprett `.env` fil:**
```bash
cp .env.docker.example .env
```

**2. Konfigurer miljøvariabler:**
```bash
# PÅKREVD: Database passord
DB_PASSWORD=ditt_sikre_passord_her

# PÅKREVD: Krypteringsnøkkel
MESSAGE_ENCRYPTION_KEY=din_base64_nøkkel_her

# Valgfritt: Data retention dager
RESERVATION_RETENTION_DAYS=1
```

**Generer krypteringsnøkkel (32-byte base64):**
```bash
# Linux/macOS/WSL:
openssl rand -base64 32

# Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**3. Start applikasjonen:**
```bash
docker-compose up -d
```

**Tilgang:**
- Frontend: `http://localhost:8001`
- Backend: `http://localhost:6767`

---

### Miljøvariabler

**VIKTIG:** Miljøvariabler skal IKKE bakes inn i Docker-image. De settes når container startes.

#### PÅKREDEDE variabler:
- `DB_PASSWORD` - Database passord
- `MESSAGE_ENCRYPTION_KEY` - Base64 krypteringsnøkkel (32 bytes)

#### VALGFRIE variabler:
- `RESERVATION_RETENTION_DAYS` - Dager for å beholde reservasjoner (default: 1)

---

#### Eksempel `.env` fil:

```bash
# PÅKREVD: Database passord
DB_PASSWORD=ditt_sterke_passord_her

# PÅKREVD: Krypteringsnøkkel (generert med: openssl rand -base64 32)
MESSAGE_ENCRYPTION_KEY=din_base64_krypteringsnøkkel_her

# Data retention (brukes av både frontend og backend)
RESERVATION_RETENTION_DAYS=1

# Frontend API URL
VITE_API_URL=http://localhost:6767
```

### Database Oppsett

**Automatisk initialisering:**
- Database opprettes automatisk ved første oppstart via `server/index.js`
- Tabeller blir opprettet automatisk når Docker container starter

### Opprette Første Lege

Systemet har ingen registreringsside, så første lege må opprettes manuelt:

**Metode 1: Docker (anbefalt)**
```bash
cd server
node create-doctor-docker.js
# Følg promptene for brukernavn og passord
```

**Metode 2: Lokal utvikling**
```bash
cd server
node create-doctor.js
# Følg promptene for brukernavn og passord
```

**Metode 3: Manuelt i database**
```sql
INSERT INTO doctors (username, password_hash) 
VALUES ('lege1', '$2b$10$...');
```
Bruk `bcrypt.hash('dittsikrepassord123', 10)` for å generere hash.

Eller bruk HeidiSQL eller et annet databaseverktøy for å opprette en lege manuelt.

### Docker Compose Konfigurasjon

Docker Compose setter opp:
- **PostgreSQL Database**: Kjører på port 5432
- **Backend Service**: Node.js API på port 6767
- **Frontend Service**: React app på port 8001
- **Automatisk helsesjekk**: Sikrer at tjenester er klare før oppstart
- **Data persistens**: Database data lagres i Docker volume
- **Service avhengigheter**: Frontend venter på backend, backend venter på database

#### Opprydding og Sletting

**Stoppe og fjerne containere:**
```bash
# Stoppe og fjerne containere + nettverk
npm run docker:down

# Fjern containere og images uten å slette volumes
npm run docker:clean

# Fjerne containers, images OG slette volumes
npm run docker:clean:postgres
```

### Annet
Hvis du trenger å se logger fra tjenester bruk følgende kommando:

```bash
npm run docker:logs
```

### Produksjonsdeployering

For produksjon:
1. Endre `ALLOWED_ORIGINS` til ditt domene
2. Bruk sterke passord for database
3. Sett opp reverse proxy (nginx/traefik)
4. Konfigurer SSL/TLS
5. Sett opp backup for database

## Prosjektstruktur

- `/src`: Kildekode for React frontend.
- `/server`: Node.js backend med API-endepunkter og databaselogikk.
- `/public`: Statiske filer som logo og Snapchat QR-kode.
- `Dockerfile`: Multi-stage build for produksjon.
- `docker-compose.yml`: Komplett oppsett med database.
- `.dockerignore`: Optimaliserer Docker build.
