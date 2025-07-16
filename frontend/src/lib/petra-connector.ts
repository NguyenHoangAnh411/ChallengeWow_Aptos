// Petra Wallet Connector for RainbowKit
export const petraConnector = () => {
  return {
    id: 'petra',
    name: 'Petra',
    iconUrl: 'https://petra.app/favicon.ico',
    iconBackground: '#000000',
    downloadUrls: {
      chrome: 'https://chrome.google.com/webstore/detail/petra-aptos-wallet/ejjladinncaoajkhkmocdnaabaieajji',
      firefox: 'https://addons.mozilla.org/en-US/firefox/addon/petra-aptos-wallet/',
      safari: 'https://apps.apple.com/app/petra-aptos-wallet/id6446058620',
    },
    createConnector: () => {
      return {
        connector: {
          connect: async () => {
            if (!isPetraInstalled()) {
              throw new Error('Petra wallet is not installed');
            }
            
            try {
              const petra = (window as any).petra;
              const account = await petra.connect();
              return {
                account: account.address,
                chain: { id: 1, unsupported: false },
              };
            } catch (error) {
              throw new Error('Failed to connect to Petra wallet');
            }
          },
          disconnect: async () => {
            if (isPetraInstalled()) {
              const petra = (window as any).petra;
              await petra.disconnect();
            }
          },
          getAccount: async () => {
            if (!isPetraInstalled()) return null;
            
            try {
              const petra = (window as any).petra;
              const account = await petra.account();
              return account.address;
            } catch (error) {
              return null;
            }
          },
          isConnected: async () => {
            if (!isPetraInstalled()) return false;
            
            try {
              const petra = (window as any).petra;
              return petra.isConnected();
            } catch (error) {
              return false;
            }
          },
        },
        mobile: {
          getUri: async () => {
            return 'https://petra.app/';
          },
        },
        qrCode: {
          getUri: async () => {
            return 'https://petra.app/';
          },
        },
        extension: {
          instructions: {
            learnMoreUrl: 'https://petra.app/',
            steps: [
              {
                description: 'Install the Petra extension',
                step: 'install',
                title: 'Install Petra',
              },
              {
                description: 'Create or import a wallet',
                step: 'create',
                title: 'Create or Import Wallet',
              },
              {
                description: 'Connect your wallet to this site',
                step: 'connect',
                title: 'Connect Wallet',
              },
            ],
          },
        },
      };
    },
  };
};

// Check if Petra is installed
export const isPetraInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).petra;
};

// Connect to Petra wallet
export const connectPetraWallet = async () => {
  if (!isPetraInstalled()) {
    throw new Error('Petra wallet is not installed');
  }

  try {
    const petra = (window as any).petra;
    const account = await petra.connect();
    return account;
  } catch (error) {
    throw new Error('Failed to connect to Petra wallet');
  }
};

// Disconnect from Petra wallet
export const disconnectPetraWallet = async () => {
  if (!isPetraInstalled()) return;

  try {
    const petra = (window as any).petra;
    await petra.disconnect();
  } catch (error) {
    console.error('Failed to disconnect from Petra wallet:', error);
  }
};

// Get Petra account
export const getPetraAccount = async () => {
  if (!isPetraInstalled()) return null;

  try {
    const petra = (window as any).petra;
    const account = await petra.account();
    return account;
  } catch (error) {
    return null;
  }
};

// Sign transaction with Petra
export const signTransactionWithPetra = async (transaction: any) => {
  if (!isPetraInstalled()) {
    throw new Error('Petra wallet is not installed');
  }

  try {
    const petra = (window as any).petra;
    const signedTransaction = await petra.signTransaction(transaction);
    return signedTransaction;
  } catch (error) {
    throw new Error('Failed to sign transaction with Petra');
  }
};

// Sign message with Petra
export const signMessageWithPetra = async (message: string) => {
  if (!isPetraInstalled()) {
    throw new Error('Petra wallet is not installed');
  }

  try {
    const petra = (window as any).petra;
    const signature = await petra.signMessage(message);
    return signature;
  } catch (error) {
    throw new Error('Failed to sign message with Petra');
  }
};

// Declare global types for Petra
declare global {
  interface Window {
    petra?: {
      connect: () => Promise<any>;
      disconnect: () => Promise<void>;
      account: () => Promise<any>;
      signTransaction: (transaction: any) => Promise<any>;
      signMessage: (message: string) => Promise<any>;
      isConnected: () => boolean;
      network: () => Promise<string>;
    };
  }
} 