// fichier "assistance " pour exécuter des fonctions d
var assistance = require('./assistance');
var bodyParser = require('body-parser');
exports.assistance = assistance;
var method=homeRoutes.prototype;
function homeRoutes(app,connection,io,InfoSession){
	app.use(bodyParser.urlencoded({
		extended: true
	}));
	app.use(bodyParser.json());
	// creations de tableaux users.
	var users=[];
	var uid=""; 
	/*Evenement Socket*/
	io.on('connection',function(socket){
		var Socket_uid=socket.request.session.uid;
		//Stocker les utilisateurs dans le tableau en tant qu'objet
	    socket.on('UserInfo',function(User_Info){
			//variable ajouter pour vérifier si user est bien ajouter
			var ajouter=true;
	    	if(users.length == 0){
	    		User_Info.socketId=socket.id;
	    		users.push(User_Info);
	    	}else{
	    		users.forEach(function(element, index, array){
				if(User_Info !== null){
						if(element.id == User_Info.id){
							ajouter=false;}}
				});
				//if(User_Info !== null){
				if (ajouter) {
					User_Info.socketId=socket.id;
	    			users.push(User_Info);};}

	    	var data={
				query:"update user set statut='ON' where id='"+User_Info.id+"'",
				connection:connection
			}
			assistance.queryRunner(data,function(resultat){
		/*Liste d'envoi d'utilisateurs à tous les utilisateur*/
				users.forEach(function(element, index, array){
		    		assistance.getChatList(element.id,connection,function(sendUsers){
		    			if(sendUsers === null){
		    				io.to(element.socketId).emit('userEntrance',users);
		    			}else{
		    				assistance.merge_user(users,sendUsers,'no',function(mergedUsers){
		    					io.to(element.socketId).emit('userEntrance',mergedUsers);});}});});	});
	    	ajouter=true; });    

	   	/*'sendMsg' sauvera les messages en DB.	*/
	   	socket.on('sendMsg',function(data_DB){
	    	/*appelle save_msg pour enregistrer msgs dansDB.*/
	    	assistance.save_msg(data_DB,connection,function(resultat){
	    		/*vérifier le statuts onligne ou horsligne de users*/
	    		if(data_DB.socket_id==null){
	    			/*si horsligne mettre à jours la liste de chat de l'expéditeur. */
	    			var singleUser=users.find(function(element){
	    				return element.id == data_DB.from_id;
	    			});	
	    			/*Apple 'getChatList' pour obtenir une liste de chat utilisateur*/
					assistance.getChatList(singleUser.id,connection,function(sendUsers){
			    		if(sendUsers === null){
			    			io.to(singleUser.socketId).emit('userEntrance',users);
			    		}else{
			    			/*apple 'merge_user' */
			    			assistance.merge_user(users,sendUsers,'no',function(mergedUsers){
			    				io.to(singleUser.socketId).emit('userEntrance',mergedUsers);
			    			});
			    		}	    			
			    	});
				}else{
					/*envoie un message au destinataire*/
	    			io.to(data_DB.socket_id).emit('getMsg',resultat);}});});
	    
		/*Envoi de notification de saisie à l'utilisateur.*/
	    socket.on('setNotification',function(data_DB){	    			
	    	io.to(data_DB.data_socket_fromid).emit('getNotification',data_DB);
	    });
	    /*Supprimez l'utilisateur lorsque l'utilisateur se déconnecte */
	    socket.on('disconnect',function(){
	    	var Idsplice="";
	    	for(var i=0;i<users.length;i++){
				if(users[i].id==Socket_uid){
					if(users[i].socketId==socket.id){					
					  	var data={
							query:"update user set statut='OFF' where id='"+users[i].id+"'",
							connection:connection
						}
						Idsplice=i;
						assistance.queryRunner(data,function(resultat){
							users.splice(Idsplice,1); 
							io.emit('exit',users[Idsplice]);});}}}});});
	/*Home page */
	app.get('/home',function(request, response){
		InfoSession=request.session;
		if(!InfoSession.uid){
			response.redirect("/");	
			response.end();	
		}else{
			/*response.redirect('/home#?id='+InfoSession.uid);*/
			response.render('home');
			response.end();}});
	/*post pour traiter demande get_UserInfo*/
	app.post('/get_UserInfo', function(request, response){
		var data={
			query:"select id,name,photo,statut from user where id='"+request.body.uid+"'",
			connection:connection
		}
		assistance.queryRunner(data,function(resultat){
			if(resultat.length>0) {
				var Info_User="";			
				resultat.forEach(function(element, index, array){
					Info_User=element;
				});
		    	envoi_resultat={
		    		is_logged:true,
		    		data:Info_User,
		    		msg:"OK"
		    	};
		    } else {
		    	envoi_resultat={
		    		is_logged:false,
		    		data:null,
		    		msg:"NO"
		    	};
		    }   
		    response.write(JSON.stringify(envoi_resultat));
			response.end();
		});
	});

	/*post pour traiter demande get_msgs*/
	app.post('/get_Messages', function(request, response){
		/*get_recent_chats Appellle 'getMsg' pour avoir les  messages*/
		assistance.getMsg(request.body,connection,function(resultat){
			response.write(JSON.stringify(resultat));
			response.end();});});
	/*post pour traiter demande get_New_Chats */
	app.post('/get_New_Chats', function(request, response){
	/*Applle 'getChatListt' pour oblenir liste chat*/
		assistance.getChatList(request.body.uid,connection,function(sendUsers){
			response.write(JSON.stringify(sendUsers));
			response.end();});});
	/*post pour traiter demande get_Users_Chats*/
	app.post('/get_Users_Chats', function(request, response){
		/*Appelle 'getToChat' pour avoir list de chat user */
		assistance.getToChat(request.body.uid,connection,function(sendUsers){
		/*Appelle 'merge_user' */
			assistance.merge_user(users,sendUsers,'yes',function(mergedUsers){
	    		response.write(JSON.stringify(mergedUsers));
	    		response.end();});});});
	
	app.get('/logout', function(request, response){
		InfoSession=request.session;
		var uid=InfoSession.uid;
		
		var data={
			query:"update user set statut='OFF' where id='"+uid+"'",
			connection:connection
		}
		assistance.queryRunner(data,function(resultat){

			request.session.destroy(function(erreur) {
				if(erreur) {
			    	console.log(erreur);
			  	} else {
			  		io.emit('exit',1);
					response.redirect('/');
			  	}});});});}
method.gethomeRoutes=function(){
	return this;
}
module.exports = homeRoutes;
