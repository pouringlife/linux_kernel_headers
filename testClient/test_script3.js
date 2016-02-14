var a = '{"_id":"TestDevice2","data":[[{"time":0},{"Sin":{"y":0,"x":0}},{"Cos":{"y":1,"x":1}}],[{"time":0.2},{"Sin":{"y":0.9510564355069797,"x":0.5877851465394182}},{"Cos":{"y":0.3090172430152695,"x":0.8090170712090288}}],[{"time":0.4},{"Sin":{"y":0.5877856753045927,"x":0.9510564355069797}},{"Cos":{"y":-0.8090166870384838,"x":0.3090172430152695}}],[{"time":0.6000000000000001},{"Sin":{"y":-0.5877846177739927,"x":0.9510566374772924}},{"Cos":{"y":-0.8090174553792281,"x":-0.3090166214144248}}],[{"time":0.8},{"Sin":{"y":-0.951056839447199,"x":0.5877856753045927}},{"Cos":{"y":0.3090159998134479,"x":-0.8090166870384838}}],[{"time":1},{"Sin":{"y":-0.0000013071795861522044,"x":6.535897930762419e-7}},{"Cos":{"y":0.9999999999991457,"x":-0.9999999999997864}}],[{"time":1.2},{"Sin":{"y":0.9510560315651353,"x":-0.5877846177739924}},{"Cos":{"y":0.30901848621656347,"x":-0.8090174553792283}}]]}'
var data = JSON.parse(a);

var first = data.data[0];
var headers = [];

a =a.replace(/.+"data":\[/,'');
a = a.replace(/\[{"time":/g,'<tr><td>');
a = a.replace(/}},{|},{/g,'</td><td>');
a = a.replace(/:{|:/g,'');
a = a.replace(/}}\],?/g,'</td></tr>');

for ( var i = 1 ; i < first.length ; i++){
  headers.push(Object.keys(first[i])[0]);
  for ( var j in Object.keys(first[i][Object.keys(first[i])]))
  headers.push(Object.keys(first[i][Object.keys(first[i])])[j]);
}
console.log(headers);

for ( var i in headers){
  var re = new RegExp('"'+headers[i]+'"',"g");
a = a.replace(re,'');
}

a = a.replace(/,/g,'</td><td>');

console.log(a);
