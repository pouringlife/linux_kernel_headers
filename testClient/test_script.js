var device_name = 'TestDevice';
var data =  [{time : 0},
        {data1 :{x: 0 ,y:0}},
        {data2 :{x: 0 ,y:0}},
        {data3 :{x: 0 ,y:0}}];

var opt=[];
var dps=[];
var chart_id = []
for (var i=1;i<data.length;i++){
    opt[device_name] = new Array;
    dps[device_name] = new Array;
    dps[device_name][i-1] = new Array;

    opt[device_name][i-1] = {
      zoomEnabled: true,
      animationEnabled: true,
      title:{
        text: Object.keys(data[i])[0]
      },
      axisY2:{
        valueFormatString:"0.0",
        maximum: 1.2,
        interval: .2,
        interlacedColor: "#F5F5F5",
        gridColor: "#D7D7D7",
        tickColor: "#D7D7D7"
      },
      theme: "theme2",
      toolTip:{
        shared: true
      },
      legend:{
        verticalAlign: "bottom",
        horizontalAlign: "center",
        fontSize: 15,
        fontFamily: "Lucida Sans Unicode"

      },
      data: []

    };

    for (var j =0;j< Object.keys(data[i][Object.keys(data[i])[0]]).length; j++){
    dps[device_name][i-1][j]=new Array();
    opt[device_name][i-1].data.push({
      type: "line",
      lineThickness:3,
      axisYType:"secondary",
      showInLegend: true,
      name: Object.keys(data[i])[0]+' '+Object.keys(data[i][Object.keys(data[i])[0]])[j],
      dataPoints: dps[device_name][i-1][j]});
  }

 chart_id[i-1] = "chart_box" + device_name + Object.keys(data[i]);

}
console.log(chart_id);
console.log(opt[device_name]);
console.log(opt[device_name][2].data);
