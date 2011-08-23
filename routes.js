var url = require('url');

module.exports = function(app) {
  app.get('/about', function(req, res){
    res.render('about', {
      title: 'Smelt - About'
    });
  });
  
  app.get('/', function(req, res){
    res.render('index', {
      title: 'Smelt',
      disabled: false,
      error: '',
      start_again: false
    });
  });
  
  app.post('/', function(req, res){
    if (req.body.site) {
      var site_url = url.parse(req.body.site);
      var error = '';
      
      if (site_url.hostname) {
        // process site
      } else {
        error = 'Not a valid URL';
      }
      
      if (error == '') {
        var start_again = true;
      } else {
        var start_again = false;
      }
      
      res.render('index', {
        title: 'Smelt',
        disabled: req.body.site ? true : false,
        site: req.body.site ? req.body.site : '',
        error: error,
        start_again: start_again
      });
    } else {
      res.header('Location', '/');
      res.send(301);
    }
  });
};