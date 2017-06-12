/*node_module starts */

var app = require("express")();
var http = require('http').Server(app);
var io = require("socket.io")(http);
var Session = require('express-session');
var cookieParser = require('cookie-parser'); 


// La session stockée dans un cookie
app.use(cookieParser());

var Session= Session({
	secret:'secrettokenhere',
	saveUninitialized: true,
	resave: true
});


io.use(function(socket, next) {
	    Session(socket.request, socket.request.res, next);
});

app.use(Session);

var InfoSession;

/* déclaration fichier de configuration */
var config =require('./middleware/config.js')(app);
/* *************************/

/* déclaration fichier "Database.js"  pour la configuration de base de donnée */
var Database = require("./middleware/Database.js");
var connection_object= new Database();
var connection=connection_object.connection; // oobjet connexion  

/*
1. Exiger le fichier login-routes.js, qui prend en charge toutes les opérations de la page de connexion et d'enregistrement.
2. Passer un objet d'express, connexion à la base de données, expressSession et cookieParser.
3. login-routes.js contient les méthodes et les itinéraires pour la page de connexion et d'inscription.
*/

require('./middleware/login-routes.js')(app,connection,Session,cookieParser,InfoSession);

/* 
	1. Requis du fichier homeRoutes.js, qui prend en charge l'opération de la page d'accueil.
    2. Passer l'objet d'express, la connexion à la base de données et l'objet de socket.io comme 'io'.
    3. routes.js contient les méthodes et les itinéraires pour la page d'accueil 
*/

require('./middleware/homeRoutes.js')(app,connection,io,Session,cookieParser,InfoSession);

/*
	Exécution de notre application , numéro de port 8866 
*/
http.listen(8866,function(){
    console.log("Listening on localhost:8866");
});