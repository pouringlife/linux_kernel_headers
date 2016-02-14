
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
var updated_rssi ={};
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
    var localName = peripheral.advertisement.localName;
    if(localName!=undefined){
     if(JSON.stringify(localName).substring(1,7) == targetPeripheralName){

        console.log("비콘을 찾았습니다. UUID 는 "+ peripheral.uuid+"입니다.");

          if(Object.keys(beacons).indexOf(peripheral.uuid)==-1){

            beacons_count++;
            var beacon_name = 'bc'+ beacons_count;
            beacons_uuid[beacon_name] = peripheral.uuid;
            beacons_name[peripheral.uuid] = beacon_name;
            device_info.data[1].rssi[beacon_name] = -99;
            send_temp = device_info.data[1].rssi;
            io.emit('device_connect',device_info);
            console.log("지금까지 비콘이 "+beacons_count+"개 발견 되었습니다.");
            beacons[peripheral.uuid] = peripheral;
            }
            updated_rssi[beacons_name[peripheral.uuid]]=peripheral.rssi;
      } else {
         console.log("다른 기기를 찾았습니다. UUID 는 "+ peripheral.uuid+"입니다.");
         console.log("LOCALNAME : "+ peripheral.advertisement.localName);
      }
    }
  }

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

    pulse_obj.data[1].rssi = updated_rssi;

    io.emit('dataPulse',pulse_obj);

    console.log(pulse_obj.data);

    for ( x in updated_rssi){
      updated_rssi[x] = null;
    }

    pulse_obj.data[0].time += step/1000;
},step-3);



  setTimeout(function(){clearInterval(dataSending)},condition.sampling_time*1000);
  /*
  var dataClear = setInterval(function(){
    for ( x in updated_rssi){
      updated_rssi[x] = null;
    }
  },5000);
  setTimeout(function(){clearInterval(dataClear)},condition.sampling_time*1000);
*/
});
