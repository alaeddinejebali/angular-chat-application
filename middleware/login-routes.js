/*requie node_modules */
var bodyParser = require('body-parser');
var multer  = require('multer');
var fs = require('fs');
/*Dire à "Multer : pour téléchargement fichiers  " où télécharge les fichiers*/
var upload = multer({ dest: './views/telecharger' });
var method=loginroutes.prototype;
function loginroutes(app,connection,InfoSession){
	var path_File="";
	app.use(bodyParser.urlencoded({
		extended: true}));
	app.use(bodyParser.json());
	app.get('/', function(request, response){
		InfoSession=request.session;
/*Render Login page If session is not set*/
		if(InfoSession.uid){
			response.redirect('/home#?id='+InfoSession.uid);
		}else{
			response.render("login");}});
/*post pour gérer le demande Login */
	app.post('/login', function(request, response){
		InfoSession=request.session;
		username=request.body.username;
		password=request.body.password;
		var data={
			query:"select * from user where name='"+username+"' and  password='"+password+"' ",
			connection:connection
		}
/*Appelle queryrunner pour éxécuter la requete SQL*/
		queryrunner(data,function(resultat){
			var uid="";			
			resultat.forEach(function(element, index, array){
				uid=element.id;
			});
			if(resultat.length>0) {
				InfoSession.uid = uid;
				var set_statut={
					query:"update user set statut='ON' where id='"+uid+"'",
					connection:connection
				}
				queryrunner(set_statut,function(resultat_statut){});	
				envoi_resultat={
			    		is_logged:true,
			    		id:uid,
			    		msg:"OK"
			    };	    	
		    } else {
		    	envoi_resultat={
		    		is_logged:false,
		    		id:null,
		    		msg:"No"};}
		/* Envoi de la réponse au client "JSON.stringify":convertir un objet à une chaine de caractère*/
		    response.write(JSON.stringify(envoi_resultat));
			response.end();
		});
	});

/*post:pour gérer la demande de disponibilité d'utilisateur*/
	app.post('/verif_nom', function(request, response){
		username=request.body.username;		
		var data={
			query:"select * from user where name='"+username+"'",
			connection:connection
		}
		queryrunner(data,function(resultat){
			if(resultat.length>0) {
		    	envoi_resultat={
		    		msg:true
		    	};
		    } else {
		    	envoi_resultat={
		    		msg:false
		    	};
		    } 
		    response.write(JSON.stringify(envoi_resultat));
			response.end();});});
/*post pour gérer la demade d'enregistrement */
	app.post('/register', upload.single('file'), function(request, response, next){
		InfoSession=request.session;
		/*Télécharhement fichier*/
		var path_File = './views/telecharger/' + Date.now()+request.file.originalname;
		var nom_file = '/telecharger/' + Date.now()+request.file.originalname;
		var temp_path = request.file.path;
		var src = fs.createReadStream(temp_path);
		var dest = fs.createWriteStream(path_File);		
		src.pipe(dest);
		src.on('end', function() {
			/*Quand téléchargement terminer , inserer User	*/
			var insertData = {
				id:'',
				name:request.body.username,
				password:request.body.password,
				photo:nom_file,
				timestamp:Math.floor(new Date() / 1000),
				statut:'ON',
				mail:request.body.mail
			};
			var data={
				query:"INSERT INTO user SET ?",
				connection:connection,
				insertData:insertData
			};		
			queryrunner(data,function(resultat){
				//Stoker ID session
				InfoSession.uid = resultat.insertId;
				if(resultat) {
					envoi_resultat={
			    		is_logged:true,
			    		id:resultat.insertId,
			    		msg:"OK"
			    	};
				}else{
					envoi_resultat={
			    		is_logged:false,
			    		id:null,
			    		msg:"NO"
			    	};
				}
				response.write(JSON.stringify(envoi_resultat));
				response.end();		
			});
		});
		src.on('error', function(erreur) { 
			/*Erreur d'envoi*/
			response.write(JSON.stringify("Error"));
			response.end(); 
		});
	});
	/*post pour gérer demande déconnexion*/
}method.getloginroutes=function(){
	return this;}
module.exports = loginroutes;
/* Faire fonctionner queryrunner pour exécuter des requêtes mysql */
var queryrunner=function(data,call){
	var connexionDB=data.connection;
	var query=data.query;
	var insertData=data.insertData;
	connexionDB.getConnection(function(erreur,conx){
		if(erreur){
		  conx.release();
		}else{
			connexionDB.query(String(query),insertData,function(erreur,rows){
		    conx.release();
		    if(!erreur) {
		    	call(rows);
		    } else {
		      console.log(erreur);  
		      console.log("Query failed");  } });}})}