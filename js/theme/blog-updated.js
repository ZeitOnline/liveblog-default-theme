
var helpers = require('./helpers'),
  blogUpdated = {
    blogUpdatedBox: document.querySelector('.header-bar__blog-updated'),
    blogUpdatedTime: LB.blog._updated,
    init: function() {
      if (this.blogUpdatedTime) {
        var convertedTime = helpers.formatTimestamp(this.blogUpdatedTime, 'ago');

        this.blogUpdatedBox.innerHTML = '<span>Aktualisiert ' + convertedTime + '</span>';
      }
    }
  };

module.exports = blogUpdated;
