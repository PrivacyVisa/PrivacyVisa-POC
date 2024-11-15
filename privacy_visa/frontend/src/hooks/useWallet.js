import { useAuth } from "../providers/AuthProvider";

export const useWallet = () => {
  const { provider, account, connectWallet, disconnectWallet } = useAuth();

  const isWalletConnected = !!account;

  return { provider, account, connectWallet, disconnectWallet, isWalletConnected };
};
