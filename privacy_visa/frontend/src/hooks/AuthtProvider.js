// src/providers/AuthProvider.jsx
import React, { createContext, useContext, useState } from "react";

import { Web3Auth } from "@web3auth/modal";
import { PrivyClient } from "@privy-io/privy";
import { ethers } from "ethers";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);

  // Initialize Privy
  const privyClient = new PrivyClient({ apiKey: "YOUR_PRIVY_API_KEY" });

  // Initialize Web3Auth
  const web3auth = new Web3Auth({
    clientId: "YOUR_WEB3AUTH_CLIENT_ID",
    chainConfig: {
      chainNamespace: "eip155",
      chainId: "0x1", // Ethereum Mainnet
    },
  });

  const connectWallet = async () => {
    try {
      // Trigger wallet connection
      const web3Provider = await web3auth.connect();
      const ethersProvider = new ethers.providers.Web3Provider(web3Provider);

      // Get user's wallet address
      const signer = ethersProvider.getSigner();
      const address = await signer.getAddress();

      // Authenticate the user via Privy
      await privyClient.auth(web3Provider);

      // Update state
      setProvider(ethersProvider);
      setAccount(address);
    } catch (error) {
      console.error("Wallet connection failed", error);
    }
  };

  const disconnectWallet = async () => {
    await web3auth.logout();
    setProvider(null);
    setAccount(null);
  };

  return (
    <AuthContext.Provider
      value={{ provider, account, connectWallet, disconnectWallet }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
