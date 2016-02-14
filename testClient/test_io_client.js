
var targetIP = 'http://192.168.0.69:3000/';
var targetIP = 'http://localhost:3000/';

var io = require('socket.io-client')(targetIP);
//var request = require('request-json').createClient(targetIP);

var device_info = {device_name : 'TestDevice', data : [{time : 0},
        {A :{x: 0 ,y:0, z:0}},
        {B :{x: 0 ,y:0, z:0}},
        {C :{x: 0 ,y:0, z:0}}
      ]};

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
    pulse_obj.data[1].A.x = Math.sin(2*pi*pulse_obj.data[0].time*v);
    pulse_obj.data[1].A.y = Math.sin(2*pi*pulse_obj.data[0].time*2*v);
    pulse_obj.data[1].A.z = Math.sin(2*pi*pulse_obj.data[0].time*3*v);

    pulse_obj.data[2].B.x = Math.cos(2*pi*pulse_obj.data[0].time*v);
    pulse_obj.data[2].B.y = Math.cos(2*pi*pulse_obj.data[0].time*2*v);
    pulse_obj.data[2].B.z = Math.cos(2*pi*pulse_obj.data[0].time*3*v);

    pulse_obj.data[3].C.x = Math.tan(2*pi*pulse_obj.data[0].time*v);
    pulse_obj.data[3].C.y = Math.tan(2*pi*pulse_obj.data[0].time*2*v);
    pulse_obj.data[3].C.z = Math.tan(2*pi*pulse_obj.data[0].time*3*v);


    io.emit('dataPulse',pulse_obj);
    pulse_obj.data[0].time += step/1000;
    console.log(pulse_obj.order_of_ex);
  },step-2);

  setTimeout(function(){clearInterval(dataSending)},condition.sampling_time*1000);

});
