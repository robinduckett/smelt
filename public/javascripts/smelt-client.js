function stop() {
  now.stop(function() {
    location.href = '/';
  });
  
  return false;
}

now.ready(function() {
  if($('#stop').length > 0) {
    now.start_spider($('#site').val());
  }
  
  report.log('Ready');
  
  now.on_start = function(url) {
    report.log('Starting: ' + url);
  };
  
  now.on_err = function(errobj) {
    report.log('Error');
    report.log(errobj);
    results.error(errobj);
  };
  
  now.on_url = function(url) {
    report.log(url);
  };
  
  now.on_links = function(url, links) {
    results.links(url, links);
  };
  
  now.on_queue = function(queue) {
    report.log('Queue:');
    report.log(queue);
  };
  
  now.on_end = function(urls, nginx) {
    $('#nginx').html(nginx);
  };
});

var report = {
  log: function() {
    var tmp = '';
    
    for (var i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] == "function") tmp += '[Function]\n';
      if (typeof arguments[i] == "object") tmp += JSON.stringify(arguments[i]) + '\n';
      if (typeof arguments[i] == "string") tmp += arguments[i] + '\n';
      if (arguments[i].constructor == 'function Array() { [native code] }') tmp += '[ ' + arguments[i].join(', ') + ' ]';
    }
    
    $('#report').prepend('<div class="message">' + tmp + '</div>');
    $('#report').animate({scrollTop: $('#report div.message:last-child').scrollTop()}, 500);
  }
};

var results = {
  _alert: function(type, message, url) {
    var divc = $('<div />');
    divc.addClass('result');
    
    var div = $('<div />');
    var p = $('<p />');
    
    div.addClass('alert-message');
    div.addClass(type);
    
    p.append('<strong>' + message + '&nbsp;</strong>');
    p.append(url);
    
    div.append(p);
    
    divc.append(div);
    
    return divc;
  },
  
  error: function(error) {
    if (error.type) {
      if (error.type == 'status_error') {
        var toadd = this.url(error.url, 'error', 'Status Error: ' + error.code);
      }
    }
  },
  
  url: function(url, type, message) {
    var toadd = null;
    
    $('#results').each(function() {
      if ($(this).data('url') == url || $(this).attr('data-url') == url) {
        toadd = $(this);
      }
    });
    
    if (toadd == null) {
      var talert = null;
      
      if (type == null && message == null) {
        talert = this._alert('success', 'Scanned URL', url);
      } else {
        talert = this._alert(type, message, url)
      }
      
      talert.data('url', url);
      talert.attr('data-url', url);
      toadd = talert;
      
      $('#results').prepend(toadd);
    }
    
    return toadd;
  },
  
  links: function(url, links) {
    var toadd = this.url(url);
    
    var ul = $('<ul />');
    
    for (var i = 0; i < links.length; i++) {
      ul.append('<li>' + links[i] + '</li>');
    }
    
    toadd.append(ul);
  }
};