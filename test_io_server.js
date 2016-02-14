var express = require('express');
var app = express();
var Server = require('http').Server(app);
var io = require('socket.io')(Server);

var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var mongooseToCsv = require('mongoose-to-csv');
var fs = require('fs');

var dateUtils = require('date-utils');

var database_ip = '218.152.175.160'
var db = mongoose.connect('mongodb://'+database_ip+'/jplee');
var Schema = mongoose.Schema;

var recordSchema = new Schema({
  device_name : String,
  date_of_ex : String,
  order_of_ex : Number
});

Records = db.model('record',recordSchema);

//---------------------

app.engine('.html',require('ejs').__express);
app.set('views',__dirname+'/views');
app.set('view engine','html');
app.use(bodyParser());

app.use('/',express.static('./public'))
app.get('/app',function(req,res){
  res.render('myApp.html')
})

app.post('/app/db',function(req,res){
  var request_database = req.body;
  var requested_Schema = new Schema({device_name : String, order_of_ex: Number, data:[]});
  var collection_name = num2char(request_database.date_of_ex.toString());
  var _db = mongoose.connection.useDb(request_database.db_name);
  if((collections[request_database.db_name]!=undefined)&&(date_today==request_database.date_of_ex.toString())){
    var requested_collection = collections[request_database.db_name];
  } else {
    var requested_collection = _db.model(collection_name,requested_Schema);
  }
  requested_collection.aggregate([
    {$match : { order_of_ex : request_database.order_of_ex } },
    {$group : { _id : "$device_name" , data: { $push: "$data" } } }
  ]).exec(function(err,req_db){
    if(!err){
      if(req_db[0]!=undefined){

        var first = req_db[0].data[0];
        var headers =[];
        var table_collum='<th>Time</th>';
        var a = JSON.stringify(req_db);

        a = a.replace(/.+"data":\[/,'');
        a = a.replace(/\[{"time":/g,'<tr><td>');
        a = a.replace(/}},{|},{/g,'</td><td>');
        a = a.replace(/:{|:|]}]/g,'');
        a = a.replace(/}}\],?/g,'</td></tr>');

  // 여기 윗부분에 작은 따옴표
        for ( var i = 1 ; i < first.length ; i++){
          headers.push(Object.keys(first[i])[0]);
          for ( var j =0 ; j < Object.keys(first[i][Object.keys(first[i])]).length ; j++)
          {
            headers.push(Object.keys(first[i][Object.keys(first[i])])[j]);
            table_collum = table_collum + '<th>'+Object.keys(first[i])[0]+'.'+Object.keys(first[i][Object.keys(first[i])])[j]+'</th>';
          }
        }

        for (var i in headers){
          var re = new RegExp('"'+headers[i]+'"',"g");
        a = a.replace(re,'');
        }

        a = a.replace(/,/g,'</td><td>');

        req_db = "<table class='table table-hover' id='current_table'><thead><tr>"+table_collum+'</tr></thead><tbody>'+a+'</table>';

        // 여기에 데이터 선처리를 넣을 수 있다.
        res.json(req_db);
      }else{
        var a = '<tr><td> -- </td><td> Nothing to load </td></tr>'
        req_db = "<table class='table table-hover' id='current_table'><thead><tr><th>Time</th><th>Some Data</th></tr></thead><tbody>"+a+"</tbody></table>";
        res.json(req_db);
      }
    } else {
      res.json(err)
    }
    })
})

//-----------------------

function num2char(num){
  var trans = 'qwertyuiop';
  var chars = '';
  for (var i =0;i<num.length;i++){
    chars += trans.charAt(num.charAt(i));
  }

  return chars;
};

function char2num(chars){
  var trans = 'qwertyuiop';
  var nums = '';
  for (var i=0;i<chars.length;i++){
    nums += trans.indexOf(chars.charAt(i));
  }
  return nums;
};

function registerDevice(socket,device_info){
    socket.device_name = device_info.device_name;
    device_ids[device_info.device_name] = socket.id;
    device_datas[device_info.device_name] = device_info.data;
    var _db = mongoose.connection.useDb(device_info.device_name);
    device_dbs[device_info.device_name] = _db;

    var someSchema = new Schema({device_name : String, order_of_ex: Number, data:[]});
    var collection_name = num2char(date_today);
    collections[device_info.device_name] = _db.model(collection_name,someSchema);
    io.emit('device_list',{devices:Object.keys(device_ids),data:device_datas});
}



