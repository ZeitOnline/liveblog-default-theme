'use strict';

const gulp = require('gulp');
const browserify = require('browserify');
const nunjucksify = require('nunjucksify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const plugins = require('gulp-load-plugins')();
const del = require('del');
const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');
const dateFilter = require('nunjucks-date-filter');
const amphtmlValidator = require('amphtml-validator');
const sourcemaps = require('gulp-sourcemaps');

const CWD = process.cwd();
var DEBUG = process.env.NODE_ENV !== "production";

// Command-line and default theme options from theme.json.
let theme = {};
const loadThemeJSON = () => {
  theme = require(path.resolve(`${CWD}/theme.json`));
};
loadThemeJSON();

const inputPath = theme.extends ?
  path.resolve(`${CWD}/node_modules/liveblog-${theme.extends}-theme/`) :
  path.resolve(`${CWD}/`);

const { options } = require(path.resolve(`${CWD}/test`));

let argvKey = 0;
let apiHost = "";
let blogId = "";
let protocol = "";
let apiResponse = {
  posts: {
    _items: []
  },
  stickyPosts: {
    _items: []
  }
};
let match = [];

const http = require('http');
const https = require('https');

['--embedUrl', '--apiUrl'].forEach((argName) => {
  if (process.argv.indexOf(argName) !== -1) {
    argvKey = process.argv.indexOf(argName)+1;
  }
});

if (argvKey !== 0) {
  match = process.argv[argvKey]
    .match(/^(http:\/\/|https:\/\/|\/\/)([^\/]+)\/(api\/client_blogs|embed|[^\/]+\/blogs)\/(\w+)/i);
}

if (match.length > 0) {
  [,protocol, apiHost,, blogId] = match;

  const postsEndpoint = `${protocol}${apiHost}/api/client_blogs/${blogId}/posts`;
  const request = protocol === 'http://' ? http : https;

  let query = {
    "query": {
      "filtered": {
        "filter": {
          "and": [
            {"term": {"sticky": true}},
            {"term": {"post_status": "open"}},
            {"not": {"term": {"deleted": true}}}
          ]
        }
      }
    },
    "sort": [
      {
        "_updated": {"order": "desc"}
      }
    ]
  };

  request.get(`${postsEndpoint}?source=${JSON.stringify(query)}`, (response) => {
    let body = '';

    response.on('data', (d) => {
      body += d;
    });
    response.on('end', () => {
      apiResponse.stickyPosts = JSON.parse(body);
    });
  });

  query.query.filtered.filter.and[0].term.sticky = false;
  const { postsPerPage } = options.blog.theme_settings;

  request.get(`${postsEndpoint}?max_results=${postsPerPage}&source=${JSON.stringify(query)}`, (response) => {
    let body = '';

    response.on('data', (d) => {
      body += d;
    });
    response.on('end', () => {
      apiResponse.posts = JSON.parse(body);
    });
  });
}

let templatePath = [
  path.resolve(`${CWD}/templates`)
];

if (theme.extends) {
  templatePath.push(path.resolve(`${CWD}/node_modules/liveblog-${theme.extends}-theme/templates`));
}

const nunjucksLoader = new nunjucks.FileSystemLoader(templatePath);
const nunjucksEnv = new nunjucks.Environment(nunjucksLoader);

// Add nunjucks-date-filter and set default date format.
// TODO: get date format from theme settings.
dateFilter.setDefaultFormat('dddd, MMMM Do, YYYY, h:MM:ss A');
nunjucksEnv.addFilter('date', dateFilter);

// ampify filter used by AMP theme
const ampifyFilter = (html) => {
  if (html.search(/<\S*iframe/i) > 0) {
    // html contains iframe
    const src = (/src=\"([^\"]+)\"/).exec(html)[1];
    var width = (/width=\"([^\"]+)\"/).exec(html)[1];
    var height = (/height=\"([^\"]+)\"/).exec(html)[1];

    if (!width || width.search("%") >= 0) {
      width = '350';
    }

    if (!height) {
      height = '350';
    }

    return `
    <amp-iframe
        width=${width}
        height=${height}
        layout="responsive"
        frameborder="0"
        sandbox="allow-scripts
        allow-same-origin allow-popups"
        src="${src}">
            <p placeholder>Loading...</p>
    </amp-iframe>`;
  }

  // brightcove url recognition
  if (html.search(/players\.brightcove\.net\/\d*\/[a-z0-9\-]*_\w*\/index\.html\?videoId/i) > 0) {
    let account, playerEmbed, player, embed, videoId = '';

    account = (/net\/(\d*)\//).exec(html)[1];
    playerEmbed = (/\w*(-[a-zA-Z0-9]+)*_\w*/i).exec(html)[0];
    playerEmbed = playerEmbed.split('_');
    player = playerEmbed[0];
    embed = playerEmbed[1];
    videoId = (/videoId=(\S*)/i).exec(html)[1];

    return `
      <amp-brightcove
      data-account="${account}"
      data-player="${player}"
      data-embed="${embed}"
      data-video-id="${videoId}"
      layout="responsive"
      width="480" height="270">
      </amp-brightcove>`;
  }

  // brightcove in-page embed recognition
  if (html.search(/players\.brightcove\.net\/\d*\/[a-z0-9\-]*_\w*\/index\.min\.js/i) > 0) {
    let account, playerEmbed, player, embed, videoId = '';

    account = (/data-account="(\d*)"/).exec(html)[1];
    player = (/data-player="([a-zA-Z0-9-]*)"/i).exec(html)[1];
    embed = (/data-embed="([a-zA-Z0-9-]*)"/i).exec(html)[1];
    videoId = (/data-video-id="(\d*)"/i).exec(html)[1];

    return `
      <amp-brightcove
      data-account="${account}"
      data-player="${player}"
      data-embed="${embed}"
      data-video-id="${videoId}"
      layout="responsive"
      width="480" height="270">
      </amp-brightcove>`;
  }

  return html;
};

nunjucksEnv.addFilter('ampify', ampifyFilter);

// add addten filter used by AMP theme
var addtenFilter = function( dateString ) {
  var year = dateString.substring(0,4);
  var rest = dateString.substring(4);
  var newYear = parseInt(year) + 10;
  return newYear + rest;
};
nunjucksEnv.addFilter('addten', addtenFilter);

// nunjucks options.
const nunjucksOptions = {
  env: nunjucksEnv
};

nunjucks.env = nunjucksEnv;

const paths = {
  sass: 'sass/**/*.scss',
  js: ['js/*.js', 'js/*/*.js'],
  jsfile: 'liveblog.js', // Browserify basedir
  cssfile: path.resolve(inputPath, 'liveblog.css'),
  templates: path.resolve(inputPath, 'templates/*.html')
};
const BUILD_HTML = './index.html';

function getThemeSettings(options) {
  var _options = {};
  for (var option in options) {
    _options[option.name] = option.default;
  }
  return _options;
}

gulp.task('lint', () =>
  gulp.src([
    path.resolve(inputPath, 'js/**/*.js'),
    path.resolve(inputPath, 'gulpfile.js')
  ])
  .pipe(plugins.eslint({ quiet: true }))
  .pipe(plugins.eslint.format())
  .pipe(plugins.eslint.failAfterError())
);

// Browserify.
let browserifyPreviousTasks = ['clean-js'];

gulp.task('browserify', browserifyPreviousTasks, (cb) => {
  if (theme.ampTheme) {
    return gulp.src('.').pipe(plugins.util.noop());
  }
  var b = browserify({
    basedir: inputPath,
    entries: 'js/liveblog.js',
    fullPaths: true,
    debug: DEBUG
  });

  var rewriteFilenames = function(filename) {
    var parts = filename.split('/');

    return parts[parts.length - 1];
    // return filename;
  };

  // Source-mapped
  return b
    .transform('babelify', {presets: ['es2015', 'stage-0']})
    .transform(nunjucksify, {
      extension: '.html',
      nameFunction: rewriteFilenames
    })
    .bundle()
    .on('error', plugins.util.log)
    .pipe(source(paths.jsfile))
    .pipe(buffer())
    .pipe(plugins.concat(`${theme.name}.js`))
    .pipe(plugins.rev())
    .pipe(plugins.ngAnnotate())
    .pipe(plugins.if(!DEBUG, plugins.uglify()))
    .pipe(gulp.dest('./dist'))
    .pipe(plugins.rev.manifest('dist/rev-manifest.json', {merge: true}))
    .pipe(gulp.dest('.'));
});

const sassCommon = () => {
  var sassFiles = [];

  // process inherited styles from extended theme first
  // this makes it easier to override rules with this theme's CSS and avoids specificity war
  if ( !theme.onlyOwnCss && theme.extends ) {
    let themeSass = path.resolve(`${inputPath}/sass/${theme.extends}.scss`);
    sassFiles.push(fs.existsSync(themeSass) ? themeSass : path.resolve(`${inputPath}/sass/*.scss`));
  }

  // Name of the sass theme file.
  let themeSass = `./sass/${theme.name}.scss`;
  // Compile all the files under the sass folder if no theme sass file pressent.
  sassFiles.push(fs.existsSync(themeSass) ? themeSass : './sass/*.scss');

  return gulp.src(sassFiles)
    .pipe(plugins.if(DEBUG, sourcemaps.init()))
    .pipe(plugins.sass({
      sourcemap: DEBUG,
      sourcemapPath: './sass'
    }))
    .on('error', function(error) {
      console.error(error);
      this.emit('end');
    })
    .pipe(plugins.autoprefixer({
      flexbox: 'no-2009'
    }))
    /* @TODO:
     *  generate a full api support with
     *      - pinned
     *          - both need to be enable ( have support in the code for `stickyPosition`='both')
     *          - with possition below menu bar
     *          - with possition above menu bar
     *      - highlight
     *      - scorecards
     *      - text
     *      - image
     *      - quote
     *      - comments
     *          - with bellow reply
     *          - with on top reply
     *      - advertisements
     *          - local
     *          - remote
     *      - all supported emebds
     *          - twitter
     *          - facebook
     *          - instagram
     *          - youtube
     *          - generic ( link )
     * language settings if any.
     * all posts above needs to be added and then enable purifycss.
     * otherwise purifycss will remove those css "unused"/not present.
    */
    //.pipe(plugins.if(!DEBUG, plugins.purifycss([BUILD_HTML])))
    .pipe(plugins.if(!DEBUG, plugins.cleanCss({
      rebase: false,
      compatibility: 'ie8'
    })))
    .pipe(plugins.if(DEBUG, sourcemaps.write()));
};

// Compile SASS files.
gulp.task('sass', ['clean-css'], () =>
    sassCommon()
    .pipe(plugins.concat(`${theme.name}.css`))
    .pipe(plugins.rev())
    .pipe(gulp.dest('./dist'))
    .pipe(plugins.rev.manifest('dist/rev-manifest.json', {merge: true}))
    .pipe(gulp.dest('.'))
);


// Inject API response into template for dev/test purposes.
gulp.task('index-inject', ['sass', 'browserify'], () => {
  var testdata = require(path.resolve(`${CWD}/test`));
  var sources = gulp.src(['./dist/*.js', './dist/*.css'], {
    read: false // We're only after the file paths
  });

  if (apiResponse.posts._items.length > 0) {
    testdata.options.api_host = `${protocol}${apiHost}`;
    testdata.options.blog._id = blogId;
  }
  const index = './templates/template-index.html';
  var indexTask = gulp.src(fs.existsSync(index) ? index : path.resolve(inputPath, index))
    .pipe(plugins.inject(sources))
    .pipe(plugins.nunjucks.compile({
      options: testdata.options,
      json_options: JSON.stringify(testdata.options, null, 4),
      settings: testdata.options.settings,
      api_response: apiResponse.posts._items.length > 0 ? apiResponse : testdata.api_response,
      include_js_options: true,
      debug: DEBUG
    }, nunjucksOptions));

  if (theme.ampTheme) {
    indexTask = indexTask.pipe(plugins.inject(
      sassCommon(),
      {
        starttag: '<!-- inject:amp-styles -->',
        transform: function(filepath, file) {
          return file.contents.toString();
        },
        removeTags: true
      })
    );
  }
  return indexTask.pipe(plugins.rename("index.html"))
    .pipe(gulp.dest('.'))
    .pipe(plugins.connect.reload());
});

/*
 * Validate if AMP markup is valid
 * From: https://github.com/uncompiled/amp-bootstrap-example/
 */
gulp.task('amp-validate', [], () => {
  amphtmlValidator.getInstance().then((validator) => {
    var input = fs.readFileSync(BUILD_HTML, 'utf8');
    var result = validator.validateString(input);
    (result.status === 'PASS' ? console.info : console.error)(BUILD_HTML + ": " + result.status);
    for (var ii = 0; ii < result.errors.length; ii++) {
      var error = result.errors[ii];
      var msg = 'line ' + error.line + ', col ' + error.col + ': ' + error.message;
      if (error.specUrl !== null) {
        msg += ' (see ' + error.specUrl + ')';
      }
      (error.severity === 'ERROR' ? console.error : console.warn)(msg);
    }
  });
});


// Inject jinja/nunjucks template for production use.
gulp.task('template-inject', ['sass', 'browserify'], () => {
  var themeSettings = getThemeSettings(theme.options);

  let templates = [];
  let timeline = `./templates/template-timeline.html`;
  templates.push(fs.existsSync(timeline) ? timeline : path.resolve(inputPath,timeline));
  let main = `./templates/template.html`;
  main = fs.existsSync(main) ? main : path.resolve(inputPath,main);
  return gulp.src(main)
    .pipe(plugins.nunjucks.compile({
      theme: theme,
      theme_json: JSON.stringify(theme, null, 4),
      settings: themeSettings,
      include_js_options: false,
      debug: DEBUG
    }))
    // Add nunjucks/jinja2 template for server-side processing.
    .pipe(plugins.inject(gulp.src(templates), {
      starttag: '<!-- inject:template-content -->',
      transform: function(filepath, file) {
        return file.contents.toString();
      }
    }))

    // Save base template.html file.
    .pipe(plugins.rename("template.html"))
    .pipe(gulp.dest('.'))
    .pipe(plugins.connect.reload());
});

// Replace assets paths in theme.json file and reload options.
gulp.task('theme-replace', ['browserify', 'sass'], () => {
  var manifest = require(path.resolve(CWD, "./dist/rev-manifest.json"));
  var base = './',
    cssName = new RegExp(`${theme.name}-.*\.css`, 'g'),
    jsName = new RegExp(`${theme.name}-.*\.js`, 'g');
  gulp.src('theme.json', {base: base})
    .pipe(plugins.replace(cssName, manifest[paths.cssfile] || manifest[`${theme.name}.css`]))
    .pipe(plugins.replace(jsName, manifest[paths.jsfile] || manifest[`${theme.name}.js`]))
    .pipe(plugins.replace(/"version":\s*"(\d+\.\d+\.)(\d+)"/,(a, p, r) => `"version": "${p}${++r}"`))
    .pipe(gulp.dest(base));
  gulp.src('package.json', {base: base})
    .pipe(plugins.replace(/"version":\s*"(\d+\.\d+\.)(\d+)"/,(a, p, r) => `"version": "${p}${++r}"`))
    .pipe(gulp.dest(base));
  // Reload theme options
  loadThemeJSON();
});

gulp.task('server', ['browserify', 'sass', 'index-inject'], () => {
  plugins.connect.server({
    port: 8008,
    root: '.',
    fallback: 'index.html',
    livereload: true
  });
});

// Watch
gulp.task('watch-static', ['server'], () => {
  var js = gulp.watch(paths.js, ['browserify', 'index-inject'])
    , sass = gulp.watch(paths.sass, ['sass', 'index-inject'])
    , templates = gulp.watch(paths.templates, ['index-inject']);

  [js, sass, templates].forEach((el, i) => {
    el.on('error', (e) => {
      console.error(e.toString());
    });
  });
});

gulp.task('set-production', () => {DEBUG = false;});

// Clean CSS
gulp.task('clean-css', () => del(['dist/*.css']));

// Clean JS
gulp.task('clean-js', () => del(['dist/*.js']));

gulp.task('production', ['browserify', 'sass', 'theme-replace', 'template-inject']);

gulp.task('default', ['set-production', 'production']);

// Default build for development
gulp.task('devel', ['browserify', 'sass', 'theme-replace', 'index-inject']);

module.exports = gulp;
