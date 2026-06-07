# Capital Atelier

Ein moderner, hochkant spielbarer Mobile-Prototyp fuer ein minimalistisches
Wirtschaftsspiel. Die App fuehlt sich bewusst wie eine hochwertige Finanz-App
an: klare Typografie, runde Karten, dezente Farben, weiche Schatten und ein
erwachsener Look ohne Comic-Stil.

## Starten

Die App ist dependency-frei und kann als statische Website gestartet werden:

```bash
python3 -m http.server 8080
```

Danach im Browser oeffnen:

```text
http://localhost:8080
```

## Enthaltene Features

- Fuenf Mobile-Tabs: Aktien, Immobilien, ETFs, Shop und Profil.
- Zwei Waehrungen: Euro und Diamanten mit minimalistischen Wallet-Icons.
- Erweitertes Aktienuniversum, ETFs und rundenbasierte Marktbewegungen mit
  Crash-Runden.
- Auto-Trader mit ein- und ausschaltbaren Regeln fuer Prozent- und
  Preisbedingungen.
- Premium-Modus mit hoeherem Limit fuer aktive Auto-Trader-Regeln.
- Optionale Browser-Push-Benachrichtigungen plus kompakte In-App-Toasts im
  Handybildschirm.
- Immobilien kaufen, vermieten, upgraden und mit Farben versehen; Miete kann
  pro Runde nur einmal eingezogen werden.
- Seltenheits-System: Standard, Erweitert, Exklusiv, Elite, Limitierte Edition
  und Ultra-Limitierte Edition.
- Shop-Kategorien fuer Boosts, Schutz, Kosmetik, limitierte Items,
  Avatar-Shop und Design-Editionen.
- Dynamische Shop-Preise fuer Euro-, Diamant- und Echtgeld-Angebote.
- Minimalistischer Avatar mit kosmetischen Boni.
- Design-Editionen wie Midnight, Ice, Carbon, Pinkwave, Minimal und Neon.
- Schwererer Battle Pass mit 50 Leveln, steigenden XP-Anforderungen,
  XP-Fortschritt und sichtbarer naechster Diamant-Belohnung.
- Online-System-Prototyp fuer Geld senden, Item-Tausch, riskante Coups,
  simulierte Gegner, Clan-Boni, Meetup-Verbindung und Rangliste.

Der Spielstand wird lokal im Browser gespeichert.