var device_ids = [];
var device_datas = {};
var device_dbs = [];
var collections = [];
var date_today = new Date().toFormat('YYYYMMDD');
setInterval(function(){
  date_today = new Date().toFormat('YYYYMMDD');
},600000) // 10분마다 날짜를 업데이트
//--------------------------

io.sockets.on('connection',function(socket){

  socket.on('device_connect',function(device_info){
    console.log(device_info.device_name+'('+socket.id+')'+' 디바이스 접속됨.');
    registerDevice(socket,device_info);
  });


  socket.on('brower_connect',function(brower_name){
    console.log(brower_name+' ('+socket.id+')'+' 브라우져에서 접속됨.');
    io.emit('device_list',{devices:Object.keys(device_ids),data:device_datas});
    console.log({devices:Object.keys(device_ids),data:device_datas});
  });


  socket.on('disconnect',function(data){
    if(socket.device_name != undefined){
        delete device_ids[socket.device_name];
        delete device_datas[socket.device_name];
        delete device_dbs[socket.device_name];
        delete collections[socket.device_name];
        io.emit('device_list',{devices:Object.keys(device_ids),data:device_datas});
      }
  })


 socket.on('dataPulse',function(pulse_obj){
    console.log(pulse_obj);
    io.to(pulse_obj.browerID).emit('data from dev',pulse_obj);
    var pulse_doc = new collections[socket.device_name]({device_name:socket.device_name});

    pulse_doc.order_of_ex = pulse_obj.order_of_ex;
    for(var i in pulse_obj.data){
      pulse_doc.data.push(pulse_obj.data[i]);
    }
    pulse_doc.save();
  });

  socket.on('database_check',function(){
    var database_info_formed = {};
    Records.aggregate(
      [{ $group : { _id : "$device_name" ,info: { $push : "$$ROOT"}}  }]
    ).exec(function(err,database_info){

      for ( var i = 0 ; i<database_info.length; i++ ){
        database_info_formed[database_info[i]._id] = new Array();
        for ( var j = 0 ; j< database_info[i].info.length ; j++ ){

          database_info_formed[database_info[i]._id][j]= {
            date_of_ex : database_info[i].info[j].date_of_ex,
            number_of_ex : database_info[i].info[j].order_of_ex };
        }
      }
      io.emit('database_info',database_info_formed)
    });
  });

  socket.on('database_request',function(request_database){
    var requested_Schema = new Schema({device_name : String, order_of_ex: Number, data:[]});
    var collection_name = num2char(request_database.date_of_ex.toString());
    var _db = device_dbs[request_database.db_name]
    if(date_today!=request_database.date_of_ex.toString()){
      var requested_collection = _db.model(collection_name,requested_Schema);
    } else {
      var requested_collection = collections[request_database.db_name];
    }
    requested_collection.aggregate([
      {$match : { order_of_ex : request_database.order_of_ex } },
      {$group : { _id : "$device_name" , data: { $push: "$data" } } }
    ]).exec(function(err,req_db){
    io.emit('res_db',req_db);
  })

  })

 socket.on('start to send',function(condition){
    condition.browerID = socket.id;

    Records.findOne({device_name:condition.device_name, date_of_ex:date_today})
    .exec(function(err,record){
        if(!record){
          var first_ex_today = new Records({
                                    device_name:condition.device_name,
                                    date_of_ex:date_today,
                                    order_of_ex:1});
              first_ex_today.save();
              condition.order_of_ex = first_ex_today.order_of_ex;
        } else { condition.order_of_ex = record.order_of_ex+1;
                 record.order_of_ex += 1;
                 record.save();}

      console.log(socket.id+':에서 데이터 전송 신호를 보냅니다.');
      console.log(condition);
      console.log(device_ids[condition.device_name]);
      io.to(device_ids[condition.device_name]).emit('start to send',condition);
    });
 });
});
Server.listen(3000);
