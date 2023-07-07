import { localStorageManager } from '../../../../../common/utils/localStorageManager';
import { CardanoNetwork } from './old/CardanoWalletContract';
import { Wallet } from './Wallet';

export type WalletChangeCallback = (wallet: Wallet | undefined) => void;

export interface WalletManager {
  registerWallets: (w: Wallet | Wallet[]) => void;
  getActiveWallet: <T extends Wallet>() => T | undefined;
  setActiveWallet: (wallet: Wallet | string) => Promise<boolean>;
  clearWallet: () => void;
  onWalletChange: (callback: WalletChangeCallback) => () => void;
  availableWallets: Wallet[];
}

export interface CacheStrategy {
  set(walletId?: string): void;
  get(): string | undefined | null;
}

export class LocalStorageCacheStrategy implements CacheStrategy {
  constructor(private key: string) {}

  set(walletId?: string) {
    if (walletId) {
      localStorageManager.set(this.key, walletId);
    } else {
      localStorageManager.remove(this.key);
    }
  }

  get(): string | undefined | null {
    return localStorageManager.get<string>(this.key);
  }
}

export interface CreateWalletManagerParams {
  readonly cacheStrategy?: CacheStrategy;
  readonly availableWallets?: Wallet[];
  readonly network?: CardanoNetwork;
}

export const createWalletManager = (
  params?: CreateWalletManagerParams,
): WalletManager => {
  const activeNetworkId =
    params?.network === undefined ? CardanoNetwork.MAINNET : params?.network;
  const cacheStrategy =
    params?.cacheStrategy ||
    new LocalStorageCacheStrategy('cardano-active-wallet');
  let activeWallet: Wallet | undefined;
  let handleWalletChange: WalletChangeCallback | undefined;
  let availableWallets: Wallet[] = params?.availableWallets || [];

  const clearWallet = (): void => {
    cacheStrategy.set(undefined);
    activeWallet = undefined;
    if (handleWalletChange) {
      handleWalletChange(undefined);
    }
  };

  const getActiveWallet = <W extends Wallet>(): W | undefined => {
    if (!activeWallet) {
      return undefined;
    }
    return activeWallet as W;
  };

  const onWalletChange = (callback: WalletChangeCallback) => {
    handleWalletChange = callback;

    return () => {
      handleWalletChange = undefined;
    };
  };

  const assetNetworkId = (networkId: CardanoNetwork): Promise<void> => {
    return networkId === activeNetworkId
      ? Promise.resolve()
      : Promise.reject(
          new Error(`Wallet network mismatch. Expected ${networkId}`),
        );
  };

  const registerWallets = (w: Wallet | Wallet[]): void => {
    if (w instanceof Array) {
      availableWallets = [...availableWallets, ...w];
    } else {
      availableWallets = [...availableWallets, w as Wallet];
    }
  };

  const setActiveWallet = (
    wallet: Wallet | string,
    checkEnabling = false,
  ): Promise<boolean> => {
    const walletId = typeof wallet === 'string' ? wallet : wallet.id;
    const walletObject = availableWallets.find((aw) => aw.id === walletId);

    if (!walletObject) {
      return Promise.reject(new Error(`unknown wallet ${walletId}`));
    }
    if (!walletObject.connector) {
      return Promise.reject(
        new Error(`connector for wallet ${walletId} not found`),
      );
    }
    return walletObject
      .assertContext((context) => context.getNetworkId())
      .then(assetNetworkId)
      .then(() => {
        cacheStrategy.set(walletObject.id);
        activeWallet = walletObject;
        if (handleWalletChange) {
          handleWalletChange(walletObject);
        }

        return true;
      });
  };

  if (cacheStrategy.get()) {
    const walletObject = availableWallets.find(
      (w) => w.id === cacheStrategy.get(),
    );
  }

  return {
    registerWallets,
    getActiveWallet,
    setActiveWallet,
    onWalletChange,
    clearWallet,
    availableWallets,
  };
};
