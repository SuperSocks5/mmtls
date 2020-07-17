const net = require("net");
const UUID = require('uuid');
const http = require('http');

const options = {
    method: 'post',
    headers: {
    'Content-Type':'application/octet-stream'
    }};

function SyncHttpPost(url, postData){
    return new Promise((resolve,reject)=>{
        try {
              //使用http 发送
            var data = Buffer.alloc(0);
            var req = http.request(url, options, function(res) {
                //数据
                res.on('data', function (chunk) {
                    data = Buffer.concat([data, chunk]);
                });
                
                // 结束回调
                res.on('end', function(){
                    console.log("回调完成");
                    resolve(data);
                });
            });
             //错误回调 // 这个必须有。 不然会有不少 麻烦
             req.on('error', function(e) {
                reject();
            });

            if(postData != null){
                req.write(postData);
            }
            req.end();
        } catch (error) {
            reject();
            console.log(error.message);
        }    
    });
}

class TlsClient{
    constructor(tcpServer, tcpPort, httpServer){
        this.tcpServer = tcpServer;
        this.tcpPort = tcpPort;
        this.httpServer = httpServer;
        this.recvBuffer = Buffer.alloc(0);
        //握手状态
        this.handshake = 0;
        this.guid = UUID.v1();
        this.OnConnect  =null;
        this.OnRecvData = null;
    }


    TestUnPack(offset){
        //长度必须大于5个字节
        if(offset == null){
            offset = 0;
        }
        if(this.recvBuffer.length < (5 + offset)){
            return null;
        }
        var len = this.recvBuffer.readInt16BE(offset+3);
        if(this.recvBuffer.length < (5 +len+offset)){
            return null;
        }
        return {"offset":5+offset,"len":len};
    }

    async HandleServerFinis(){
        //目前有4个节点，需要判断4个节点是否都已经读取完了
        var offset = 0;
       for(var i=0;i<4;i++){
          var unPackInfo = this.TestUnPack(offset);
          if(unPackInfo == null){
            return;
          }
          offset = unPackInfo.offset + unPackInfo.len;
       }

       var serverFinishData = this.recvBuffer.slice(0,offset);
       this.recvBuffer = this.recvBuffer.slice(offset);
       try {
           var url = this.httpServer +  "/serverfinish?uuid=" + this.guid;
           const clientFinish = await SyncHttpPost(url, serverFinishData);         
           this.tcpClient.write(clientFinish);
           this.OnConnect(0);
           this.handshake = 1;
       } catch (error) {
           console.log("服务器异常");
           console.log(error);
       }
      
    }


    async HandleUnPack(){
        var packDataInfo = this.TestUnPack(0);
        if(null == packDataInfo){
            return;
        }
        var packData = this.recvBuffer.slice(0,packDataInfo.offset+packDataInfo.len);
        this.recvBuffer = this.recvBuffer.slice(packDataInfo.offset+packDataInfo.len);
        try {
            var url = this.httpServer +  "/unpack?uuid=" + this.guid;
            var unPackData =  await SyncHttpPost(url,packData);   
            this.OnRecvData(unPackData);
        } catch (error) {
            console.log(error.message);
        }
    }


    HandleRecvData(data){
      //判断是否已经握手完成了
      this.recvBuffer = Buffer.concat([this.recvBuffer, data]);
      if(this.handshake == 0){
          //这是一个client finis 包
          this.HandleServerFinis();
      } else{
        //已经握手完成了，那就直接解包
        this.HandleUnPack();
      }
    }



    async HandleSendClientHello(){
          //发送client hello 数据
        try {
            var url = this.httpServer +  "/clienthello?uuid=" + this.guid;
            const clienthello = await SyncHttpPost(url);         
            this.tcpClient.write(clienthello);
        } catch (error) {
            console.log("服务器异常");
            console.log(error);
        }
    }

    Connect(connectListener, recvDataListener){    
        this.OnConnect = connectListener;
        this.OnRecvData = recvDataListener;

        this.tcpClient = new net.Socket();
        this.tcpClient.connect(this.tcpPort,this.tcpServer, ()=>{
            //发送握手包
            this.HandleSendClientHello();
        });

        this.tcpClient.on('error',()=>{
            console.log("连接服务器失败:" + this.tcpServer);
            this.OnConnect(-1);
        });

        this.tcpClient.on('data',(data)=>{
            this.HandleRecvData(data);
        });
    };

    async SendData(data){
        try {
            var url = this.httpServer +  "/pack?uuid=" + this.guid;
            var packedData =  await SyncHttpPost(url,data);   
            this.tcpClient.write(packedData);
        } catch (error) {
            console.log(error.message);
        }
    }
}

module.exports = TlsClient;
