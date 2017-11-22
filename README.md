# ZON Default Theme für Liveblogs 3 im Branch `zon_liveblog_default_theme`

- basiert auf einem Clone von [Liveblog Default Theme](https://github.com/liveblog/liveblog-default-theme), **master** wird immer mal manuell mit diesem Remote geupdated
- Aufgrund eines Problems mit dem Gulp-Setup im [Liveblog Theme Generator](https://github.com/liveblog/generator-liveblog-theme) kann man damit nicht wirklich lokal entwickeln. Das Problem liegt darin, dass der Generator Themes als Abhängigkeiten in `node_modules` installiert und den Gulp Task von dort ausführt. Die Pfade zu den Distro-Dateien scheinen dadurch teilweise nicht mehr zu passen, weshalb der Template-Generator, der eigentlich das Erstellen eigener Templates durch Extenden von Base-Templates ermöglichen sollte, nicht wirklich verwendbar ist. Deshalb gibt's erstmal dieses quasi manuell geforkte Repo hier.


- `git checkout zon_liveblog_default_theme && npm install`
- Lokal entwickeln: `node_modules/.bin/gulp watch-static`
- Remote Blog lokal sehen und entwickeln: `node_modules/.bin/gulp watch-static --embedUrl https://zeit-api.liveblog.pro/api/client_blogs/59fc7f146aa4f500eb121f90/posts` (URL durch API Endpoint des Blogs ersetzen)
