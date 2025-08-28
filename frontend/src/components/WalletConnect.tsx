// src/components/WalletConnect.tsx
// ** V11 - FINAL & COMPLETE with resilient ENS lookup **
import { useState, useEffect, useMemo, useRef } from "react";
import { ethers } from "ethers";

const supportedChains = [
  {
    chainId: 11155111,
    hexChainId: "0xaa36a7",
    name: "Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
    currency: "ETH",
  },
  {
    chainId: 1,
    hexChainId: "0x1",
    name: "Ethereum",
    rpcUrl: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    currency: "ETH",
  },
  {
    chainId: 137,
    hexChainId: "0x89",
    name: "Polygon",
    rpcUrl: "https://polygon-rpc.com",
    currency: "MATIC",
  },
  {
    chainId: 42161,
    hexChainId: "0xa4b1",
    name: "Arbitrum One",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    currency: "ETH",
  },
];

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === "string") return message;
  }
  return "An unknown error occurred.";
};

export const WalletConnect = () => {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<{
    chainId: number;
    name: string;
  } | null>(null);
  const [isUnsupportedNetwork, setIsUnsupportedNetwork] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);

  const accountModalRef = useRef<HTMLDivElement>(null);
  const networkModalRef = useRef<HTMLDivElement>(null);

  const formattedAddress = useMemo(() => {
    if (!userAddress) return "";
    return `${userAddress.substring(0, 6)}...${userAddress.substring(
      userAddress.length - 4
    )}`;
  }, [userAddress]);

  const updateState = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);

      if (accounts.length > 0) {
        const address = accounts[0];
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);

        setUserAddress(address);
        setNetwork({ chainId, name: network.name });

        const isSupported = supportedChains.some(
          (chain) => chain.chainId === chainId
        );
        setIsUnsupportedNetwork(!isSupported);

        try {
          if (chainId === 1 || chainId === 11155111) {
            const fetchedEnsName = await provider.lookupAddress(address);
            setEnsName(fetchedEnsName);
            if (fetchedEnsName) {
              const fetchedAvatarUrl = await provider.getAvatar(fetchedEnsName);
              setAvatarUrl(fetchedAvatarUrl);
            } else {
              setAvatarUrl(null);
            }
          } else {
            setEnsName(null);
            setAvatarUrl(null);
          }
        } catch (ensError) {
          console.warn(
            "Could not fetch ENS details (this is expected on non-mainnet chains):",
            ensError
          );
          setEnsName(null);
          setAvatarUrl(null);
        }
      } else {
        setUserAddress(null);
        setNetwork(null);
        setIsUnsupportedNetwork(false);
        setEnsName(null);
        setAvatarUrl(null);
      }
    } catch (err) {
      console.error("Error updating state:", getErrorMessage(err));
      setUserAddress(null);
      setNetwork(null);
      setIsUnsupportedNetwork(false);
      setEnsName(null);
      setAvatarUrl(null);
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        await updateState();
      } catch (error) {
        setErrorMessage(`连接失败: ${getErrorMessage(error)}`);
      }
    } else {
      setErrorMessage("请安装 MetaMask 浏览器插件!");
    }
  };

  const handleSwitchNetwork = async (chain: (typeof supportedChains)[0]) => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chain.hexChainId }],
      });
      setIsNetworkModalOpen(false);
    } catch (switchError: unknown) {
      if ((switchError as { code?: number })?.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: chain.hexChainId,
                chainName: chain.name,
                rpcUrls: [chain.rpcUrl],
                nativeCurrency: {
                  name: chain.currency,
                  symbol: chain.currency,
                  decimals: 18,
                },
              },
            ],
          });
          setIsNetworkModalOpen(false);
        } catch (addError) {
          console.error("添加新网络失败:", getErrorMessage(addError));
          setErrorMessage("添加新网络失败");
        }
      } else {
        setErrorMessage("切换网络失败");
      }
    }
  };

  const handleCopyAddress = () => {
    if (userAddress) {
      navigator.clipboard.writeText(userAddress);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDisconnect = () => {
    setUserAddress(null);
    setNetwork(null);
    setIsUnsupportedNetwork(false);
    setEnsName(null);
    setAvatarUrl(null);
    setIsAccountModalOpen(false);
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = () => updateState();
    window.ethereum.on("chainChanged", handleChainChanged);
    updateState();

    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountModalRef.current &&
        !accountModalRef.current.contains(event.target as Node)
      ) {
        setIsAccountModalOpen(false);
      }
      if (
        networkModalRef.current &&
        !networkModalRef.current.contains(event.target as Node)
      ) {
        setIsNetworkModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.ethereum.removeListener("chainChanged", handleChainChanged);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="wallet-container-v2">
      {!userAddress ? (
        <button onClick={connectWallet} className="connect-button">
          连接钱包
        </button>
      ) : isUnsupportedNetwork ? (
        <button
          onClick={() => setIsNetworkModalOpen(true)}
          className="wrong-network-button-large"
        >
          网络错误
        </button>
      ) : (
        <div className="profile-container">
          {network && (
            <button
              onClick={() => setIsNetworkModalOpen(true)}
              className="network-button"
            >
              {network.name === "unknown"
                ? `Chain ID: ${network.chainId}`
                : network.name}
            </button>
          )}
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="profile-button"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="avatar" />
            ) : (
              <div className="avatar-placeholder" />
            )}
            <span>{ensName || formattedAddress}</span>
          </button>
        </div>
      )}

      {isAccountModalOpen && userAddress && (
        <div className="modal-overlay">
          <div className="modal-content" ref={accountModalRef}>
            <button
              onClick={() => setIsAccountModalOpen(false)}
              className="close-button"
            >
              &times;
            </button>
            <div className="modal-header">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="modal-avatar" />
              ) : (
                <div className="modal-avatar-placeholder" />
              )}
              <span className="modal-ens">{ensName || formattedAddress}</span>
              {ensName && (
                <span className="modal-address">{formattedAddress}</span>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={handleCopyAddress} className="action-button">
                {copySuccess ? "已复制!" : "复制地址"}
              </button>
              <button
                onClick={handleDisconnect}
                className="action-button disconnect"
              >
                断开连接
              </button>
            </div>
          </div>
        </div>
      )}

      {isNetworkModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" ref={networkModalRef}>
            <button
              onClick={() => setIsNetworkModalOpen(false)}
              className="close-button"
            >
              &times;
            </button>
            <h3 className="modal-title">切换网络</h3>
            <div className="network-list">
              {supportedChains.map((chain) => (
                <button
                  key={chain.chainId}
                  className={`network-item ${
                    network?.chainId === chain.chainId ? "active" : ""
                  }`}
                  onClick={() => handleSwitchNetwork(chain)}
                >
                  {chain.name}
                  {network?.chainId === chain.chainId && (
                    <span className="connected-indicator"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
};
