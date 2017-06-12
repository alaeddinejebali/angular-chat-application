 var app = angular.module('home',['ngAnimate', 'toaster','ngEmoticons']);
 
/* ********************************************* */
app.factory('socket', function ($rootScope) {
	var socket = io.connect();
	return {
		on: function (eventName, call) {
			socket.on(eventName, function () {  
				var args = arguments;
				$rootScope.$apply(function () {
			  		call.apply(socket, args);
				});
		  	});
		},
		emit: function (eventName, data, call) {
		  	socket.emit(eventName, data, function () {
				var args = arguments;
				$rootScope.$apply(function () {
			  		if (call) {
						call.apply(socket, args);
			  		}
				});
		  	})
		}
  	};
});

/* service pour exécuter ajax ****************************/
app.service('runajax', ['$http', function ($http) {
  this.runajax_function = function(request,call){
	var url=request.url;
	var data_DB=request.data_DB;
	$http.post(url,data_DB).success(function(data, status, headers, config) {
	  call(data);
	})
	.error(function(){
	  call("data");
	});
  }
}]);

/* Directive pour envoyer "is Typing......." */
app.directive('sendTypingNotification', function () {
  return{
	require: 'ngModel',
	restrict: 'A',
	link:function (scope, element, attrs,ctrl) {
	  element.bind("keydown keypress", function (event) {
		scope.CnxDB.sendTypingNotification(event.type);
		scope.send_text=element.val();
	  });
	  scope.$watch(attrs.updateModel, function(value) {
		ctrl.$setViewValue(value);
		ctrl.$render();
	  });
	}
  }      
});

