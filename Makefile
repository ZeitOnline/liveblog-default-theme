THEME_NAME    := $(shell node -p "require('./package.json').name")
THEME_ARCHIVE := $(THEME_NAME).zip

make:
	make clean
	node_modules/.bin/gulp --NODE_ENV production
	zip -r $(THEME_ARCHIVE) * \
		-x ".git/*" \
		-x "Makefile" \
		-x "less/*" \
		-x "sass/*" \
		-x "js/*" \
		-x "node_modules/*" \
		-x "py-test/*" \
		-x "test/*" \
		-x "index.html" \
		-x "gulpfile.js" \
		-x "npm-shrinkwrap.json" \
		-x "*.sublime-*" \
		-x "*.zip" \
		-x "package-lock.json" \
		-x "yarn.lock" \
		-x "embedcode.html"

clean:
	rm -f $(THEME_ARCHIVE)
