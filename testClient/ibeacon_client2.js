
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
var start_time;
var targetPeripheralName = "pebBLE";
var transmit_condition = false;

var pulse_obj = {
        device_name : device_info.device_name,
//        browerID : null,
  //      order_of_ex : null,
        data : device_info.data
  };

    pulse_obj.data[0].time = 0;


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
    if((localName!=undefined)){
     if(JSON.stringify(localName).substring(1,7) == targetPeripheralName){

          if(Object.keys(beacons).indexOf(peripheral.uuid)==-1){ //발견된 적이 있는 비콘인지 확인
            beacons_count++;
            var beacon_name = 'bc'+ beacons_count;
            console.log(beacon_name+"이 새롭게 발견되었습니다.");
            beacons_uuid[beacon_name] = peripheral.uuid;
            beacons_name[peripheral.uuid] = beacon_name;
            device_info.data[1].rssi[beacon_name] = -99;
            updated_rssi[beacons_name[peripheral.uuid]]=peripheral.rssi;
            io.emit('device_connect',device_info);
            console.log("지금까지 비콘이 "+beacons_count+"개 발견 되었습니다.");
            beacons[peripheral.uuid] = peripheral;
            }

          if(transmit_condition==true){
            updated_rssi[beacons_name[peripheral.uuid]]=peripheral.rssi;
            pulse_obj.data[1].rssi = updated_rssi;
            io.emit('dataPulse',pulse_obj);
            console.log(pulse_obj.data);
            for ( x in updated_rssi){
            //  updated_rssi[x] = null;
            }
            pulse_obj.data[0].time = (Date.now()-start_time)/1000;
          }

      } else {
         console.log("다른 기기를 찾았습니다. UUID 는 "+ peripheral.uuid+"입니다.");
         console.log("LOCALNAME : "+ peripheral.advertisement.localName);
      }
    }
  }

io.on('start to send',function(condition){
  console.log('전송을 시작합니다.');

  transmit_condition = true;

  pulse_obj.browerID = condition.browerID;
  pulse_obj.order_of_ex = condition.order_of_ex;
  start_time = Date.now();

  var step = 1000/condition.sampling_rate;


  setTimeout(function(){
    transmit_condition = false;
    console.log('전송을 종료합니다.');
  },condition.sampling_time*1000);
  /*
  var dataClear = setInterval(function(){
    for ( x in updated_rssi){
      updated_rssi[x] = null;
    }
  },5000);
  setTimeout(function(){clearInterval(dataClear)},condition.sampling_time*1000);
*/
});
