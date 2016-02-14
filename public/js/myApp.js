var app = angular.module('myApp',['btford.socket-io'],function($compileProvider){
   $compileProvider.directive('compile', function($compile) {
     return function(scope, element, attrs) {
       scope.$watch(
         function(scope) {
           return scope.$eval(attrs.compile);
         },
         function(value) {
           element.html(value);
           $compile(element.contents())(scope);
         }
       );
     };
   });
 });

app.factory('Excel',function($window){
  var uri='data:application/vnd.ms-excel;base64,',
    template='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>',
    base64=function(s){return $window.btoa(unescape(encodeURIComponent(s)));},
    format=function(s,c){return s.replace(/{(\w+)}/g,function(m,p){return c[p];})};
  return {
    tableToExcel:function(tableId,worksheetName){
          var table=document.querySelector(tableId),
              ctx={worksheet:worksheetName,table:table.innerHTML},
              href=uri+base64(format(template,ctx));
          return href;
    }
  };
});


app.factory('mySocket', function (socketFactory) {
    return socketFactory();
  });

var device_list = [];
var devices_data = [];

app.controller('Characters',['$scope','$http','mySocket','Excel','$timeout',function($scope,$http,socket,Excel,$timeout){

    $scope.page_graph={};
    $scope.page_change = function(page){
      $scope.page_graph = page;}

    socket.on('connect',function(){
      socket.emit('brower_connect','testBrowser');
      socket.emit('database_check');

    });

    socket.on('device_list',function(device_info){

      $scope.names = device_info.devices;
      devices_data = device_info.data;
      console.log(device_info);

      angular.forEach(device_info.devices,function(name){
          $scope.info[name] = new Array();
          for ( var i =1 ; i<device_info.data[name].length; i++ ){
          $scope.info[name].push(Object.keys(device_info.data[name][i]));
        };
      });

    });
    $scope.names = [];
    $scope.info = [];


//-----------------------------------------------------

    var dps=[];
    var opt=[];
    var chart=[];

    $scope.dataLength = 100;

    $scope.setGraph = function(){
            var device_name = this.name;
            var data = devices_data[device_name];
            var chart_id = [];

            opt[device_name] = new Array;
            dps[device_name] = new Array;
            chart[device_name] = new Array;

            for (var i=1;i<data.length;i++){

                dps[device_name][i-1] = new Array;

                opt[device_name][i-1] = {
                  zoomEnabled: true,
                  animationEnabled: true,
                  title:{
                    text: Object.keys(data[i])[0]
                  },
                  axisY2:{
                    valueFormatString:"0.0",
                //    maximum: 1.2,
                //    interval: .2,
                    interlacedColor: "#F5F5F5",
                    gridColor: "#D7D7D7",
                    tickColor: "#D7D7D7"
                  },
                  theme: "theme2",
                  toolTip:{
                    shared: true
                  },
                  legend:{
                    verticalAlign: "bottom",
                    horizontalAlign: "center",
                    fontSize: 15,
                    fontFamily: "Lucida Sans Unicode"

                  },
                  data: []

                };

              for (var j =0;j< Object.keys(data[i][Object.keys(data[i])[0]]).length; j++){
                dps[device_name][i-1][j]=new Array();
                opt[device_name][i-1].data.push({
                  type: "line",
                  lineThickness:3,
                  axisYType:"secondary",
                  showInLegend: true,
                  name: Object.keys(data[i])[0]+'.'+Object.keys(data[i][Object.keys(data[i])[0]])[j],
                  dataPoints: dps[device_name][i-1][j]});
              }

              chart_id[i-1] = "chart_box" + device_name + Object.keys(data[i]);
              chart[device_name][i-1] = new CanvasJS.Chart(chart_id[i-1],opt[device_name][i-1]);
              chart[device_name][i-1].render();
            }
        };


        socket.on('data from dev', function (pulse_obj) {
          var device_name = pulse_obj.device_name;
          var data = pulse_obj.data;
          console.log(pulse_obj);
          console.log(pulse_obj.data);
                for (var i=1; i<data.length ; i++){
                  for (var j =0;j< Object.keys(data[i][Object.keys(data[i])[0]]).length; j++){
                      dps[device_name][i-1][j].push({x:data[0].time, y:data[i][Object.keys(data[i])[0]][Object.keys(data[i][Object.keys(data[i])[0]])[j]]})
                      if (dps[device_name][i-1][j].length > $scope.dataLength)
                        {
                          dps[device_name][i-1][j].shift();
                        }
                    }
                    chart[device_name][i-1].render();
                }
                console.log($scope.dataLength);
        });




//--------------------------------------------------------------
        $scope.database_check = function(){
          socket.emit('database_check')
        };

        socket.on('database_info',function(database_info){
          console.log(database_info);
          $scope.db_info = database_info;
          $scope.db_names = Object.keys(database_info);
        });

//---------------------------------------------------------------
/*
        $scope.call_db = function(index){
            if(!$scope.page_graph){
              $scope.clearDatabase();

            var request_data = {
              db_name : $scope.current_db_name,
              date_of_ex : $scope.current_date_of_ex,
              order_of_ex : index+1
              }
            socket.emit('database_request',request_data);
            console.log(request_data);
          }
        }
        socket.on('res_db',function(res_db_data){
            $scope.db_data = res_db_data;

            make_table_header(es_db_data[0].data[0]);

          })
*/

        $scope.Data_request_to_DB = function(index){
          if(!$scope.page_graph){

            $scope.clearDatabase();
            $scope.req_number = index;

          var request_data = {
            db_name : $scope.current_db_name,
            date_of_ex : $scope.current_date_of_ex,
            order_of_ex : index+1
            }
          $http.post('/app/db',request_data)
            .success(function(data,staus,headers,config){

              $scope.db_data = data;

            }).error(function(data,staus,headers,config){
            })
            console.log(request_data);
          }
        }
        $scope.exportToExcel=function(tableId){ // ex: '#my-table'
              var exportHref=Excel.tableToExcel(tableId,'sheet name');
              $timeout(function() {
                var link = document.createElement('a');
                link.download = $scope.current_db_name+'_'+$scope.current_date_of_ex+'_'+($scope.req_number+1)+".xls";
                link.href = exportHref;
                link.click();
              }, 100)};
      $scope.db_data = '';
      $scope.req_number = '';
//---------------------------------------------------------------

      $scope.clearDatabase = function(){
        $scope.db_data = '';
        $scope.req_number = '';
      }

      $scope.setTableTab = function(){
        var temp =[];
        $scope.current_number_of_ex=[];
        for ( var i = 0 ; i < this.info.number_of_ex ;i ++ ){
            temp[i] = "Take" + (i+1);
        }
        $scope.current_number_of_ex = temp;
        $scope.current_date_of_ex = this.info.date_of_ex;
        $scope.current_db_name = this.db_name;
      }

     $scope.db_info = {};
     $scope.db_names = [];

     $scope.current_number_of_ex = [];
     $scope.current_db_name ={};
     $scope.current_date_of_ex ={};

}]);
//-----------------------------------------------------

