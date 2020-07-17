const tlsClient = require('./tlsclient')

var client = new tlsClient("long.weixin.qq.com", 443, "http://47.107.50.161:8092");
client.Connect(function(code){
    console.log("连接:"  + code);
},function(data){
    console.log("接受数据:");
    console.log(data);
});