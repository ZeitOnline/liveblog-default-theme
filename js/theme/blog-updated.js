
var helpers = require('./helpers'),
  blogUpdated = {
    blogUpdatedBox: document.querySelector('.lb-timeline__blog-updated'),
    blogUpdatedTime: LB.blog._updated,
    init: function() {
      if (this.blogUpdatedTime) {
        var convertedTime = helpers.convertTimestamp(this.blogUpdatedTime);

        this.blogUpdatedBox.innerHTML = 'Aktualisiert am ' + convertedTime;
      }
    }
  };

module.exports = blogUpdated;
