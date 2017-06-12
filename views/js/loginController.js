var app = angular.module('loginEnregister',[]);

app.controller('loginEnregister', function ($scope,$http,$timeout,$window) {	

    
    
    /**************** Déclaration varibles ********************/
    
    $scope.LoginBox=false; 
    $scope.LoginAlert=true;
    $scope.RegisterAlert=true;
    $scope.RegisterBox=true;
    
    /*********** Vérification Identifiant*****************/
    var TypeTimer;                
    var TypingInterval = 1000;
   
    
    /* **********Cacher la boîte de connexion et d'inscription***************** */
    $scope.toggle_register = function() {
        $scope.RegisterBox = !$scope.RegisterBox;
        $scope.LoginBox = !$scope.LoginBox;
    };
    $scope.toggle_login = function() {
        $scope.LoginBox = !$scope.LoginBox;
        $scope.RegisterBox = !$scope.RegisterBox;
    };
/**************** Se loguer********************/
    $scope.login = function(){
        var data={
            username:$scope.username,
            password:$scope.password
        }

        $http.post('/login',data).success(function(data, status, headers, config) {
            if(data.is_logged){
                $scope.LoginAlert = true;
                $window.location.href = "/home#?id="+data.id;
            }else{
                $scope.LoginAlert = false;
            }
        }).error(function(data, status) {
            alert("Connection Error");
        });
    };
 /* *****Vérification des identifiants*************/
    $scope.keyup_uncheck = function() {
        $timeout.cancel(TypeTimer);
        TypeTimer=$timeout( function(){
            var data={
                username:$scope.username
            }
            etc_function.check_username(data);            
        }, TypingInterval);
    };
    $scope.keydown_uncheck = function(){
        $timeout.cancel(TypeTimer);
    };
   
    $scope.blur_uncheck = function(){
        var data={
            username:$scope.username
        }
        etc_function.check_username(data);
        $timeout.cancel(TypeTimer); 
    };

 /****************** S'inscrire******************************/
    $scope.register = function(){
        var file_ext=["image/png","image/jpg","image/jpeg","image/gif"];
        var file_type_ok=true;
        var file = $scope.myFile;
        var file_size=Math.round(file.size/1024);

        file_ext.forEach(function(element, index){
            if(element===(file.type).toLowerCase()){
                file_type_ok=false;
            }
        });
        
        if(file_size>500){
            alert("taille maximum 500 KB.");
        }else if(file_type_ok){
            alert("Télécharger une photo.");
        }
        else{
            var fd = new FormData();
            fd.append('file', file);
            fd.append('username',$scope.username);
            fd.append('password',$scope.password);
            fd.append('mail',$scope.mail);
            $http.post("/register", fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            })
            .success(function(data, status, headers, config) {
                if(data.is_logged){
                    $scope.LoginAlert = true;
                    $window.location.href = "/home#?id="+data.id;
                }else{
                    $scope.LoginAlert = false;
                }
            })
            .error(function(){
                alert("Connection Error");
            });
        }
    };
   
    /*****fonction alerte supplimentaire ****************************************/
    var etc_function={
        check_username:function(data){
            $http.post('/verif_nom',data).success(function(data, status, headers, config) {
                if( !data.msg ){
                    $scope.RegisterAlert = true;
                }else{
                    $scope.RegisterAlert = false;
                }
            }).error(function(data, status) {
                alert("Connection Error");
            });
        }
    }
});

/*********Directive pour téléchargement de fichier*************************************/
app.directive('fileModel', ['$parse', function ($parse) {
    return {
       restrict: 'A',
       link: function(scope, element, attrs) {
          var model = $parse(attrs.fileModel);
          var modelSetter = model.assign;
          
          element.bind('change', function(event){
             scope.$apply(function(){
                var files = event.target.files;
                /* 
                   
                */  
                angular.element( document.querySelector( '#selectedFile' )).html(files[0].name);
                modelSetter(scope, element[0].files[0]);
             });
          });
       }
    };
}]);


    