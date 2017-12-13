# ZON Default Theme für Liveblogs 3 im Branch `zon_liveblog_default_theme`

- basiert auf einem Clone von [Liveblog Default Theme](https://github.com/liveblog/liveblog-default-theme), **master** wird immer mal manuell mit diesem Remote geupdated
- Aufgrund eines Problems mit dem Gulp-Setup im [Liveblog Theme Generator](https://github.com/liveblog/generator-liveblog-theme) kann man damit nicht wirklich lokal entwickeln. Das Problem liegt darin, dass der Generator Themes als Abhängigkeiten in `node_modules` installiert und den Gulp Task von dort ausführt. Die Pfade zu den Distro-Dateien scheinen dadurch teilweise nicht mehr zu passen, weshalb der Template-Generator, der eigentlich das Erstellen eigener Templates durch Extenden von Base-Templates ermöglichen sollte, nicht wirklich verwendbar ist. Deshalb gibt's erstmal dieses quasi manuell geforkte Repo hier.


- `git checkout zon_liveblog_default_theme && npm install`
- Lokal entwickeln: `node_modules/.bin/gulp watch-static`
- Remote Blog lokal sehen und entwickeln: `node_modules/.bin/gulp watch-static --embedUrl https://zeit-api.liveblog.pro/api/client_blogs/59fc7f146aa4f500eb121f90/posts` (URL durch API Endpoint des Blogs ersetzen)

- SASS: Einstiegspunkt ist  `sass/zon-default.sass`, die muss so heißen, wie in `theme.json` unter `name` vereinbart.

### Konfiguration
- in `theme.json` für das Distro-Theme
- in `test/options.json` für die lokale Entwicklungsumgebung

## Theme bauen und in den [Theme-Manager](https://zeit.liveblog.pro/#/themes/) hochladen

- Liveblogs Backend Credentials und ein paar mehr Infos gibt's im abgeschlossenen Expolorationsticket [ZON-4282](https://zeit-online.atlassian.net/browse/ZON-4282?jql=text%20~%20%22Exploration%20Liveblogs%22%20order%20by%20lastViewed%20DESC)
- `make` im Wurzelverzeichnis führt den Gulp-Task mit Flag `--production` aus und legt eine .zip-Datei in selbigem ab, die manuell in den [Theme-Manager](https://zeit.liveblog.pro/#/themes/) hochgeladen werden kann
- #### Obacht:
  - der Gulp-Task referenziert die gebauten .js und .css Dateien aus dem `/dist` Ordner funktioniert nicht richtig, das Theme hat in diesem Fall kein JS und CSS
  - Lösung: die Dateinamen der .js und .css Dateien aus dem `/dist` Ordner manuell in die `theme.json` eintragen und erneut `make` ausführen

### Good to know
- Davids Layouts liegen [hier](https://www.dropbox.com/sh/em8rh72upjl01u8/AADNxwtrPq-ZeAtWKc0VMj8-a?dl=0)
- einen Hinweis, wie man an den individuellen API-Endpunkt des jeweiligen Blogs kommt und Source-Fabric Doku gibt's [hier](https://wiki.sourcefabric.org/display/LIVEBLOG/Themes+-+the+theme+generator)
