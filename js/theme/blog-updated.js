
var helpers = require('./helpers'),
  blogUpdated = {
    blogUpdatedBox: document.querySelector('.header-bar__blog-updated'),
    blogUpdatedTime: LB.blog._updated,
    init: function() {
      if (this.blogUpdatedTime) {
        var convertedTime = helpers.convertTimestamp(this.blogUpdatedTime);

        this.blogUpdatedBox.innerHTML = '<span>Aktualisiert am ' + convertedTime + '</span>';
      }
    }
  };

module.exports = blogUpdated;
