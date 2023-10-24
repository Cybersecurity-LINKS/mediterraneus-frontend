import { Credential, IotaDID, IotaDocument } from "@iota/identity-wasm/web"
import { useState, useEffect, createContext, PropsWithChildren, useContext } from 'react'
import isUrl from 'is-url';

interface IdentityData {
    did: IotaDID | undefined
    didDoc: IotaDocument | undefined
    vc: Credential | undefined
    trigger: boolean
    loading: boolean
    connectorUrl: string
    setConnector: (connectorUrl: string) => void
    setTriggerTrue: () => void
    setTriggerFalse: () => void
    clearSessionStorage: () => void
}

const IdentityContext = createContext<IdentityData>({} as IdentityData);

export const IdentityContextProvider = ({ children }: PropsWithChildren) => {
    const [connectorUrl, setConnectorUrl] = useState("");
    const [did, setDid] = useState<IotaDID>();
    const [didDoc, setDidDoc] = useState<IotaDocument>();
    const [vc, setVc] = useState<Credential>();

    const [trigger, setTrigger] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingStorage, setloadingStorage] = useState(true); // TODO: why this is here?

    useEffect(() => {
        // console.log("Use effect, use identity");
        const url = sessionStorage.getItem("connectorUrl");
        if (url != null && url != undefined) {
            setConnectorUrl(url);
            setTrigger(true);
            setloadingStorage(false);
        }
    
    }, []);   

    useEffect(() => {
        // console.log("Use effect 2, use identity");
        const getIDfromBackend = async () => {
            // console.log("Here...");
            if (!isUrl(connectorUrl)) {
                throw "Connector url missing";
            }

            console.log("Get DID and VC from Connector");
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const response = await fetch(`${connectorUrl}/identity/${accounts[0]}`, {
                method: 'GET',
                headers: {
                    "Content-type": "application/json"
                },
            });
            if(response.status == 200){
                const json_resp = await response.json();
                setDid(json_resp.did);
                setDidDoc(json_resp.did_doc);
                if(json_resp.vc != null)
                    setVc(Credential.fromJSON(json_resp.vc));
            } else {
                setDid(undefined);
                setDidDoc(undefined);
                setVc(undefined);
            }
            setLoading(false);
        };

        // console.log(trigger, !loadingStorage);
        if(trigger && !loadingStorage){
            window.ethereum.on('accountsChanged', getIDfromBackend);
            // console.log("Connecting to Connector:", connectorUrl)
            if(connectorUrl !== "") {
                getIDfromBackend();   
            } else {
                setDid(undefined);
                setDidDoc(undefined);
                setVc(undefined);
                setLoading(false);
            }
            setTrigger(false);
        }
    }, [trigger, connectorUrl, loadingStorage]);

    const setTriggerTrue = () => {
        setTrigger(true);
    }

    const setTriggerFalse = () => {
        setTrigger(false);
    }

    const setConnector = (baseUrl: string) => {
        sessionStorage.setItem("connectorUrl", baseUrl);
        setConnectorUrl(baseUrl);
    }

    const clearSessionStorage = () => {
        sessionStorage.setItem("connectorUrl", "");
        setConnectorUrl("");
        setDid(undefined);
        setDidDoc(undefined);
        setVc(undefined);
    }

    return (
    <IdentityContext.Provider
        value={{
            did,
            didDoc,
            vc,
            trigger,
            loading,
            connectorUrl,
            setConnector,
            setTriggerTrue,
            setTriggerFalse,
            clearSessionStorage
        }}
    >
        {children}
    </IdentityContext.Provider>)
}

export const useIdentity = () => {
    const context = useContext(IdentityContext)
    if (context === undefined) {
        throw new Error('useMetaMask must be used within a "MetaMaskContextProvider"')
    }
    return context
}