app.controller('home', function ($scope,$location,$window,$sce,$timeout,toaster,socket,runajax) {
  
	$scope.show_userinfo=""; 
  	$scope.ListUser=""; 
  	$scope.ListNouveauUser="";
  	$scope.uid=""; 
  	$scope.hightlight_id="";
  	$scope.hightlight_socket_id="";
  	$scope.envoi_a_userinfo="";
  	$scope.send_to_user_name="";
  	$scope.send_text;
  	$scope.msgs=[];

	/* ******************************************/
	$scope.CnxDB={
		getInfoUser: function(call){
			var uid=$location.search()['id'];
			$scope.uid=uid;
			var data={
				url:'/get_UserInfo',
				data_DB:{
					uid:uid
				}
			};
			runajax.runajax_function(data,function(userdata){        
				$scope.show_userinfo=userdata;        
				call(userdata);
			});
		},
		getChatList: function(call){
			var uid=$location.search()['id'];
			$scope.uid=uid;
			var data={
				url:'/get_New_Chats',
				data_DB:{
					uid:uid
				}
			};
			runajax.runajax_function(data,function(userdata){
				call(userdata);
			});
		},
		getToChats:function(call){
		  var uid=$location.search()['id'];
		  $scope.uid=uid;
		  var data={
			url:'/get_Users_Chats',
			data_DB:{
			  uid:uid
			}
		  };
		  runajax.runajax_function(data,function(userdata){
			call(userdata);
		  });
		},
		getMsg:function(msgs_userinfo,call){
		  var data={
			url:'/get_Messages',
			data_DB:{
			  uid:$scope.uid,
			  from_id:msgs_userinfo.id
			}
		  }
		  runajax.runajax_function(data,function(userdata){        
			call(userdata);
		  });
		},
		scrollDiv:function(){
		  var scrollDiv = angular.element( document.querySelector( '.msg-container' ) );
		  $(scrollDiv).animate({scrollTop: scrollDiv[0].scrollHeight}, 900);
		},
		sendTypingNotification:function(eventName){
		  var TypeTimer;                
		  var TypingInterval = 2000;
		  var data_DB={
			  data_uid:$scope.uid,
			  data_fromid:$scope.hightlight_id,
			  data_socket_fromid:$scope.hightlight_socket_id
			}; 
		  if ( eventName=="keypress" ) {
			$timeout.cancel(TypeTimer);
			data_DB.event_name='keypress';
			socket.emit('setNotification',data_DB);
		  }else {
			TypeTimer=$timeout( function(){
			  data_DB.event_name='keydown';
			  socket.emit('setNotification',data_DB);
			}, TypingInterval);
		  }
		}
	};

	/*obtenir des informations utilisateur ainsi que invoque  liste de discussion */
	$scope.CnxDB.getInfoUser(function(User_Info){
		socket.emit('UserInfo',User_Info.data); // envoyer les info user au serveur 
	});
  
	/* Afficher l'utilisateur sélectionné dans la liste de chat  */ 

	$scope.hightlight_user=function(envoi_a_userinfo){

		$scope.envoi_a_userinfo=envoi_a_userinfo;
		$scope.hightlight_id=envoi_a_userinfo.id;
		$scope.send_to_user_name=envoi_a_userinfo.name; 
		$scope.hightlight_socket_id=envoi_a_userinfo.socketId; 
		
		$scope.CnxDB.getMsg(envoi_a_userinfo,function(resultat){
		  $scope.msgs="";
		  if(resultat != 'null'){
			$scope.msgs=resultat;
		  }
		});
	};

	/*	fonction "Get" lite de chat....*/
	$scope.get_recent_chats=function(){
		$scope.CnxDB.getRecentChats(function(offlineUsers){
			$scope.ListNouveauUser=offlineUsers;
		});
	};

	/*Get  'nouvelle liste ' */
	$scope.get_users_to_chats=function(){
		$scope.CnxDB.getToChats(function(newUsers){
		  $scope.ListNouveauUser=newUsers;
		});
	};

	/*fobtion pour l'envoi des messages*/  
	$scope.send_msg=function(fromModal,socketId,toid){
		if(fromModal==""){
			if($scope.envoi_a_userinfo != ""){
				if($scope.send_text==""){
					alert("Message can't be empty.");
				} else{
					var data={
						socket_id:$scope.envoi_a_userinfo.socketId,
						to_id:$scope.envoi_a_userinfo.id,
						from_id:$scope.uid,
						msg:$scope.send_text
					};

					// envoie des infos user au serveur....................
					socket.emit('sendMsg',data);

					$scope.msgs.push({
						msg:$scope.send_text,
						from_id:$scope.uid,
						to_id:$scope.envoi_a_userinfo.id,
						timestamp:Math.floor(new Date() / 1000)
					});
					$scope.send_text="";
					$scope.CnxDB.scrollDiv();
				}           
			}else{
			  alert("Select a user to send Message.");
			}  
		}else{
			var getMsgText =angular.element( document.querySelector( '#msg_modal'+'_'+toid ) ).val();
			if(getMsgText==""){
				alert("Message can't be empty.");
			}else{
				var data={
					socket_id:null,
					to_id:toid,
					from_id:$scope.uid,
					msg:getMsgText
				};
				socket.emit('sendMsg',data);
			}
		}
	};
	/*Masquer et afficher la boîte de message à l'intérieur de Modal	*/
	$scope.hideShowMsgBox=function(id,action,$event){

		var hideShowEle = angular.element( document.querySelector( '.collapseMsgBox'+'_'+id ) ); 
		var hidEle=angular.element( document.querySelector( '.hideMSgBox'+'_'+id ) );
		var showEle=angular.element( document.querySelector( '.showMSgBox'+'_'+id ) );

		if(action=="hide"){
			hideShowEle.addClass('send-msg-hidden');
			hideShowEle.removeClass('send-msg-show');
			showEle.removeClass('send-msg-hidden');
			showEle.addClass('send-msg-show');
			hidEle.addClass('send-msg-hidden');
			hidEle.removeClass('send-msg-show');
		}else{
			hideShowEle.addClass('send-msg-show');
			hideShowEle.removeClass('send-msg-hidden');
			showEle.addClass('send-msg-hidden');
			showEle.removeClass('send-msg-show');
			hidEle.removeClass('send-msg-hidden');
			hidEle.addClass('send-msg-show');
		}
	}

	
	/*---------------------------------------------------------------------------------
		Sokets
  	---------------------------------------------------------------------------------*/

  	/*	Afficher les messages.***************/
	socket.on('getMsg',function(data){
		if($scope.envoi_a_userinfo != ""){
	  		$scope.CnxDB.getMsg($scope.envoi_a_userinfo,function(resultat){
				$scope.msgs="";
				$scope.msgs=resultat;
				$scope.CnxDB.scrollDiv();
	  		});    
		}

	/* Utilisation  Toaster pour afficher notification */
		toaster.pop('success',data.name+" sent you a message", data.msg,5000);
  	});

	/*	Fonction pour mettre à jour list des users */

  	socket.on('getNotification',function(data){
		if(data.event_name=="keypress"){
	  		angular.element('#isTyping_'+data.data_uid).css('display','block');
		}else{
	  		angular.element('#isTyping_'+data.data_uid).css('display','none');      
		}
  	});

  	socket.on('exit',function(data){
  		$scope.CnxDB.getInfoUser(function(User_Info){
			socket.emit('UserInfo',User_Info.data);  
		});
  	});

  	/*Afficher liste de Chat*****************	*/
	socket.on('userEntrance',function(data){
		$scope.ListUser=data;
  	});
});