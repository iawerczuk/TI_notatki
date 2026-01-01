
# Notes API – notatki, tagi i wyszukiwanie

Aplikacja realizująca prosty notatnik z możliwością tagowania notatek oraz wyszukiwania po tytule i treści (LIKE).

---

## Technologia

- **Backend:** Node.js (Express)
- **Baza danych:** SQLite
- **Interfejs:** katalog `public/`

---

## Uruchomienie

1. Zainstaluj zależności:
   ```bash
   npm install

```

2. Uruchom serwer:
```bash
node server.js

```

3. Adres aplikacji: [http://localhost:5050](https://www.google.com/search?q=http://localhost:5050)

## Zakres funkcjonalny

### Notatki

* Dodawanie notatek (`title`, `body`, `created_at`).
* Wyświetlanie listy wszystkich notatek.
* Wyszukiwanie frazy w tytule lub treści (`q`).

### Tagi

* Zarządzanie słownikiem tagów.
* Przypisywanie wielu tagów do jednej notatki (relacja wiele-do-wielu).
* Zapewnienie unikalności przypisania taga do danej notatki.

## Model danych

* `notes(id, title, body, created_at)`
* `tags(id, name UNIQUE)`
* `note_tags(note_id → notes.id, tag_id → tags.id)`


## API

* `GET /api/notes?q=...` – lista notatek z opcjonalnym wyszukiwaniem.
* `GET /api/notes?tag=work` – filtrowanie notatek po konkretnym tagu.
* `POST /api/notes` – utworzenie nowej notatki.
* `POST /api/notes/{id}/tags` – przypisanie zestawu tagów do notatki.
* `GET /api/tags` – pobranie listy dostępnych tagów.

## Walidacja i statusy HTTP

* **201 Created** – poprawne utworzenie zasobu.
* **200 OK** – poprawna operacja.
* **400 Bad Request** – błędne dane wejściowe.
* **404 Not Found** – zasób nie istnieje.
* **500 Internal Server Error** – błąd serwera.

## Bezpieczeństwo

* Nagłówek `X-Content-Type-Options: nosniff`.
* Nagłówek `Referrer-Policy: no-referrer`.
* Nagłówek `Cache-Control: no-store` dla endpointów API.
* Wyłączony nagłówek `X-Powered-By`.


## Testowanie

Plik `tests.rest` zawiera przygotowane przykłady wywołań wszystkich endpointów API. Testy zostały przeprowadzone przy użyciu rozszerzenia **REST Client** dla Visual Studio Code.

```
