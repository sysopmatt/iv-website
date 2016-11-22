
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var bodyParser     =        require("body-parser");
var cmd 	=        require("node-cmd");

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

app.post('/',function(req,res){
	  var email=req.body.email;
	  var password=req.body.password;
	  var account=req.body.account;
	  var scheme=req.body.scheme;
	  var options=req.body.options;
	  //cmd.run("node iv-nickname.js -m ptc  -u "+email+" -p "+password+" -f 40");
	  
	  var output;

	  cmd.get(
			  'node iv-nickname.js -m '+account+' -u '+email+' -p '+password+' -s '+scheme,
		        function(data){
				  output = data;
		          console.log('Command executed: \n\n',data);
		        }
		    );
	  console.log("Email = "+email+", password is "+password+", account type is: "+account+", scheme: "+scheme+", options: "+options);
	  //console variable don't forget to put it somewhere cool
	  res.end('done');
	});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

