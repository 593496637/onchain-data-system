// contracts/SwapAndMemoV3.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// V3 Router 接口，比 V2 复杂
interface IUniswapV3SwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

// 之前定义过的 WETH 和 ERC20 接口
interface IWETH {
    function deposit() external payable;
    function withdraw(uint wad) external;
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract SwapAndMemoV3 {
    // 事件定义保持不变，以便 The Graph 复用
    event MemoizedSwap(
        address indexed from,
        address indexed recipient,
        string message,
        uint256 amountIn,
        uint256 amountOut
    );

    // --- V3 合约地址 ---
    address public constant SWAP_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address public constant WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;

    function swapEthForTokenWithMemoV3(
        uint256 amountOutMinimum,
        address tokenOut,
        uint24 fee, // 新增：需要前端传入手续费等级
        address recipient,
        string calldata message
    ) external payable returns (uint256 amountOut) {
        // 1. 验证输入
        require(msg.value > 0, "Must send ETH");

        // 2. 将收到的 ETH 包装成 WETH
        IWETH(WETH).deposit{value: msg.value}();
        
        // 3. 授权 V3 Router 可以使用我们合约中的 WETH
        IWETH(WETH).approve(SWAP_ROUTER, msg.value);

        // 4. 准备 V3 兑换参数
        IUniswapV3SwapRouter.ExactInputSingleParams memory params = IUniswapV3SwapRouter
            .ExactInputSingleParams({
                tokenIn: WETH,
                tokenOut: tokenOut,
                fee: fee,
                recipient: recipient, // Token 直接发送给最终收款人
                deadline: block.timestamp,
                amountIn: msg.value,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0
            });

        // 5. 调用 V3 Router 执行兑换
        amountOut = IUniswapV3SwapRouter(SWAP_ROUTER).exactInputSingle(params);

        // 6. 触发事件
        emit MemoizedSwap(msg.sender, recipient, message, msg.value, amountOut);
    }

    // 允许合约接收 ETH
    receive() external payable {}
}