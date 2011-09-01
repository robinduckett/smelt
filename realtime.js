var nowjs = require('now');
var Spider = require('./libs/smelt.js');
var u = require('url');

var spiders = [];

var array_remove = function(arr, from, to) {
  var rest = arr.slice((to || from) + 1 || arr.length);
  arr.length = from < 0 ? arr.length + from : from;
  return arr.push.apply(arr, rest);
};

function stop_spider(index) {
  spiders[index].spider.stop();
  array_remove(spiders, index);
}

module.exports = function(app) {
  var everyone = nowjs.initialize(app);
  
  everyone.now.start_spider = function(url) {
    var self = this;
    
    var cont = true;
    
    var p = u.parse(url);
    
    switch(p.hostname) {
      case 'twitter.com':
      case 'reddit.com':
      case 'youtube.com':
      case 'digg.com':
        this.now.alert_error('Unable to start spider: Site is in disallowed list');
        cont = false;
      break;
    }
    
    if (spiders.length < 20 && cont == true) {
      var queue = {
        url: url,
        client: this.user.clientId,
        spider: new Spider()
      };
      
      var index = spiders.push(queue) - 1;
      
      spiders[index].spider.index = index;
      
      spiders[index].spider.on('start', function() {
        var spider = spiders[this.index].spider;
        var job = spiders[this.index];
        
        nowjs.getClient(job.client, function(err) {
          if (err) {
            console.log(err);
            stop_spider(spider.index);
          } else {
            this.now.on_start(job.url);
          }
        });
      });
      
      spiders[index].spider.on('links', function(url, links) {
        var spider = spiders[this.index].spider;
        var job = spiders[this.index];
        
        nowjs.getClient(job.client, function(err) {
          if (err) {
            console.log(err);
            stop_spider(spider.index);
          } else {
            this.now.on_links(url, links);
          }
        })
      });
      
      spiders[index].spider.on('queue', function(list) {
        var spider = spiders[this.index].spider;
        var job = spiders[this.index];
        
        nowjs.getClient(job.client, function(err) {
          if (err) {
            console.log(err);
            stop_spider(spider.index);
          } else {
            this.now.on_queue(list);
          }
        });
      });
      
      spiders[index].spider.on('redirect', function(error) {
        var spider = spiders[this.index].spider;
        var job = spiders[this.index];
        
        nowjs.getClient(job.client, function(err) {
          if (err) {
            console.log(err);
            stop_spider(spider.index);
          } else {
            this.now.on_redirect(error);
          }
        });
      });
      
      spiders[index].spider.on('err', function(error) {
        var spider = spiders[this.index].spider;
        var job = spiders[this.index];
        
        nowjs.getClient(job.client, function(err) {
          if (err) {
            console.log(err);
            stop_spider(spider.index);
          } else {
            this.now.on_err(error);
          }
        });
      });
      
      spiders[index].spider.on('url', function(url) {
        var spider = spiders[this.index].spider;
        var job = spiders[this.index];
        
        nowjs.getClient(job.client, function(err) {
          if (err) {
            console.log(err);
            stop_spider(spider.index);
          } else {
            this.now.on_url(url);
          }
        });
      });
      
      spiders[index].spider.on('end', function(list) {
        var spider = spiders[this.index].spider;
        var job = spiders[this.index];
        
        nowjs.getClient(job.client, function(err) {
          if (err) {
            console.log(err);
            stop_spider(spider.index);
          } else {
            var directives = '';
  
            list.forEach(function(item) {
              var parsed = u.parse(item);
              
              if (parsed.pathname.length > 1) {
                
                if (!parsed.search) parsed.search = '';
            
              var directive = '\
location ' + parsed.pathname + parsed.search + ' {\n\
  rewrite ^' + parsed.pathname + parsed.search + '$ /newpath permanent; \n\
}';
          
                directives += directive + '\n\n';
              }
            });
            
            this.now.on_end(list, directives);
          }
        });
      });
      
      spiders[index].spider.crawl(url);
    } else {
      this.now.alert_error('Unable to start spider: more than three spiders running or site is in disallowed list');
    }
  };
};
