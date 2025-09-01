// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TransferWithMessage {
    event TransferExecuted(
        uint256 indexed transferId, // 转账唯一ID
        address indexed from, // 发送者地址
        address indexed to, // 接收者地址
        uint256 amount, // 转账金额
        string message, // 附言信息
        uint256 timestamp // 转账时间戳
    );

    uint256 public transferCounter; // 转账计数器

    // 记录每个转账的详细信息
    struct Transfer {
        uint256 id;
        address from;
        address to;
        uint256 amount;
        string message;
        uint256 timestamp;
    }

    // 存储所有转账记录
    mapping(uint256 => Transfer) public transfers;

    // 按地址索引转账记录（发送者）
    mapping(address => uint256[]) public senderTransfers;

    // 按地址索引转账记录（接收者）
    mapping(address => uint256[]) public receiverTransfers;

    function transferWithMessage(
        address to,
        string calldata message
    ) external payable {
        require(to != address(0), "Cannot transfer to zero address");
        require(msg.value > 0, "Transfer amount must be greater than 0");

        uint256 transferId = transferCounter;

        // 记录转账信息
        transfers[transferId] = Transfer({
            id: transferId,
            from: msg.sender,
            to: to,
            amount: msg.value,
            message: message,
            timestamp: block.timestamp
        });

        // 更新发送者和接收者的转账记录索引
        senderTransfers[msg.sender].push(transferId);
        receiverTransfers[to].push(transferId);

        // 触发事件，供 The Graph 索引
        emit TransferExecuted(
            transferId,
            msg.sender,
            to,
            msg.value,
            message,
            block.timestamp
        );

        // 执行实际转账
        (bool success, ) = payable(to).call{value: msg.value}("");
        require(success, "Transfer failed");

        transferCounter++;
    }

    // 查询指定转账的详细信息
    function getTransfer(
        uint256 transferId
    ) external view returns (Transfer memory) {
        require(transferId < transferCounter, "Transfer does not exist");
        return transfers[transferId];
    }

    // 获取发送者的所有转账记录ID
    function getSenderTransfers(
        address sender
    ) external view returns (uint256[] memory) {
        return senderTransfers[sender];
    }

    // 获取接收者的所有转账记录ID
    function getReceiverTransfers(
        address receiver
    ) external view returns (uint256[] memory) {
        return receiverTransfers[receiver];
    }

    // 获取总转账数量
    function getTotalTransfers() external view returns (uint256) {
        return transferCounter;
    }

    // 批量查询转账记录（分页查询）
    function getTransfersBatch(
        uint256 offset,
        uint256 limit
    ) external view returns (Transfer[] memory) {
        require(offset < transferCounter, "Offset out of range");

        uint256 end = offset + limit;
        if (end > transferCounter) {
            end = transferCounter;
        }

        Transfer[] memory result = new Transfer[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = transfers[i];
        }

        return result;
    }
}
