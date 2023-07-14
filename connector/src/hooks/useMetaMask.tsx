import { useState, useEffect, createContext, PropsWithChildren, useContext } from 'react'

import detectEthereumProvider from '@metamask/detect-provider'
import { formatBalance } from '@/utils'
import { BrowserProvider, JsonRpcProvider, ethers } from 'ethers'


const shimmerJsonRpcUrl = import.meta.env.VITE_SHIMMER_JSON_RPC_URL as string;

interface MetaMaskData {
  wallet: typeof initialState
  provider: BrowserProvider | null
  shimmerProvider: JsonRpcProvider
  hasProvider: boolean | null
  error: boolean
  errorMessage: string
  isConnecting: boolean
  connectMetaMask: () => void
  clearError: () => void
}

const initialState = { accounts: [], balance: '', chainId: '' }

const MetaMaskContext = createContext<MetaMaskData>({} as MetaMaskData)

export const MetaMaskContextProvider = ({ children }: PropsWithChildren) => {
  const [hasProvider, setHasProvider] = useState<boolean | null>(null)
  const [wallet, setWallet] = useState(initialState)

  const [isConnecting, setIsConnecting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [shimmerProvider, setShimmerProvider] = useState<JsonRpcProvider>(new ethers.JsonRpcProvider(shimmerJsonRpcUrl));

  
  useEffect(() => {
    const refreshAccounts = (accounts: any) => {
      if (accounts.length > 0) {
        updateWallet(accounts)
      } else {
        // if length 0, user is disconnected
        setWallet(initialState)
      }
    }

    const refreshChain = async (chainId: any) => {
      const accounts = await window.ethereum.request(
        { method: 'eth_accounts' }
      )
      refreshAccounts(accounts)
      setWallet((wallet) => ({ ...wallet, chainId }))
    }

    const getProvider = async () => {
      const provider = await detectEthereumProvider({ silent: true })
      setHasProvider(Boolean(provider))

      if (provider) {
        const accounts = await window.ethereum.request(
          { method: 'eth_accounts' }
        )
        refreshAccounts(accounts)
        window.ethereum.on('accountsChanged', refreshAccounts)
        window.ethereum.on('chainChanged', refreshChain)
      }
    }

    const initializeProvider = async() => {
      let tmp = new ethers.BrowserProvider(window.ethereum)
      setProvider(tmp);
      // // Prompt user for account connections
      // await provider.send("eth_requestAccounts", []);
    }

    const initializeProviderShimmer = async() => {
      setShimmerProvider(new JsonRpcProvider(shimmerJsonRpcUrl.toString()));
    }
    
    initializeProviderShimmer();
    initializeProvider();
    getProvider();

    return () => {
      window.ethereum?.removeListener('accountsChanged', refreshAccounts)
      window.ethereum?.removeListener('chainChanged', refreshChain)
    }
  }, [])

  const updateWallet = async (accounts: any) => {
    const balance = formatBalance(await window.ethereum!.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest'],
    }))
    const chainId = await window.ethereum!.request({
      method: 'eth_chainId',
    })
    setWallet({ accounts, balance, chainId })
  }

  const connectMetaMask = async () => {
    setIsConnecting(true)
    await window.ethereum.request({
      method: 'eth_requestAccounts',
    })
      .then((accounts: []) => {
        setErrorMessage('')
        updateWallet(accounts)
      })
      .catch((err: any) => {
        setErrorMessage(err.message)
      })
    setIsConnecting(false)
  }

  const clearError = () => setErrorMessage('')

  return (
    <MetaMaskContext.Provider
      value={{
        wallet,
        provider,
        shimmerProvider,
        hasProvider,
        error: !!errorMessage,
        errorMessage,
        isConnecting,
        connectMetaMask: connectMetaMask,
        clearError
      }}
    >
      {children}
    </MetaMaskContext.Provider>
  )
}

export const useMetaMask = () => {
  const context = useContext(MetaMaskContext)
  if (context === undefined) {
    throw new Error('useMetaMask must be used within a "MetaMaskContextProvider"')
  }
  return context
}