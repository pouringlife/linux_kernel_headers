var targetIP = 'http://218.152.175.160:3000/';
//var targetIP = 'http://localhost:3000/';

var io = require('socket.io-client')(targetIP);
var noble = require('noble');

var device_info = {device_name : 'beacon_sensor', data : [{time : 0},
        { user1 :{height:0}}
  //      ,{mag :{x:0, y:0, z:0}}
  //      ,{gyro :{x:0, y:0, z:0}}
      ] };

io.on('connect',function(){
  io.emit('device_connect',device_info);
  console.log('device connected!');
});


var childProcess = require('child_process');
var child = childProcess.exec('./blue_active.sh',function(error,stdout,stderr){
  console.log(stdout);

  var current_beacon_minor;
  var beacon_swich = false;
  var referrence_value = 0;.169
  var targetPeripheralName = "pebBLE";


  // here we start scanning. we check if Bluetooth is on
  noble.on('stateChange', scan);

  function scan(state){
    if (state === 'poweredOn') {
      noble.startScanning([],true);
      console.log("Started scanning");
    } else {
      noble.stopScanning();
      console.log("Is Bluetooth on?");
    }
  }

  noble.on('discover', discoverPeripherals);
  function discoverPeripherals(peripheral) {
      var manufacturerData = peripheral.advertisement.manufacturerData.toString('hex');
      var local_value = manufacturerData.substring(40,manufacturerData.length-2);
      var localName = peripheral.advertisement.localName;

	console.log("hi my name is goodness");

      if((localName!=undefined)){
       if(JSON.stringify(localName).substring(1,7) == targetPeripheralName){

              current_beacon_minor = parseInt(local_value.substring(4,8),16);
              if (peripheral.rssi > -50) {
                console.log("beacon"+ current_beacon_minor+" has been connected!");
                beacon_swich = true;
              }
      
        } else {
           console.log("different device UUID :"+ peripheral.uuid+" is discovered!");
           console.log("LOCALNAME : "+ peripheral.advertisement.localName);
        }
      }
    }

  io.on('start to send',function(condition){
    console.log('start  to transmit');

    start_time = Date.now();

    var step = 1000/condition.sampling_rate;

    var dataSending = setInterval(function(){
    var pulse_obj = {
        device_name : device_info.device_name,
        browerID : condition.browerID,
        order_of_ex : condition.order_of_ex,
        data : device_info.data}
        
        pulse_obj.data[0].time =(Date.now()-start_time)/1000;

        var options = {maxBuffer:100*1024, encoding:'utf8', timeout:5000};
        var child = childProcess.execFile('./once.out',['-m','sensor'],options,function(error,stdout,stderr){

           var object_data = JSON.parse(stdout.toString());

           pulse_obj.data[1].user1.height = object_data.acc.z;
           if (beacon_swich==true) {
             
           }
           //pulse_obj.data[2].mag = object_data.mag;
           //pulse_obj.data[3].gyro = object_data.gyro;
           
         });
         io.emit('dataPulse',pulse_obj);

    },step-3)
    setTimeout(function(){
      clearInterval(dataSending);
      console.log('end to transmit');
    },condition.sampling_time*1000);
  });
});

