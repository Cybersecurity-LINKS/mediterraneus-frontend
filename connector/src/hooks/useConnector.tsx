import { useEffect, useState, createContext, useContext, PropsWithChildren } from 'react';

interface ConnectorData {
    connectorUrl: string,
    setConnector: (baseUrl: string) => void
}

const ConnectorContext = createContext<ConnectorData>({} as ConnectorData)

export const ConnectorContextProvider = ({ children }: PropsWithChildren) => {
    const [baseUrl, setBaseUrl] = useState("");

    const setConnector = (baseUrl: string) => {
      setBaseUrl(baseUrl);
  }

  return (
    <ConnectorContext.Provider
        value={{
          connectorUrl: baseUrl,
            setConnector
        }}
    >
        {children}
    </ConnectorContext.Provider>
  )
}

export const useConnector = () => {
  const context = useContext(ConnectorContext)
  if (context === undefined) {
    throw new Error('useContext must be used')
  }
  return context
}