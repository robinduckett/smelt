var jsdom = require("jsdom");
var async = require('async');
var request = require('request');
var u = require('url');
var util = require('util');
var events = require('events');

function Spider(callback) {
  this.urls = [];
  this.queue = [];
  this.paused = [];
  this.failed = [];
  
  if (callback)
    this.callback = callback;
  
  events.EventEmitter.call(this);
}

util.inherits(Spider, events.EventEmitter);

Spider.prototype.get = function(url, callback) {
  var self = this;
  
  if (this.queue.indexOf(url) > -1) {
    this.queue.splice(this.queue.indexOf(url), 1);
  }
  
  if (this.failed.indexOf(url) > -1) {
    callback("Not requesting failed url" , null);
    return;
  }
  
  if (this.urls.indexOf(url) > -1) {
    callback("Not rerequesting " + url, null);
    return;
  }
  
  self.urls.push(url);
  
  request.get({url: url, followRedirect: false}, function(err, res, body) {
    if (!err) {
      if (res.statusCode == 200) {
        jsdom.env(body, ['http://code.jquery.com/jquery-1.5.min.js'], function(errors, window) {
          if (errors) {
            self.urls.splice(self.urls.indexOf(url), 1);
            self.failed.push(url);
            callback(errors, null);
          } else {
            
            var $ = window.jQuery;
            var parsed = u.parse(url);
            var internal = $("a[href^='"+parsed.protocol+'//'+parsed.host+"'], a[href^='/'], a[href^='./'], a[href^='../']");
            var links = [];
            
            internal.each(function() {
              var href = $(this).attr('href');
              //if (href.charAt(string.length - 1) == "/") href = href.substr(0, href.length - 1);
              
              var link = u.resolve(parsed.protocol+'//'+parsed.host+parsed.pathname, href);
              if (links.indexOf(link) == -1) links.push(link);
            });
            
            window.close();
            
            callback(null, links);
          }
        });
      } else {
        self.emit("err", {type: 'status_error', code: res.statusCode, url: url});
        self.urls.splice(self.urls.indexOf(url), 1);
        self.failed.push(url);
        callback(url + ": got code " + res.statusCode, null);
      }
    } else {
      self.emit("err", {type: 'request_err', err: err, url: url});
      self.urls.splice(self.urls.indexOf(url), 1);
      self.failed.push(url);
      callback(err, null);
    }
  });
};

Spider.prototype.stop = function() {
  this.queue = [];
};

Spider.prototype.pause = function() {  
  this.paused = this.queue;
  this.queue = this.paused;
};

Spider.prototype.crawl = function(url) {
  var spider = this;
  
  spider.get(url, function(err, links) {
    
    spider.emit("start");
    
    links.forEach(function(item) {
      if (spider.queue.indexOf(item) == -1 && spider.urls.indexOf(item) == -1) spider.queue.push(item);
    });
    
    async.whilst(
      function() {
        if (spider.queue.length == 0) spider.emit("end", spider.urls);
        return spider.queue.length > 0
      },
      function(callback) {
        var next_url = spider.queue.pop();
        
        try {
          var failed = spider.failed.indexOf(next_url) > -1;
          var already = spider.urls.indexOf(next_url) > -1;
          
          if (failed || already) {
            callback();
          } else {
            spider.get(next_url, function(err, links) {
              if (err) {
                console.log(err);
                callback();
              } else {
                spider.emit("url", next_url);
                
                spider.emit("links", next_url, links);
                
                links.forEach(function(item) {
                  if (spider.queue.indexOf(item) == -1 && spider.urls.indexOf(item) == -1) spider.queue.push(item);
                });
                
                if (spider.queue.length == 0) {
                  spider.emit("end", spider.urls);
                }
                
                callback();
              }
            });
          }
        } catch (err) {
          spider.emit("err", {type: 'mainloop_err', err: err, url: next_url});
          console.log('tryerr: ' + err);
        }
      },
      function(err) {
        try {
          if (err) {
            console.log(err);
            spider.emit("err", {err: err});
          } else {
            spider.emit("end", spider.urls);
            console.log('all done');
            if (spider.callback) spider.callback();
          }
        } catch (err) {
          console.log('ughghgh');
          console.log(err);
        }
      }
    );
  });
};

module.exports = Spider;