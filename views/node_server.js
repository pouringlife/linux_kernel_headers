var express = require('express');
var fs = require('fs');
var url = require('url');
var app = express();

app.get('/',function(req,res){

    pathname = req.url;

    console.log(pathname);
    fs.readdir('./'+pathname,function(err,files){
      files.forEach(function(name){
        res.write('<a href ='+pathname+name+'>'+name+'</a>'+'</br>');
      });
      res.end()
    });
});



app.use('/',express.static('./')).
    use('/images',express.static('./images')).
    use('/lib',express.static('./lib'));
app.use('/test_page',express.static('./static/test_page'));

app.listen(3123);
