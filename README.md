# Corona Inzidenze Widget für iOS (Scriptable)

[![build](https://github.com/TiborAdk/corona-widget-ts/actions/workflows/main.yml/badge.svg)](https://github.com/TiborAdk/corona-widget-ts/actions/workflows/main.yml)

Port des ursprünglichen Widgets nach typescript.

Widget zeigt die Inzidenz tägli. neue Fälle sowie den Verlauf für 21 Tage (Inzidenz/ neue Fälle) an. Basierend auf den
Daten des Robert-Koch-Instituts.

Mein ursprüngliches Repository (js): [TiborAdk/corona-widget](https://github.com/TiborAdk/corona-widget)

Ursprüngliches repository
von [rphl](https://github.com/rphl): [rphl/corona-widget](https://github.com/rphl/corona-widget)

# Features

* **Live Inzidenz** + **Trend** für Stadt/Kreis, Bundesland, Bund
* **Neue tägliche Fälle** für Stadt/Kreis, Bundesland, Bund
* Bis zu 28 Tage Diagram für **Inzidenz** js Stadt/Kreis, Bundesland, Bund
* 7 Tage Schätzwert für **Reproduktionszahl (R)**
* iCloud Sync
* Automatischer OfflineModus (📡 = Kein GPS ⚡️ = Kein Internet)
* Dark/Lighmode unterstützung

![Übersicht]()

# Quelle/Datenbasis

* Das Widget basiert auf der offiziellen Api des RKI. https://npgeo-corona-npgeo-de.hub.arcgis.com/ \
*Lizenz: Robert Koch-Institut (RKI), [dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0)*
* Die bereitgestellten Daten können in bestimmten Regionen aufgrund von Meldeverzögerungen durch Ämter an das RKI (Api)
  erst verzögert (Stunden-Tage) im Widget angezeigt werden.
* Für die Historie werden ausschließlich Daten aus der Api verwendet. Somit können sich aufgrund von
  Verzögerungen/Aktualisierungen Werte wie Inzidenzen, neuen Fälle, etc. immer ändern.

# Installation/Update

**Manuell**

* Safari öffnen: https://raw.githubusercontent.com/TiborAdk/corona-widget-ts/master/built/incidence.js
* Skripttext kopieren
* Scriptable öffnen, kopierten Skripttext als neues Scriptablescript einfügen oder altes ersetzen.

# Konfiguration

* Daten werden Standardmäßig unter **Dateien (App)** > **iCloud** > **Scriptable** > **corona_widget_ts** > *.json
  zwischengespeichert.
* Die allgemeine Konfiguration erfolgt über die Date **config.json**.\
  (Falls die Datei nicht existiert werden die Standardwerte aus dem Repository geladen und in der Datei **config.json**
  gespeichert)

![WidgetParameter]()

# Statische Standortkoordinaten

Das Widget erkennt automatisch den Standort. Es ist jedoch, möglich den Standort fest zu setzten. Die Koordinaten können
z.B. über die Karten App ermittelt werden.

Format: `[STANDORT[;STANDORT]...]`

* `STANDORT`: `POS[,LAT,LON][,NAME]`
* `POS`: Position im Widget. z.B.: 0 = erster Standort, 1= zweiter Standort.
* `LAT`: _(optional)_ Breitengrad. z.B.: 52.022 _(NICHT 52,022 - Kein Komma!)_
* `LON`: _(optional*)_ Längengrad. z.B.: 8.523 _(NICHT 8,523 - Kein Komma!)_ \
  *Wenn `LAT` gesetzt ist muss auch `LON` gesetzt sein.*
* `NAME`: _(optional)_ Anzeigename für den Standort.

Dabei ist Folgendes zu beachten.

1. Wenn keine Parameter angegeben werden, wird der aktuelle Standort verwendet.
2. Bis zur größten Position (`POS`) müssen alle Positionen vorkommen außer die Position `0`.
3. Wenn `POS = 0` nicht angegeben ist, wird an ihrer Stelle der aktuelle Standort angezeigt.
4. Wenn bei einem `STANDORD` `LAT` und `LON` nicht gesetzt oder leer sind, wird die aktuelle Position verwendet.

**Beispiele**

* Aktueller Standort: ` ` (Parameter leer)
* Erster Standort statisch (SmallWidget): `0,52.022,8.522`
* Zweiter Standort ist statisch (MediumWidget): `1,52.022,8.522`
* Beide Standorte sind statisch (MediumWidget): `0,52.022,8.522;1,52.514,13.380`
* Nur zweiter Standort ist statisch (MediumWidget): `1,52.022,8.522`
* Eigener Name z.B "Home" für den ersten Standort: `0,52.022,8.522,Home`
* Eigener Name z.B "Work" für den zweiten Standort: `1,52.514,13.380,Work`

# Widgets

Es können drei verscheiden große Widgets angezeigt werden. Klein, Mittel und Groß. Ein kleines Widget kann Informationen
zu einem Standort anzeigen, das mittlere Widget für bis zu zwei und das große Widget für bis zu 6.

Wenn einem Widget über die Parameter mehr Standorte übergeben werden, als es anzeigen kann, werden diese verworfen.

## Klein (small)

![widget_small]()

Zeigt Informationen für einen Standort (Fest oder Aktuell), dessen Bundesland und Deutschland an.

Angezeigte Informationen:

* **R-Wert** für Deutschland
* **Inzidenz**, **kleinen Graph** und **neue Fälle** für Deutschland.
* **Inzidenz**, **kurzen Graph** und **neue Fälle** für den Standort.
* **Inzidenz**, **kleinen Graph** und **neue Fälle** für Bundesland in dem der Standort liegt.

## Mittel (medium)

![widget_medium]()

Kann Informationen für bis zu zwei Standorte, deren Bundesländer und Deutschland anzeigen.

Angezeigt Informationen:

* **R-Wert** für Deutschland
* **Inzidenz**, **langer Graph**, **neue Fälle**, **Impfquote*** für Deutschland.
* **Inzidenz**, **langer Graph** und **neue Fälle** für jeden den Standort.
* **Inzidenz**, **langer Graph**, **neue Fälle**, **Impfquote*** für bis zu zwei unterschiedliche Bundesland in dem die
  Standorte liegen.

(*: `CFG.vaccine.show = true`)

## Groß (large)

![widget_large]()

Kann Informationen für bis zu sechs Standorte, bis zu vier Bundesländer und Deutschland anzeigen. \
Als Bundesländer werden die ersten vier unterschiedlichen Bundesländer der Standorte genommen. Ausschlaggebend ist dabei
die Anzeigereihenfolge der Standorte.

Angezeigte Informationen:

* **R-Wert** für Deutschland
* **Inzidenz**, **langer Graph**, **neue Fälle**, **Impfquote*** für Deutschland.
* **Inzidenz**, **langer Graph**, **neue Fälle** für jeden den Standort.
* **Inzidenz**, **langer Graph**, **neue Fälle**, **Impfquote*** für bis zu vier unterschiedliche Bundesländer in dem
  die Standorte liegen.

(*: `CFG.vaccine.show = true`)

## Groß (large) alternativ

![widget_large_alternate]()
Kann Informationen für bis zu 8 Standorte und Bundesländer anzeigen. Alle Standorte eines Bundeslandes werden zusammen
mit dem jeweiligen Bundesland angezeigt. Falls der aktuelle Standort teil der Standorte ist, wird dieser immer als
erstes angezeigt, somit wird auch das Bundesland als erstes aufgeführt. Die Reihenfolge der Standorte richtet sich nach
der Reihenfolge in den übergebenen Parametern.

Angezeigte Informationen:

* **R-Wert** für Deutschland
* **Inzidenz**, **langer Graph**, **neue Fälle**, **Impfquote*** für Deutschland.
* **Inzidenz**, **langer Graph**, **neue Fälle** für jeden den Standort.
* **Inzidenz**, **langer Graph**, **neue Fälle**, **Impfquote*** und **Anzahl geimpfter*** für bis zu vier
  unterschiedliche Bundesländer in dem die Standorte liegen.

(*: `CFG.vaccine.show = true`)

# Erweiterte Konfiguration

Die Konfiguration erfolgt über die Date **config.json** im Ordner `iCloud/Scriptable/corona_widget_ts/`. Dort können,
falls nicht anders vermerkt, folgende Werte gesetzt werden.

# cache

## cache.maxAge

**Beschreibung**: Maximales Alter von gespeicherten Daten, damit diese als 'noch aktuell' angesehen werden und die Daten nicht erneut vom RKI geladen werden.\
**Werte**: `(0, ∞)` (Sekunden) \
**Standard**: `3600` (1h)

## graph

Konfiguration für die angezeigten Graphen.

### graph.maxShownDays

**Beschreibung**: Maximal angezeigte Werte pro Graph. \
**Werte**: `(7, ∞)` \
**Standard**: `28` \
*Die tatsächliche Anzahl angezeigter Werte kann geringer sein, da der Graph den zur verfügung stehenden Platz
berücksichtigt.*

### graph.upsideDown

**Beschreibung**: Graphen werden kopfüber angezeigt werden sollen. (0 oben und maximal Wert unten.) \
**Werte**: `true`|`false` \
**Standard**: `false`

## widget

Werte zur konfiguration des angezeigten Widgets.

### widget.refreshInterval

**Beschreibung**: Interval, indem das Widget aktualisiert wird. (In Sekunden) \
**Werte**: `(0, ∞)` \
**Standard** `3600` (1h)

### widget.openUrl

**Beschreibung**: Zu öffnende Url, wenn `CFG.widget.openUrlOnTap` = `true`. \
**Werte**: `Url`\
**Standard**: `https://experience.arcgis.com/experience/478220a4c454480e823b17327b2bf1d4` \
*Standardwert ist das Corona-Dashbor des RKIs.*

### widget.openUrlOnTap

**Beschreibung**: Kontrolliert, ob die Url in `CFG.widget.oenUrl`, beim Drücken auf das Widget geöffnet werden soll. \
**Werte**: `true`|`false` \
**Standard**: `false`

### widget.alternateLarge

**Beschreibung**: Aktiviert die Alternative Darstellung des großen Widgets (large)\
**Werte**: `true`|`false` \
**Standard**: `false` \
*Im großen Widget werden alle Städte, Landkreise, etc eines Bundeslandes zusammen mit dem Bundesland zusammengefasst
dargestellt. Hierbei könne bis zu 8 Zeilen, inklusive der Bundesländer angezeigt werden.*

## api

### api.csvRvalueField

**Beschreibung**: Array von möglichen Namen, des Feldes für den gesuchten R-Wert.\
**Werte**: `string[]` \
**Standard**: `['Schätzer_7_Tage_R_Wert', 'Punktschätzer des 7-Tage-R Wertes']`

## storage

**!!! Kann **nicht** über die Konfigurationsdatei eingestellt werden.** Gespeicherte änderungen werden beim Laden der
Konfiguration ignoriert.\
Einstellungen müssen direkt im Script über die Konstante `CFG` vorgenommen werden.\
Beispiel:

  ```javascript
  // incidence.js
const CFG = {
  storage: {
    directory: 'my_awesome_dir',
    fileStub: 'my_awesome_filestub',
  },
  ...
}
```

### storage.directory

**Beschreibung**: Ordner, in dem zwischengespeicherte Werte abgelegt werden. Wenn der Ordner nicht existiert, wird
dieser erstellt.\
**Werte**: `string` \
**Standard**: `'corona_widget_ts'` \
*Kann nicht über Konfigurationsdatei gesetzt werden. (Einstellungen über `CFG` im Script).*

### storage.fileStub

**Beschreibung**: \
**Werte**: `string` \
**Standard**: `coronaWidget_` \
*Kann nicht über Konfigurationsdatei gesetzt werden. (Einstellungen über `CFG` im Script).*

## state

### state.useShortName

**Beschreibung**: Kontrolliert, ob für Bundesländer standardmäßig die Abkürzung verwendet werden soll. \
**Werte**: `true`|`false` \
**Standard**: `false`

## incidence

### incidence.disableLive

**Beschreibung**: Standardmäßig wird der Inzidenzwert des aktuellen Tages aus den aktuellen Daten berechnet. Anstelle
dessen kann der Inzidenzwert der API angezeigt werden, sofern dieser ausgegeben wird.\
**Werte**: `true`|`false` \
**Standard**: `false`

## script

### script.autoUpdate

**Beschreibung**: Kontrolliert, ob das Script automatisch aktualisiert werden soll.\
**Werte**: `true`|`false` \
**Standard**: `true`

### script.autoUpdateInterval

**Beschreibung**: Abstand in Tagen, in dem das Script eine neue Version aus dem Repository laden soll.
**Werte**: `(0, ∞)` \
**Standard**: `1` (1 Tag)
