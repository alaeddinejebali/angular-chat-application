var express = require("express");
var path= require('path'); 
 
var method=config.prototype;

function config(app){
	
	// Définir .html comme extension de modèle par défaut
	app.set('view engine', 'html');

	// Initialisation de  ejs template engine
	app.engine('html', require('ejs').renderFile);

	// Dire à express où il peut trouver les modèles
	app.set('views', (__dirname + '/../views'));

	//Fichier
	app.use(express.static(path.join('views')));
	
}

method.get_config=function(){
	return this;
}
module.exports = config;

