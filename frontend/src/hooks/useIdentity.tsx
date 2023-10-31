import { Credential, IotaDID, IotaDocument } from "@iota/identity-wasm/web"
import { useState, useEffect, createContext, PropsWithChildren, useContext } from 'react'
import isUrl from 'is-url';
import connectorAPI from "@/api/connectorAPIs";
import { useMetaMask } from "./useMetaMask";

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
    const { provider, wallet } = useMetaMask();

    useEffect(() => {
        // console.log("Use effect, use identity");
        const url = sessionStorage.getItem("connectorUrl");
        if (url != null && url != undefined) {
            setConnectorUrl(url);
            setTrigger(true);
        }
    
    }, []);   

    useEffect(() => {
        // console.log("Use effect 2, use identity");
        const getIDfromBackend = async () => {
            // console.log("Here...");
            if (!isUrl(connectorUrl)) {
                throw "Connector url missing";
            }

            //TODO: remove this from here
            try {
                console.log("Get DID and VC from Connector");
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                const identity = await connectorAPI.getIdentity(connectorUrl, accounts[0]);
                setDid(identity.did);
                setDidDoc(identity.did_doc);
                if(identity.vc != null)
                    setVc(Credential.fromJSON(identity.vc));
            } catch (err) {
                setDid(undefined);
                setDidDoc(undefined);
                setVc(undefined);
            }
            setLoading(false);
        };

        if(trigger){
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
    }, [trigger, connectorUrl]);

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

    const createDID = async () => {
        try {
            console.log("Wallet address: ", wallet.accounts[0]);
            await connectorAPI.createDID(connectorUrl,  wallet.accounts[0]);
            
        } catch (error) {
            console.log(error)
            throw error;
        }
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