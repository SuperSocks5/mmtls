# mmtls
基于TCP 上 mmtls 安全传输实现

    一直也在研究tcp 的安全通信问题，项目中用的是OpenSSL 提供的TLS，当存在大量并发的时候TLS 的握手过程确实消耗很大，后来就一直研究微信的 mmtls 方案，握手过程只需要一个来回就可以搞定。

    用nodejs 实现了一个mmtls的加解密流程，加解密放到了服务器上，可以使用微信的服务器来测试一下是否符合 mmtls 的流程。

# 调试运行
    nodejs 写的，git clone 回来之后，直接 用vs code 打开目录。
    npm install 
    直接F5 就可以调试了。

## 1 [看雪论坛上的文章](https://bbs.pediy.com/thread-257942.htm)
    详细讲解了整个数据包的解析，加解密的分析过程。
## 2 [MMTLS 加解密算法](资料/MMTLS协议中AES-GCM加密算法)
    收集到的另一篇文章，也是分析数据包的加解密过程，后面收集到的技术资料都放到资料文件夹下

## 3 [微信官方mmtls 介绍]
    包括两篇详细介绍，但是只是介绍原理，并没有算法代码。
[基于 TLS 1.3的微信安全通信协议 mmtls 介绍(上)](https://cloud.tencent.com/developer/article/1005518)

[基于 TLS 1.3的微信安全通信协议 mmtls 介绍(下)](https://cloud.tencent.com/developer/article/1005519)

**服务器只是用来测试加解密是否符合MMTLS 的流程， 不要发送大量请求，也不要攻击服务器**

**公司目前也已经切换到MMTLS 这套加解密方案，效果还不错**

# 觉得有用的可以点个赞