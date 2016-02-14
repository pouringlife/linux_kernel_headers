
var noble = require('noble');

var childProcess = require('child_process');
var child = childProcess.exec('./blue_active.sh',function(error,stdout,stderr){
  console.log(stdout);

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
  var beacons_name_by_minor = [];
  var beacons_local_value = [];
  var beacons_count = 0;
  var updated_rssi ={};
  var start_time;
  var targetPeripheralName = "pebBLE";
  var transmit_condition = false;

  var pulse_obj = {
          device_name : device_info.device_name,
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
      var manufacturerData = peripheral.advertisement.manufacturerData.toString('hex');
      var local_value = manufacturerData.substring(40,manufacturerData.length-2);

      var localName = peripheral.advertisement.localName;
      if((localName!=undefined)){
       if(JSON.stringify(localName).substring(1,7) == targetPeripheralName){

            if(Object.keys(beacons).indexOf(peripheral.uuid)==-1){ //발견된 적이 있는 비콘인지 확인
              if(beacons_count==0){ // 비콘 발견이 처음인 경우 기본 비콘 정보 삭제
                delete device_info.data[1].rssi.bc1;
              }
              beacons_count++;

              var major_value = parseInt(local_value.substring(0,4),16);
              var minor_value = parseInt(local_value.substring(4,8),16);

              beacons_local_value.push(minor_value); //로컬 값을 마이너 값으로 설정

              var beacon_name = 'bc'+minor_value+'-'+peripheral.uuid;

              console.log(beacon_name+"이 새롭게 발견되었습니다.");
              beacons_uuid[beacon_name] = peripheral.uuid;
              beacons_name[peripheral.uuid] = beacon_name;
              beacons_name_by_minor[minor_value] = beacon_name;

              var max = beacons_local_value.reduce( function (previous, current) {
	               return previous > current ? previous:current;
              });
              var temp_list ={};
              for (var ix = 1; ix<max+1; ix++){
                if(beacons_local_value.indexOf(ix)!=-1){
                  temp_list[beacons_name_by_minor[ix]]=-99;
                }
              }
              updated_rssi=temp_list;
              device_info.data[1].rssi = temp_list;

//              updated_rssi[beacons_name[peripheral.uuid]]=peripheral.rssi;
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
                updated_rssi[x] = null;
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
      pulse_obj.data = device_info.data;
    },condition.sampling_time*1000);
  });
});
