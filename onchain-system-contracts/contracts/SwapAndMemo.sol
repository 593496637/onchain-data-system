// contracts/SwapAndMemo.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// 定义我们需要交互的外部合约的接口
// 我们只需要定义要用到的函数即可

// Uniswap V2 Router 接口
interface IUniswapV2Router {
    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts);
}

// WETH 接口
interface IWETH {
    function deposit() external payable;
}

// ERC20 Token 接口
interface IERC20 {
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);
}

contract SwapAndMemo {
    // --- 事件定义 ---
    event MemoizedSwap(
        address indexed from, // 交易发起者
        address indexed recipient, // 最终收款人
        string message, // 附言信息
        uint256 amountIn, // 输入的 ETH 数量
        uint256 amountOut // 换出的 Token 数量
    );

    // --- 链上地址常量 ---
    // 修复后的最终代码
    address public constant UNISWAP_V2_ROUTER =
        0xc532a74256d3dB421742e45F0E6114C40F2837dA;
    address public constant WETH = 0x7b79995E5f793A07bC00C21412e50EaAE098e7F9;

    // --- 核心函数 ---
    function swapEthForTokenWithMemo(
        uint256 amountOutMin, // 你愿意接受的最小 Token 数量（防止滑点）
        address tokenAddress, // 目标 Token 的地址（例如 USDC）
        address recipient, // 最终接收 Token 的地址
        string calldata message // 附言
    ) external payable {
        // 1. 验证输入
        require(msg.value > 0, "Must send ETH to swap");
        require(recipient != address(0), "Invalid recipient");

        // 2. 准备 Uniswap 兑换路径
        // 路径是一个地址数组，指明兑换顺序： WETH -> 目标 Token
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = tokenAddress;

        // 3. 调用 Uniswap Router 合约进行兑换
        // 我们发送的 ETH (msg.value) 会被这个函数自动处理
        // 兑换出的 Token 会被直接发送到最终收款人 `recipient` 的地址
        uint[] memory amounts = IUniswapV2Router(UNISWAP_V2_ROUTER)
            .swapExactETHForTokens{value: msg.value}(
            amountOutMin,
            path,
            recipient,
            block.timestamp // 截止时间设为当前区块时间，意味着立即执行
        );

        // 4. 触发事件，让 The Graph 可以索引！
        // amounts[0] 是输入的 WETH 数量, amounts[1] 是输出的 Token 数量
        emit MemoizedSwap(
            msg.sender,
            recipient,
            message,
            amounts[0],
            amounts[1]
        );
    }

    // fallback 函数，允许合约接收 ETH
    receive() external payable {}
}
