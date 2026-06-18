<div align="center">
  <img src="./public/logo.png" width="200" alt="Atlas Logo" />
  <br/><br/>
  <h1>🪐 Atlas – LocalDB Panel</h1>
  <p><b>Nowoczesny, w pełni dostosowywalny interfejs graficzny do zarządzania lokalnymi bazami danych.</b></p>

  <p>
    <a href="#"><img src="https://img.shields.io/badge/Darmowy-Open_Source-success?style=for-the-badge&logo=github" alt="Open Source" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Technologia-Next.js_16-black?style=for-the-badge&logo=next.js" alt="Next.js"></a>
    <a href="#"><img src="https://img.shields.io/badge/Środowisko-Docker-blue?style=for-the-badge&logo=docker" alt="Docker"></a>
  </p>
</div>

---

## 📖 Czym jest Atlas?
**Atlas** to potężny, webowy panel administracyjny typu CRUD, służący do monitorowania, przeglądania i edytowania relacyjnych struktur bazodanowych. Został zaprojektowany z naciskiem na **szybkość (Next.js Turbopack)**, **bezpieczeństwo** oraz **zaawansowaną personalizację wyglądu**. 

Projekt narodził się jako niezależna inicjatywa – jest w **100% Darmowy, Open Source (Otwartoźródłowy)** i może być przez każdego rozwidlany (forkowany) oraz modyfikowany do własnych potrzeb komercyjnych bądź prywatnych. Nie ma tu ukrytych płatności ratunkowych ani funkcji premium!

<p align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</p>

## 🗄️ Obsługiwane Typy Baz Danych

Obecnie panel współpracuje głównie z dedykowanym formacie:
- 🟢 **LocalDB (Wbudowana)** – Natywny system plikowy naśladujący relacyjne środowiska SQL. Dane układane są pod spodem w wysoce zoptymalizowane struktury na serwerze node'owym.

Dzięki otwartej architekturze API, panel jest przystosowany jako interfejs zastępczy tzw. *Data Agnostic*. W najbliższym czasie (patrz: **Roadmapa**) przewidziana jest natywna integracja dla sterowników:
- ⏳ *SQLite, PostgreSQL, MySQL / MariaDB.*

---

## ✨ Kluczowe Funkcjonalności

- 📊 **Zaawansowany Dashboard** – Widgety ze statystykami online, pingiem, wagą rozmiarów baz czy tablicami obiektów.
- 🎨 **Bogaty System Motywów (THEMES)** – 19 wbudowanych responsywnych motywów (od Cyberpunk Black, przez Atlas Dark, aż po śnieżnobiały Monochrome Light). Perfekcyjna interpolacja kolorów Hover, zapobieganie błyskaniu przy odświeżaniu *(Anti-FOUC zoptymalizowane na poziomie SSR)*.
- ⚡ **Konsola SQL na Żywo** – Parser wychwytujący na żywo SELECT, INSERT, UPDATE oraz ALTER TABLE. Obsługuje transakcyjność i składnię.
- 🛡️ **Blokada Read-Only** – Twardy przełącznik na poziomie proxy blokujący jakiekolwiek edycje (Idealny tryb dla bezpiecznych demonstracji).
- 📦 **Import i Eksport (I/O)** – Importuj arkusze z plików i eksportuj struktury lokalne do formatu .json i .csv.
- 🌓 **Kompaktowy Interfejs** – Tryb zagęszczenia wierszy ułatwiający obsługę przy dużej ilości rekordów.

<p align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</p>

## 🛠️ Informacje Techniczne (Tech Stack)

Panel to zaawansowana aplikacja architektoniczna, budowana zgodnie z najnowszymi standardami:
*   **Framework Core:** Next.js (wariant *App Router* z kompilatorem Turbopack).
*   **Interfejs i Warstwa Wizualna:** React 19 + Tailwind CSS. System dynamicznych rzutowań zmiennych CSS (brak migania pomiędzy przejściami w locie).
*   **Warstwa Integracji:** Własne API wpięte w ścieżkę Next.js (/api/databases, /api/sql, /api/tables). Narzędzia natywnego Node'a (s/promises) do obróbki atomowej.
*   **Ikony:** Lucide React Icons.

---

## 🚀 Instalacja i Uruchomienie

Uruchomienie projektu jest maksymalnie uproszczone dzięki wstępnie skonfigurowanemu środowisku kontenerowemu. Wymagany jest na maszynie jedynie GIT i środowisko [Docker Desktop](https://www.docker.com/).

### Sposób 1 - Docker (Zalecany)
Najlepszy do wdrożenia na produkcję i szybkiej pracy:

1. Klonowanie repozytorium:
   \\\ash
   git clone https://github.com/WesleyJRFX/Atlas---Local-Database.git
   cd Atlas---Local-Database
   \\\
2. Budowanie i start kontenerów:
   \\\ash
   docker compose build
   docker compose up -d
   \\\
3. Panel jest gotowy do użytku w przeglądarce pod adresem: **http://localhost:3000**

### Sposób 2 - Instalacja Lokalna (Node.js)
Jeżeli zależy Ci na szybkiej developerskiej edycji modułów TypeScript bez Dockera:

1. Upewnij się, że używasz Node.js (min. v20+).
   \\\ash
   npm install
   npm run dev
   \\\
2. Panel dla środowiska deweloperskiego będzie dostępny na: **http://localhost:3000**

<p align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</p>

## 🗺️ Roadmapa (Plany Rozwoju)

Atlas został zaprojektowany z myślą o stałej integracji i rosnącej potędze. Poniżej znajduje się oficjalna lista planowanych funkcjonalności (którą będziemy tu wdrażać):

### 🎯 Faza 1: Stabilizacja (Obecna - Zakończona)
- ✅ Podstawy systemu File-Based DB
- ✅ Zoptymalizowane i płynne UI z obsługą motywów i SSR
- ✅ Narzędzia szybkiego operowania: SQL Console, CSV Export/Import

### 🎯 Faza 2: Multi-Silniki i Schematy (Wkrótce)
- ⏳ **Wielosilnikowość (Drivers):** Bezpośrednie proxy na połączenia via sterowniki do silników np. Postgres, SQLite.
- ⏳ **Graficzny kreator relacji baz (ERD):** Narzędzie typu "przeciągnij i upuść", graficznie wizualizujące powiązania Keys (Primary / Foreign) niczym na pełnych schematach architektonicznych.
- ⏳ **Rozszerzona Konsola SQL:** System autouzupełniania komend (Autocomplete / Intellisense) dla nazw tabel i kolumn w bazie.

### 🎯 Faza 3: Praca Zespołowa i Usługi Sieciowe
- ⏳ **Autoryzacja RBAC:** System uwierzytelniania w panelu, pozwalający wyznaczać role administracyjne (Viewer, Editor, Admin).
- ⏳ **Webhooks i zdarzenia triggerowe:** Odpalanie zewnętrznych powiadomień API przy update/kasowaniu danych wrażliwych.
- ⏳ **Automatyczne kopie zapasowe (Cron):** Synchronizacja baz do chmury / AWS S3 według harmonogramu dziennego.

### 🎯 Faza 4: Rewolucja AI
- ⏳ **AI SQL Query Builder:** Wbudowany Asystent językowy do zamiany ludzkich zdań na skomplikowane i bezpieczne zapytania bazy po strukturze relacyjnej.

---

> Wykorzystaj moc Atlasa w tworzeniu fantastycznych rozwiązań bazodanowych. Jesteś programistą chcącym coś ulepszyć? Pull requesty i Issue tickety są mile widziane! 🌟