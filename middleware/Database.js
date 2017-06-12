/*require mysql node_modules */
var mysql = require("mysql");

var method = db.prototype;

function db() {

/* Création de connexion base de donnée*/
	var conx = mysql.createPool({
		host : 'localhost',
	  	user : 'root',
	  	password : '',
	  	database : 'chat'
	});
	this.connection=conx;
}
method.getcon = function() {
	return this;
};

module.exports = db;
