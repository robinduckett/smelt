var Spider = require('./libs/smelt');
var u = require('url');
var fs = require('fs');

function process(urls) {
  console.log(urls);
  
  // output urls as nginx location directives
  var directives = '';
  
  urls.forEach(function(item) {
    var parsed = u.parse(item);
    
    if (parsed.pathname.length > 1) {
    
      var directive = '\
location ' + parsed.pathname + ' {\n\
  rewrite ^' + parsed.pathname + '$ /newpath permanent; \n\
}';

      directives += directive + '\n\n';
    }
  });
  
  fs.writeFileSync('redirect.conf', directives);
}

var spider = new Spider(function() {
  process(this.urls);
});

spider.crawl('http://www.monmotors.com/');
