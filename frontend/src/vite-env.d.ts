/// <reference types="vite/client" />

// 在这里添加下面的代码
interface Window {
  ethereum?: import('ethers').ExternalProvider;
}