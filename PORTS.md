# Portkonfigurasjon

Dette dokumentet lister alle porter som brukes av applikasjonen i ulike miljøer.

## Utviklingsmiljø

### Tjenester
| Tjeneste | Containerport | Host Port | Beskrivelse |
|----------|---------------|-----------|-------------|
| Frontend (Vite) | 5173 | 5173 | React utviklingsserver med HMR |
| Backend (Express) | 6767 | 6768 | Node.js API-server med nodemon |
| Database (MySQL) | 3306 | 3307 | MySQL databaseserver |
| Cloudflare Tunnel | - | 2918 | Ekstern tilgangstunnel |

### Databasekonfigurasjon
- **Databasenavn**: `nordic_devices_proveeksamen_dev`
- **Standardbruker**: `not_root`
- **Tilkobling**: `localhost:3307/nordic_devices_proveeksamen_dev`

### Tilgangs-URLer
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:6768
- **Database**: localhost:3307
- **Cloudflare Tunnel**: localhost:2918

## Produksjonsmiljø

### Tjenester
| Tjeneste | Containerport | Host Port | Beskrivelse |
|----------|---------------|-----------|-------------|
| Frontend (Nginx) | 80 | 8001 | Statisk React-build servert av Nginx |
| Backend (Express) | 6767 | 6767 | Node.js API-server |
| Database (MySQL) | 3306 | 3306 | MySQL databaseserver |
| Cloudflare Tunnel | - | 2917 | Ekstern tilgangstunnel |

### Databasekonfigurasjon
- **Databasenavn**: `nordic_devices_proveeksamen`
- **Standardbruker**: `not_root`
- **Tilkobling**: `localhost:3306/nordic_devices_proveeksamen`

### Tilgangs-URLer
- **Frontend**: http://localhost:8001
- **Backend API**: http://localhost:6767
- **Database**: localhost:3306
- **Cloudflare Tunnel**: localhost:2917

## Docker-nettverk

### Utvikling
- **Nettverk**: `nordic_devices-proveeksamen-bhl-dev-network`
- **Intern kommunikasjon**: Tjenester kommuniserer ved bruk av containerporter

### Produksjon  
- **Nettverk**: `nordic_devices-proveeksamen-bhl-network`
- **Intern kommunikasjon**: Tjenester kommuniserer ved bruk av containerporter


## Unngå portkonflikter

Utviklings- og produksjonsmiljøer bruker forskjellige porter for å unngå konflikter:

- **Frontend**: Utvikling (5173) vs Prod (8001)
- **Backend**: Utvikling (6768) vs Prod (6767)
- **Database**: Utvikling (3307) vs Prod (3306)
- **Cloudflare Tunnel**: Utvikling (2918) vs Prod (2917)