app.controller('Device_controller',['$timeout','$scope','mySocket',function($timeout,$scope,socket){

    $scope.sampling_time = 30;
    $scope.sampling_rate = 5;
    $scope.disable = false;

    $scope.startSend = function(){
      socket.emit('start to send',
         {sampling_rate:$scope.sampling_rate,
         sampling_time:$scope.sampling_time,
         device_name:this.name
         });
     $timeout(function(){ $scope.disable = false ;},$scope.sampling_time*1000)
   }
}]);

//-----------------------------------------------------

app.directive('richTabs',function(){
    return{
      restrict: 'E',
      transclude: true,
  //    scope: {},
      controller: function($scope){
        var photos = $scope.photos = [];

        $scope.select = function($scope){
          angular.forEach(photos, function(photo){
            photo.selected = false;
          });
          $scope.selected = true;
        };

        this.addPhoto = function(photo){
          photos.push(photo);

        }
        this.removePhoto = function(photo){
          var ix = photo.list.indexOf(photo.title);
          photos.splice(ix);

        }
      },templateUrl: '../template/richTabs.html'
    };
  }).
  directive('richPane',function(){
    return{
      require: '^richTabs',
      restrict: 'E',
      transclude: true,
      scope: {title: '@', list: '='},
      link: function(scope,elem,attrs,photosControl){
        photosControl.addPhoto(scope);

        elem.on('$destroy',function(){
            photosControl.removePhoto(scope);
          })

      },
      template:
      '<div ng-show="selected" ng-transclude></div>'
    };
});
