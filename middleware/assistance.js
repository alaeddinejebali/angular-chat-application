var CnxDB={
	queryRunner:function(data,call){
/* Fonction requise pour exécuter toutes les requêtes.*/
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
			      console.log("Query failed");}});}});},
/*Fonction pour obtenir la dernière ID de disscussion.*/
	getDisscussion_Id:function(connection,call){
		var data={
			query:"SELECT MAX(con_id) as ID FROM disscussion",
			connection:connection
		}
		CnxDB.queryRunner(data,function(result){
			if(result[0].ID!=null){
				var disscussionid=parseInt(result[0].ID);
				disscussionid++;
				call({
					ID:disscussionid});} else{
				call({
					ID:0});}})},
	
	/*Fonction pour vérifier si disscussion est présente dans le tableau "disscussion" DB*/
	verifDisscussion:function(data,connection,call){
		var verif=false;
		var con_id="";
		var verif_data={
			query:"select * from disscussion where to_id='"+data.to_id+"' and from_id='"+data.from_id+"' or to_id='"+data.from_id+"' and from_id='"+data.to_id+"' limit 1",
			connection:connection
		}
		CnxDB.queryRunner(verif_data,function(result){
			if(result.length>0){
				verif=true;
				con_id=result[0].con_id;
			} else{ 
				verif=false;
				con_id=0
			}
			call({
				verif:verif,
				con_id:con_id});});},

	/*Fonction pour inserer disscussion*/	
	insertDisscussion:function(data,connection,call){
		var insertDisscussion={
			query:"INSERT INTO disscussion SET ?",
			connection:connection,
			insertData:{
				id:'',						
				from_id:data.from_id,
				to_id:data.to_id,
				timestamp:Math.floor(new Date() / 1000),
				con_id:data.con_id,}};
		CnxDB.queryRunner(insertDisscussion,function(result){
			call(result.insertId);});},
	/*Fonction pour inserer messages.*/
	insert_msg:function(data,connection,call){
		var data_insert={
			query:"INSERT INTO disscussion_reponse SET ?",
			connection:connection,
			insertData:{
				id:'',						
				reponse:data.msg,
				from_id:data.from_id,
				to_id:data.to_id,
				timestamp:Math.floor(new Date() / 1000),
				con_id:data.con_id}};	
		CnxDB.queryRunner(data_insert,function(result){
			console.log("msg inserted");
			call(result)});},
/*Séparez la fonction pour insérer les messages et la disscussion dans DB (juste pour rendre notre code court).*/
	 msgDisscussion:function(data,connection,call){
		var disscussion_data={
			to_id:data.to_id,
			from_id:data.from_id,
			con_id:data.disscussion_id}		
/* Appel 'CnxDB.insert_msg' pour inserer messages */
		CnxDB.insertDisscussion(disscussion_data,connection,function(is_insert_disscussion){	
			var insert_msg={
				id:'',
				msg:data.msg,
				from_id:data.from_id,
				to_id:data.to_id,
				timestamp:Math.floor(new Date() / 1000),
				con_id:data.disscussion_id
			}
			CnxDB.insert_msg(insert_msg,connection,function(is_insert_msg){
				call({
					msg:data.msg,
					from_id:data.from_id,
					to_id:data.to_id,
					timestamp:Math.floor(new Date() / 1000)});})});},
							
/*	Appeler fonction "CnxDB.verifDisscussion" ,pour vérifier, si la disscussion est déjà présente ou non*/
	save_msg:function(data,connection,call){
		var check_data={
			to_id:data.to_id,
			from_id:data.from_id
		}
	/* Vérifier si 'disscussion' est presente dans DB (dans la table disscussion)*/
		CnxDB.verifDisscussion(check_data,connection,function(verif){
			if(verif.verif){
				var msg_after_disscussion={
					to_id:data.to_id,
					from_id:data.from_id,
					msg:data.msg,
					disscussion_id:verif.con_id};
/* Appeler 'CnxDB.msgDisscussion' pour inserer  message et disscussion(info disscussion)*/
				CnxDB.msgDisscussion(msg_after_disscussion,connection,function(insert_con_msg){
					CnxDB.getInfoUser(data.from_id,connection,function(UserInfo){
						insert_con_msg.name=UserInfo.data.name;
						call(insert_con_msg);});});} else{
/* Appele 'CnxDB.getDisscussion_Id' pour obtenir la dernière ID de disscussion*/	
				CnxDB.getDisscussion_Id(connection,function(con_id){
					var msg_after_disscussion={
						to_id:data.to_id,
						from_id:data.from_id,
						msg:data.msg,
						disscussion_id:con_id.ID};
/* Apple 'CnxDB.msgDisscussion' pour inserer message et disscussion*/
					CnxDB.msgDisscussion(msg_after_disscussion,connection,function(insert_con_msg){
						CnxDB.getInfoUser(data.from_id,connection,function(UserInfo){
							insert_con_msg.name=UserInfo.data.name;
							call(insert_con_msg);});});});}});},
