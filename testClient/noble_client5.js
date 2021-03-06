var childProcess = require('child_process');
var child = childProcess.exec('./blue_active.sh',function(error,stdout,stderr){
  console.log(stdout);


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
  var beacons_update = 0;
  var beacons_connect = 0;
  var updated_rssi ={};
  var send_temp = {};
  var send_step = 0;
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
              device_info.data[1].rssi[beacon_name] = -99;
              send_temp = device_info.data[1].rssi;
              io.emit('device_connect',device_info);
              console.log("지금까지 비콘이 "+beacons_count+"개 발견 되었습니다.");

              peripheral.on('disconnect',function(){
                console.log(beacons_name[peripheral.uuid]+" 비콘이 해제 되었습니다.");
                beacons_connect = beacons_connect-1;

                beacons[peripheral.uuid].conn = false;

                noble.stopScanning();
                noble.startScanning();
                console.log("Started scanning");
              });

              peripheral.on('rssiUpdate',function(rssi){
                beacons_update++;
                if(rssi<0){
                  updated_rssi[beacon_name]=rssi;
                }

                if(beacons_update>=beacons_connect){
                  beacons_update=0;
                  send_temp.data[1].rssi = updated_rssi;
                  send_temp.data[0].time += send_step/1000;

                  io.emit('dataPulse',send_temp);
                  console.log(send_temp.data);
                  for( x in updated_rssi){
                    updated_rssi[x]=null;
                  }
                }
              })

              peripheral.connect(function(error){
                beacons_connect++;
                peripheral.conn=true;
                console.log(beacons_name[peripheral.uuid]+" 비콘이 접속 되었습니다.");
              });
            }

            beacons[peripheral.uuid] = peripheral;

            if(beacons[peripheral.uuid].conn==false) {
              peripheral.connect(function(error){
              beacons_connect++;
              peripheral.conn=true;
              console.log(beacons_name[peripheral.uuid]+" 비콘이 접속 되었습니다.");

              });
            }
          }
        } else{
           console.log("다른 기기를 찾았습니다. UUID 는 "+ peripheral.uuid+"입니다.");
           console.log("LOCALNAME : "+ peripheral.advertisement.localName);
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
    send_step = 1000/condition.sampling_rate;

    var dataSending = setInterval(function(){
      send_temp = pulse_obj;
      for( var i in beacons){
          if(beacons[i].conn==true){beacons[i].updateRssi();}
      }
},send_step-3);

    setTimeout(function(){clearInterval(dataSending)},condition.sampling_time*1000);

  });

});
