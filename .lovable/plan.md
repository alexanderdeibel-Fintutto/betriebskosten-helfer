
# Fintutto Nebenkosten - Nebenkostenabrechnungs-App

## Übersicht
Eine vollständige Webanwendung für Nebenkostenabrechnungen nach deutschem Recht (BetrKV) mit 8-Schritt Wizard, Stammdatenverwaltung und PDF-Generierung.

---

## Design System

### Farben
- **Primär**: #F97316 (Orange) - Hauptaktionen, Buttons
- **Akzent**: #4F46E5 (Indigo) - Sekundäre Elemente, Links
- **Erfolg**: #10B981 (Grün) - Guthaben-Anzeige
- **Gefahr**: #EF4444 (Rot) - Nachzahlung-Anzeige

### Layout
- Responsives Design mit Sidebar-Navigation
- Wizard mit visueller Fortschrittsanzeige (Stepper)
- Cards mit abgerundeten Ecken und Schatten
- Deutsche Sprache durchgehend (formelle Anrede "Sie")

---

## Authentifizierung
- Login/Registrierung mit E-Mail und Passwort
- Passwort-Zurücksetzen Funktion
- Geschützter Zugriff auf alle Abrechnungsdaten
- Benutzer-Profile für Kontaktdaten

---

## Stammdaten-Verwaltung

### Gebäude-Verwaltung
- Liste aller Gebäude mit Adresse und Einheiten
- Anlegen, Bearbeiten, Löschen von Gebäuden
- Zuordnung von Wohneinheiten mit Fläche und Merkmalen

### Mieter-Verwaltung
- Mieterstammdaten (Name, Kontakt, Bankverbindung)
- Übersicht aller Mieter pro Gebäude

### Mietvertrag-Verwaltung
- Zuordnung Mieter → Wohneinheit
- Vertragszeitraum (Von-Bis)
- Monatliche Vorauszahlungen für Nebenkosten
- Personen im Haushalt (für Personenschlüssel)

---

## 8-Schritt Nebenkostenabrechnung Wizard

### Schritt 1: Objekt & Zeitraum
- Auswahl des Gebäudes (Dropdown)
- Abrechnungszeitraum festlegen (Datum Von-Bis)
- Validierung: Maximal 12 Monate

### Schritt 2: Mietverträge auswählen
- Tabelle aller relevanten Mietverträge im Zeitraum
- Checkboxen zur Auswahl
- Bei Mieterwechsel: Anteilige Zeiträume berechnen
- Anzeige der Bewohnungsdauer

### Schritt 3: Betriebskosten erfassen
- Accordion mit allen 17 BetrKV-Kategorien:
  1. Laufende öffentliche Lasten
  2. Wasserversorgung
  3. Entwässerung
  4. Heizung (zentral)
  5. Warmwasser (zentral)
  6. Aufzug
  7. Straßenreinigung und Müllabfuhr
  8. Gebäudereinigung
  9. Gartenpflege
  10. Beleuchtung
  11. Schornsteinreinigung
  12. Versicherungen
  13. Hauswart
  14. Gemeinschafts-Antennenanlage/Kabel
  15. Wascheinrichtungen
  16. Sonstige Betriebskosten
  17. (Reserve)

- Pro Kategorie:
  - Gesamtbetrag eingeben
  - Umlageschlüssel wählen (Fläche, Personen, Einheiten, Verbrauch, Direkt)
  - Optional: Belege hochladen

### Schritt 4: Direktkosten zuordnen
- Mieter-spezifische Einzelkosten
- Direkte Zuordnung zu bestimmten Mietern
- Beispiele: Schlüsseldienst, individuelle Reparaturen

### Schritt 5: Heizkostenabrechnung
- Gesamte Heizkosten eingeben
- Aufteilungsschlüssel wählen:
  - 30% Fläche / 70% Verbrauch (Standard)
  - 50% / 50%
  - 40% / 60%
- Zählerstände pro Einheit erfassen
- Grundkosten vs. Verbrauchskosten Berechnung

### Schritt 6: Ergebnisse prüfen
- Übersichtstabelle pro Mieter:
  - Name und Wohneinheit
  - Geleistete Vorauszahlungen
  - Berechneter Kostenanteil
  - Saldo (Guthaben/Nachzahlung)
- Farbliche Hervorhebung:
  - Grün = Guthaben (Rückzahlung an Mieter)
  - Rot = Nachzahlung (Mieter schuldet)
- Detailansicht pro Mieter möglich

### Schritt 7: Vorschau & Prüfung
- PDF-Vorschau der fertigen Abrechnung
- Rechtliche Checkliste:
  - ✓ Abrechnungszeitraum korrekt
  - ✓ Alle Kostenarten umlagefähig
  - ✓ Umlageschlüssel nachvollziehbar
  - ✓ Vorauszahlungen verrechnet
- Bearbeitungsmöglichkeit vor Finalisierung

### Schritt 8: Versand
- Versandoptionen pro Mieter:
  - E-Mail mit PDF-Anhang
  - PDF-Download für Postversand
  - Direkt drucken
- Versandhistorie speichern
- Abrechnung als "Versendet" markieren

---

## Datenbank-Struktur (Supabase)

### Tabellen
- **profiles** - Benutzerprofile
- **user_roles** - Berechtigungen (admin, user)
- **buildings** - Gebäude mit Adresse
- **units** - Wohneinheiten pro Gebäude
- **tenants** - Mieterstammdaten
- **leases** - Mietverträge
- **operating_costs** - Hauptabrechnungen
- **operating_cost_items** - Einzelne Kostenpositionen
- **operating_cost_results** - Berechnete Ergebnisse pro Mieter
- **meter_readings** - Zählerstände

### Sicherheit
- Row-Level Security für alle Tabellen
- Benutzer sehen nur eigene Daten
- Admin-Rolle für erweiterte Funktionen

---

## PDF-Generierung (Edge Function)
- Professionelles Abrechnungslayout
- Firmenkopf mit Logo
- Detaillierte Kostenaufstellung
- Rechtlich konforme Darstellung
- Download als PDF-Datei

---

## Hauptansichten
1. **Dashboard** - Übersicht offener Abrechnungen
2. **Abrechnungen** - Liste mit Status und Filterung
3. **Gebäude** - Stammdatenverwaltung
4. **Mieter** - Stammdatenverwaltung
5. **Einstellungen** - Profil und Firmendaten
