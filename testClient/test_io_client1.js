
//var targetIP = 'http://192.168.0.69:3000/';
var targetIP = 'http://localhost:3000/';

var io = require('socket.io-client')(targetIP);
//var request = require('request-json').createClient(targetIP);

var device_info = {device_name : 'TestDevice1', data : [{time : 0},
        {data1 :{x: 0 ,y:0}},
        {data2 :{x: 0 ,y:0}}]};

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
    device_name : device_name,
    browerID : condition.browerID,
    order_of_ex : condition.order_of_ex,
    data : [{time : t_ini},
            {x : x_ini },
            {y : y_ini }]};

  var step = 1000/condition.sampling_rate;

  var dataSending = setInterval(function(){
    pulse_obj.data[1].x = Math.sin(2*pi*pulse_obj.data[0].time*v);
    pulse_obj.data[2].y = Math.cos(2*pi*pulse_obj.data[0].time*2*v);

    io.emit('dataPulse',pulse_obj);
    pulse_obj.data[0].time += step/1000;
    console.log(pulse_obj.order_of_ex);
  },step-2);

  setTimeout(function(){clearInterval(dataSending)},condition.sampling_time*1000);

});
