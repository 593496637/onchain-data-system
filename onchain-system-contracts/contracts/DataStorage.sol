// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DataStorage {
    // 定义事件，用于记录数据日志
    // 事件(Event)是智能合约与外界通信的一种高效方式，它会将信息记录在链上日志中。
    // The Graph 正是通过监听这些事件来索引数据的。
    event DataWritten(
        uint256 indexed eventId, // 为事件增加一个唯一ID
        address indexed from,   // 发送者地址，加 indexed 关键字可以更快地按此字段进行搜索
        string message,         // 存储的消息
        uint256 timestamp       // 事件发生的时间戳
    );

    uint256 public eventCounter; // 事件计数器，它是一个状态变量，会永久存储在链上

    // 写入数据的函数
    // external 关键字表示这个函数只能从合约外部调用
    function writeData(string calldata message) external {
        // emit 关键字用于触发一个事件
        // msg.sender 是一个全局变量，代表调用此函数的账户地址
        // block.timestamp 是一个全局变量，代表当前区块的时间戳
        emit DataWritten(eventCounter, msg.sender, message, block.timestamp);
        eventCounter++; // 每次调用后，计数器加 1
    }
}