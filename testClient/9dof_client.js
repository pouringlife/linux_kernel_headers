
var targetIP = 'http://192.168.0.69:3000/';
//var targetIP = 'http://localhost:3000/';

var io = require('socket.io-client')(targetIP);

var device_info = {device_name : '9dof_Edison2', data : [{time : 0},
        {acc :{x:0, y:0, z:0}}
        ,{mag :{x:0, y:0, z:0}}
        ,{gyro :{x:0, y:0, z:0}}
      ] };

io.on('connect',function(){
  io.emit('device_connect',device_info);
  console.log('디바이스 접속');
});

io.on('start to send',function(condition){
  console.log('전송을 시작합니다.');

  var t_ini=0,pi=3.141592;
  var x_ini=0,y_ini=0;
  var v = 0.5;
  var pulse_obj = {
    device_name : device_info.device_name,
    browerID : condition.browerID,
    order_of_ex : condition.order_of_ex,
    data : device_info.data}

  pulse_obj.data[0].time = t_ini;

  var step = 1000/condition.sampling_rate;

  var dataSending = setInterval(function(){

    var childProcess = require('child_process');
    var options = {maxBuffer:100*1024, encoding:'utf8', timeout:5000};
    var child = childProcess.execFile('./once.out',['-m','sensor'],options,function(error,stdout,stderr){

       var object_data = JSON.parse(stdout.toString());

       pulse_obj.data[1].acc = object_data.acc;
       pulse_obj.data[2].mag = object_data.mag;
       pulse_obj.data[3].gyro = object_data.gyro;

    });

    io.emit('dataPulse',pulse_obj);
    pulse_obj.data[0].time += step/1000;
    console.log(pulse_obj.order_of_ex);
  },step-10);

  setTimeout(function(){clearInterval(dataSending)},condition.sampling_time*1000);

});
