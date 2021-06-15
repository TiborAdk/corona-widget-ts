# Corona-Widget erweiterte Konfiguration

Das Widget kann über die Datei `config.json` im Ordner des Widgets konfiguriert werden. Falls die Datei nicht existiert,
wird sie beim Ausführen des Widgets erstellt und mit einem leeren Object gefüllt.
Es reicht wenn nur Werte eingetragen werden, die von den [Standardwerten](../config.json) abweichen.

# Speicherort

Die Datei befindet sich im selben Ordner, in dem auch die Daten für die Standorte zwischengespeichert werden.
Standardmäßig ist sie damit im Ordner `iCloudDrive/Scriptable/corona_widget_ts/` zu finden.

Die Datei kann zum Beispiel mit [Jayson](https://apps.apple.com/de/app/jayson/id1447750768) oder bearbeitet werden.

# Cache

``` json
    "cache": {
        "maxAge": 3600
    },
```

Die `cache` Einstellungen beinhalten Einstellungen die das Zwischenspeichern von Daten beeinflussen

## maxAge

Eine positive ganze Zahl, die die maximale Zeit in Sekunden beschreibt, in der gespeicherte Daten wiederverwendet werden
können, bevor die Daten erneut von der API abgerufen werden. 0 deaktiviert das Zwischenspeichern von Daten und sie werden, immer
neu von der API geladen.

* Deaktiviert: `0`
* Standard: `3600` (1h)

# Graph

Die `graph` Einstellungen nehmen Einfluss auf das Aussehen und die Anzahl angezeigter Werte in den verwendeten Graphen
aller Widgets.

```json
    "graph": {
    "maxShownDays": 28,
    "upsideDown": false,
    }
```

## maxShownDays

Eine ganze Zahl größer 6, die die maximale Anzahl angezeigter Werte der Graphen beschreibt. Die tatsächliche Anzahl
angezeigter Werte kann geringer sein, da diese auch vom vorhandenem Platz abhängen, aber nie größer.

* Standard: `28`

## upsideDown

Bestimmt, ob die Graphen kopfüber angezeigt werden sollen. (Werte werden quasi mit -1 multipliziert.)

* `false` (Standard): Normal
* `true`: Kopfüber

# Incidence

Die `incidence` Einstellungen beeinflussen die Darstellung der Incidence und damit verbundene Werte.

```json
    "incidence": {
    "trend": "week"
  },
```

## trend

Bestimmt, mit welchem Wert der aktuelle Inzidenzwert verglichen wird.

* `"week"` (Standard) vergleicht den aktuellen Wert mit dem Wert vor einer Woche.
* `"day"` vergleicht den aktuellen Wert mid dem Wert des letzten Tages.

# Widget

Die `widget` Einstellungen beeinflussen das Allgemeine Verhalten von Widgets.

```json
    "widget": {
        "refreshInterval": 3600,
        "openUrl": "https://corona.rki.de",
        "openUrlOnTap": false,
        "alternatLarge": false,
    },
```

## refreshInterval

Eine positive ganze Zahl, die angibt, in welchem Interval sich ein Widget frühstens wieder aktualisieren soll.
Das tatsächliche Interval kann dabei jedoch variieren, da das Betriebssystem bestimmt, wann genau ein Widget aktualisiert wird.

* Standard: `3600`

## openUrl

Ein Text, der eine Url darstellt, die geöffnet werden soll, wenn auf das Widget gedrückt wird.
`widget.OpenUrlOnTap` muss dabei `true` sein, damit diese Einstellung einen effekt hat.

* Standard: `"https://corona.rki.de"`

## openUrlOnTap

Bestimmt, ob die url in `widget.openUrl` geöffnet werden soll, wenn auf das Widget gedrückt wird.

* `false` (Standard).
* `true`: Url wird geöffnet.

## alternateLarge

Bestimmt, ob bei großen Widgets die alternative Anzeige From verwendet werden soll.

* Standard: `false`
* `true`: Verwendet alternatives Widget.

# Script

Die `script` Einstellungen, kontrollieren das Allgemeine Verhalten des Skriptes.

```json
    "script": {
        "scriptAutoUpdate": true
    }, 
```

## autoUpdate

Bestimmt, ob das Skript sich automatisch aktualisieren soll oder nicht.

* Deaktiviert: `false`
* Standard: `true`

## autoUpdateInterval

Eine positive Zahl, die das Zeitintervall in Tagen bestimmt, in dem das Script versucht sich zu aktualisieren.

* Standard: `1` (1 Tag)

# Storage

Die `storage` Einstellungen beeinflussen, den Speicherort der zwischengespeicherten Dateien und wie diese benannt werden. \
**ACHTUNG**: Diese Einstellungen können **NICHT** über die Konfigurationsdatei geändert werden, sondern nur direkt im Skript. \
**ACHTUNG**: Die Werte werden durch ein Update des Skriptes auf den Standardwert des Skriptes gesetzt. Es ist ratsam diese Einstellungen nicht zu ändern!

```json
    "storage": {
        "directory": "corona_widget_ts",
        "fileStub": "coronaWidget_"
    },
```

## directory

Ordner in dem die Dateien des Skriptes zwischengespeichert werden. Der Dateipfad liegt dabei immer innerhalb des Dateiordners von Scriptable. \
**ACHTUNG**: Kann nicht über die Konfigurationsdatei gesetzt werden, sondern nur direkt über das Script. \
**ACHTUNG**: Wird durch ein Update des Skriptes auf den Standardwert des Skriptes gesetzt.

* Standard: `"corna_widget_ts"`

## fileStub

Ein Text, der als Basis für die Benennung der zwischengespeicherten Daten dient. \
**ACHTUNG**: Kann nicht über die Konfigurationsdatei gesetzt werden, sondern nur direkt über das Script. \
**ACHTUNG**: Wird durch ein Update des Skriptes auf den Standardwert des Skriptes gesetzt.

* Standard: `"coronaWidget"`
