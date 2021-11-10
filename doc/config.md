# Corona-Widget erweiterte Konfiguration

Das Widget kann über die Datei `config.json` im Ordner des Widgets konfiguriert werden. Falls die Datei nicht existiert,
wird sie beim Ausführen des Widgets erstellt und mit einem leeren Objekt gefüllt.

Es müssen nur Werte eingetragen werden, die von den [Standardwerten](../config.json) abweichen.

# Speicherort

Die Datei befindet sich im selben Ordner, in dem auch die Daten für die Standorte zwischengespeichert werden.
Standardmäßig ist sie im Ordner `iCloudDrive/Scriptable/corona_widget_ts/` zu finden.

Die Datei kann zum Beispiel mit [Jayson](https://apps.apple.com/de/app/jayson/id1447750768) bearbeitet werden.

# Script

Einstellungen die das Script betreffen. Sie können nicht für einzelnen Widgets unterschiedlich gesetzt werden, sondern sind für jedes gleich.

```json
{
  "autoUpdate": true,
  "autoUpdateInterval": 2,
  "csvRvalueField": [
    "Schätzer_7_Tage_R_Wert",
    "Punktschätzer des 7-Tage-R Wertes"
  ],
  "geoCacheAccuracy": 2,
  "def": {  
    ...
  }
}
```

## autoUpdate

Bestimmt, ob das Script selbständig aktualisiert werden soll.

* `true` *(Standard)*: Aktiviert
* `false`: Deaktiviert

## autoUpdateInterval

Eine positive Zahl, die das Zeitintervall in Tagen bestimmt, in dem das Script versucht sich zu aktualisieren.

* Standard: `1` (1 Tag)

## geoCacheAccuracy

Bestimmt die Genauigkeit mit der GPS-Daten zwischengespeichert werden sollen.

* `0`: 111 Km
* `1`: 11,1 Km
* `2` *(Standard)*: 1,11 Km
* `3`: 111 m
* `4`: 11,1 m

# Globale Konfiguration von Widgets

Unter `def` können Standard Werte für Widgets gesetzt werden. Diese werden auf Widgets angewendet, sofern diese nicht von
der Konfiguration eines Widgets überschrieben werden.

Es müssen nur Werte eingetragen werden, die von den [Standardwerten](../config.json) abweichen.

```json
    "def": {
        "cacheMaxAge": 3600,
        "maxShownDays": 28,
        "graphUpsideDown": false,
        "graphShowIndex": "incidence",
        "stateUseShortName": true,
        "refreshInterval": 3600,
        "openUrlOnTap": false,
        "openUrl": "https://experience.arcgis.com/experience/478220a4c454480e823b17327b2bf1d4",
        "alternateLarge": false,
        "incidenceTrend": "day",
        "incidenceDisableLive": false,
        "showVaccine": true,
        "hideWidgetInfo": false,
    },
    ...
```

## cacheMaxAge

Eine positive ganze Zahl, die die maximale Zeit in Sekunden beschreibt, in der gespeicherte Daten wiederverwendet werden
können, bevor die Daten erneut von der API abgerufen werden. 0 deaktiviert das Zwischenspeichern von Daten und sie
werden immer neu von der API geladen.

* Deaktiviert: `0`
* Standard: `3600` (1h)

## graphMaxShownDays

Eine ganze Zahl größer 6, die die maximale Anzahl angezeigter Werte der Graphen beschreibt. Die tatsächliche Anzahl
angezeigter Werte kann geringer sein, da diese auch vom vorhandenem Platz abhängen, aber nie größer.

* Standard: `28`

## graphUpsideDown

Bestimmt, ob die Graphen kopfüber angezeigt werden sollen. (Werte werden quasi mit -1 multipliziert.)

* `false` *(Standard)*: Normal
* `true`: Kopfüber

## graphShowIndex

Bestimmt, ob die Inzidenz oder die Zahl der Fälle für den Graphen verwendet werden.

* `"incidence"` *(Standard)*: Zeigt Inzidenz
* `"cases"`: Zeigt Anzahl der Fälle

## refreshInterval

Eine positive ganze Zahl, die angibt, in welchem Interval sich ein Widget frühstens wieder aktualisieren soll.
Das tatsächliche Interval kann dabei jedoch variieren, da das Betriebssystem bestimmt, wann genau ein Widget aktualisiert wird.

* Standard: `3600`

## stateUseShortName

Verwendet für Bundesländer die Abkürzungen anstelle des Names.

* `true` *(Standard)*: Verwendet Abkürzung.
* `false`: Verwendet Name.

## openUrl

Ein Text, der eine Url darstellt, die geöffnet werden soll, wenn auf das Widget gedrückt wird.
`OpenUrlOnTap` muss dabei `true` sein, damit diese Einstellung einen effekt hat.

* Standard: `"https://corona.rki.de"`

## openUrlOnTap

Bestimmt, ob die url in `openUrl` geöffnet werden soll, wenn auf das Widget gedrückt wird.

* `false` *(Standard)*.
* `true`: Url wird geöffnet.

## alternateLarge

Bestimmt, ob bei großen Widgets die alternative Anzeige From verwendet werden soll.

* `false` *(Standard)*
* `true`: Verwendet alternatives Widget.

## incidenceDisableLive

Deaktiviert die Berechnung der Live-Inzidenz und verwendet die Inzidenz aus der API des RKIs.

* `false` *(Standard)*
* `true`: Verwendet Inzidenz aus der API.

## showVaccine

Aktiviert die Anzeige für die Impfdaten. Diese ist nur nicht im kleinen Widget verfügbar.

* `true` *(Standard)*: Zeigt Impfdaten
* `false`: Deaktiviert

## hideWidgetInfo

Versteck die Allgemeinen Infos am unteren Rand des Widgets. (Version, Quelle und angezeigte Daten)

* `false` *(Standard)*: Zeigt Informationen
* `true`: Informationen werden nicht angezeigt