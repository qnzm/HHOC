var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var MessageSchema = new Schema({ name: String, value: String, date: Date });
mongoose.model('Message', MessageSchema);

var express = require('express') 
, routes = require('./routes')
var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);
app.configure(function(){
		app.set('views', __dirname + '/views');
		app.set('view engine', 'ejs');
		app.use(express.bodyParser());
		app.use(express.methodOverride());
		app.use(app.router);
		app.use(express.static(__dirname + '/public'));
		});
app.configure('development', function(){
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
		});
app.configure('production', function(){
		app.use(express.errorHandler()); 
		});
app.get('/', routes.index);

io.sockets.on('connection', function(socket){
		console.log('connection')
		socket.on('start', function(name){
			console.log('start')
			socket.set('nickname', name, function(){
				console.log('ret')

				mongoose.connect('mongodb://localhost/chat');
				var Message = mongoose.model('Message');
				Message.find(10, function(err, docs){
					if(!err)
					{
						for(var i  = 0; i < docs.length; i++){
							var d = docs[i];
							socket.json.emit('ret', { name: d.name, value: d.value });
						}
						socket.broadcast.json.emit('ret', { name: name, value: 'sign in' });
					}
					else
					{
						console.log(err);
					}
					socket.json.emit('ret', { name: name, value: 'sign in' });
					});
			});
		});
		socket.on('push', function(data){
			socket.get('nickname', function(err, name){
				socket.broadcast.json.emit('ret', { name: name, value: data.value} );

				mongoose.connect('mongodb://localhost/chat');
				var Message = mongoose.model('Message');
				var msg = new Message();
				msg.name = name;
				msg.value = data.value;
				msg.date = new Date();
				msg.save(function(err){ if(!err){ console.log('saved'); }else{ console.log(err); } });
				console.log('ret')
			});
		});
});
app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

