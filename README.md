# ZON Default Theme für Liveblog v3

- fork von [Liveblog Default Theme](https://github.com/liveblog/liveblog-default-theme)
- Aktualisierungen von Sourcefabric sollten regelmäßig von deren Repo in den `master` gemerged werden.
```
git remote add liveblog git@github.com:liveblog/liveblog-default-theme.git
```

### Development

- Node Module installieren: `yarn install`
- Lokalen Development Server starten: `node_modules/.bin/gulp watch-static`
- Remote Blog lokal sehen und entwickeln: `node_modules/.bin/gulp watch-static --embedUrl https://zeit-api.liveblog.pro/api/client_blogs/59fc7f146aa4f500eb121f90/posts` (URL durch API Endpoint des Blogs ersetzen)
- SASS: Einstiegspunkt ist `sass/zon-default.sass`, die muss so heißen, wie in `theme.json` unter `name` vereinbart.

### Konfiguration

- in `theme.json` für das Distro-Theme
- in `test/options.json` für die lokale Entwicklungsumgebung

### Theme bauen und in den [Theme-Manager](https://zeit.liveblog.pro/#/themes/) hochladen

- Liveblog Backend Credentials und ein paar mehr Infos gibt's im Ticket [ZON-4282](https://zeit-online.atlassian.net/browse/ZON-4282) und im dazugehörigen Epic.
- `make` im Wurzelverzeichnis erstellt mittels `gulp` ein Release, generiert dazu alle benötigten Assets und Templates und erzeugt eine ZIP-Datei, die manuell in den [Theme-Manager](https://zeit.liveblog.pro/#/themes/) hochgeladen werden kann.

### Good to know

- Davids Layouts liegen [hier](https://www.dropbox.com/sh/em8rh72upjl01u8/AADNxwtrPq-ZeAtWKc0VMj8-a?dl=0)
- einen Hinweis, wie man an den individuellen API-Endpunkt des jeweiligen Blogs kommt und Source-Fabric Doku gibt's [hier](https://wiki.sourcefabric.org/display/LIVEBLOG/Themes+-+the+theme+generator)
- Um die lokale Abhängigkeit des Solo-Themes vom Default-Theme zu aktualisieren (also Änderungen im `master` für `zon-default-solo` zu übernehmen) kann man `yarn upgrade --force liveblog-zon-amp-theme` ausführen. Das aktualisiert dann alle _vererbten Dateien_, wie die HTML-Templates, SCSS-dateien und das gulpfile.js.