/*Fonction pour obtenir des messages.*/
	getMsg:function(data,connection,call){
		var data={
			query:"select reponse as msg,from_id,to_id,timestamp from disscussion_reponse where from_id='"+data.from_id+"' and to_id='"+data.uid+"' or  from_id='"+data.uid+"' and to_id='"+data.from_id+"' order by timestamp asc",
			connection:connection
		}
		CnxDB.queryRunner(data,function(result){
			if(result.length > 0){
				call(result)
			} else{
				call(null);}});},
/*Fonction pour obtenir information user.*/
	getInfoUser:function(uid,connection,call){
		var data={
			query:"select id,name,photo,statut from user where id='"+uid+"'",
			connection:connection
		}
		CnxDB.queryRunner(data,function(result){
			if(result.length>0) {
				var Info_User="";			
				result.forEach(function(element, index, array){
					Info_User={
						name:element.name,
						photo:element.photo,
						statut:element.statut};});
		    	envoi_resultat={
		    		data:Info_User,
		    		msg:"OK"};
		    } else {
		    	envoi_resultat={
		    		data:null,
		    		msg:"No"
		    	};}
		   call(envoi_resultat);});},

	/*Fonction pour obtenir List de Chat.*/	   
	getChatList:function(uid,connection,call){
		var data={
			query:"select DISTINCT con_id from disscussion where to_id='"+uid+"' or from_id='"+uid+"' order by timestamp desc ",
			connection:connection
		}
		CnxDB.queryRunner(data,function(result){
			var UsersTab=[];
			if(result.length>0){
				result.forEach(function(element, index, array){
					var data={
						query:"select u.* from disscussion as c left join user as u on \
								  u.id =case when (con_id='"+element.con_id+"' and to_id='"+uid+"') \
								THEN \
								  c.from_id \
								ELSE \
								  c.to_id \
								END \
								where con_id='"+element.con_id+"' and to_id='"+uid+"' or con_id='"+element.con_id+"' and from_id='"+uid+"' limit 1",
						connection:connection
					}
					CnxDB.queryRunner(data,function(usersData){
						if(usersData.length>0){
							UsersTab.push(usersData[0]);							
						}
						if(index >= (result.length-1)){
							call(UsersTab);}});});
			}else{
				call(null);}});},
	/*Fonction liste nouveau chat*/
	getToChat:function(uid,connection,call){
		var data={
			query:"SELECT  to_id, from_id FROM disscussion WHERE to_id='"+uid+"' OR from_id='"+uid+"' GROUP BY con_id DESC  ",
			connection:connection
		}
		CnxDB.queryRunner(data,function(result){
			var UsersTab=[];
			if(result.length>0){
				var filter=[];
				result.forEach(function(element, index, array){
					filter.push(element['to_id']);
					filter.push(element['from_id']);
				});
				filter=filter.join();
				data.query="SELECT * FROM user WHERE id NOT IN ("+filter+")";
			}else{
				data.query="SELECT * FROM user WHERE id NOT IN ("+uid+")";
			}
			CnxDB.queryRunner(data,function(usersData){
				call(usersData);});});},
	/*Fonction por fusionner les utilisateurs en ligne et hors ligne.*/
	merge_user:function(socketUsers,UsersTab,newUsers,call){
		var OffOnUser = [];
		for(var i in socketUsers){
			var shouldAdd = false;
			for (var j in UsersTab){
				if(newUsers=='yes'){
					if (UsersTab[j].id == socketUsers[i].id) {
						shouldAdd = false;
						UsersTab.splice(j,1); 						
						break;}}else{
					if (UsersTab[j].id == socketUsers[i].id) {
						UsersTab[j].socketId = socketUsers[i].socketId;
						shouldAdd = true;
						break; }}}
			if(!shouldAdd){				
				OffOnUser.push(socketUsers[i]);}
		}if(newUsers=='no'){
			OffOnUser = OffOnUser.concat(UsersTab);
		}else{
			OffOnUser = UsersTab;
		}
		call(OffOnUser);}}
module.exports = CnxDB;