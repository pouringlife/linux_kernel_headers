
var noble = require('noble');

var childProcess = require('child_process');
var child = childProcess.exec('./blue_active.sh',function(error,stdout,stderr){
  console.log(stdout);
});

var noble = require('noble');   //noble library

//var targetIP = 'http://192.168.0.69:3000/'; //macbook
//var targetIP = 'http://172.20.10.4:3000/'; //테더링
var targetIP = 'http://223.194.7.90:3000';

var io = require('socket.io-client')(targetIP);
var device_info = {device_name : 'noble_Edison3', data : [{time : 0},
        {rssi :{bc1:0}}
                       ]};
io.on('connect',function(){
   io.emit('device_connect',device_info);
   console.log('디바이스 접속');
   });

var beacons = [];
var beacons_uuid = [];
var beacons_name = [];
var beacons_count = 0;
var targetPeripheralName = "pebBLE";

// here we start scanning. we check if Bluetooth is on
noble.on('stateChange', scan);

function scan(state){
  if (state === 'poweredOn') {
    noble.startScanning();
    console.log("Started scanning");
  } else {
    noble.stopScanning();
    console.log("Is Bluetooth on?");
  }
}

noble.on('discover', discoverPeripherals);
function discoverPeripherals(peripheral) {
  var localName = peripheral.advertisement.localName;
    if(localName!=undefined){
     if(JSON.stringify(localName).substring(1,7) == targetPeripheralName){

        console.log("비콘을 찾았습니다. UUID 는 "+ peripheral.uuid+"입니다.");

          if(Object.keys(beacons).indexOf(peripheral.uuid)==-1){
            beacons_count++;
            var beacon_name = 'bc'+ beacons_count;
            beacons_uuid[beacon_name] = peripheral.uuid;
            beacons_name[peripheral.uuid] = beacon_name;
            device_info.data[1].rssi[beacon_name] = 0;
            io.emit('device_connect',device_info);
            console.log("지금까지 비콘이 "+beacons_count+"개 발견 되었습니다.");
          }
          beacons[peripheral.uuid] = peripheral;
        beacon_connect(peripheral);

        }
      } else{
         console.log("found a different device with UUID : "+ peripheral.uuid);
         console.log("LOCALNAME : "+ peripheral.advertisement.localName);
      }

  }

function beacon_connect(beacon){
  beacon.connect(function(error){
    console.log(beacons_name[beacon.uuid]+" 비콘이 접속 되었습니다.");
  });

  beacon.on('disconnect',function(){
    console.log(beacons_name[beacon.uuid]+" 비콘이 해제 되었습니다.");
    beacons[beacon.uuid] = {};
    beacons[beacon.uuid].updateRssi = function(next){
      var err = null;
      var rssi = null;
      next(err,rssi);
    }
    beacons[beacon.uuid].removeListener = function(a,next){
      next(a);
    }

    beacon.removeListener('disconnect',function(){});
    noble.stopScanning();
    noble.startScanning();
    console.log("Started scanning");
  });
};


io.on('start to send',function(condition){
  console.log('전송을 시작합니다.');

  var t_ini=0;

  var pulse_obj = {
          device_name : device_info.device_name,
          browerID : condition.browerID,
          order_of_ex : condition.order_of_ex,
          data : device_info.data };

      pulse_obj.data[0].time = t_ini;

      console.log(pulse_obj.data);

  var step = 1000/condition.sampling_rate;

  var dataSending = setInterval(function(){
    for( var m in beacons){
      (function(i){
        beacons[i].updateRssi(function(err,rssi){
        var name = beacons_name[i];
        pulse_obj.data[1].rssi[name]= rssi;
        beacons[i].removeListener('updateRssi',function(){})
        })
      })(m);
    }
    io.emit('dataPulse',pulse_obj);

    console.log(pulse_obj.data);

    pulse_obj.data[0].time += step/1000;
},step-5);

  setTimeout(function(){clearInterval(dataSending)},condition.sampling_time*1000);

});
