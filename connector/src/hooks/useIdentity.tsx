import { Credential, IotaDID, IotaDocument } from "@iota/identity-wasm/web"
import { useState, useEffect, createContext, PropsWithChildren, useContext } from 'react'
import { useConnector } from "@/hooks/useConnector";

interface IdentityData {
    did: IotaDID | undefined
    didDoc: IotaDocument | undefined
    vc: Credential | undefined
    trigger: boolean
    loading: boolean
    setTriggerTrue: () => void
    setTriggerFalse: () => void
}

const IdentityContext = createContext<IdentityData>({} as IdentityData);

export const IdentityContextProvider = ({ children }: PropsWithChildren) => {
    const { connectorUrl } = useConnector();
    const [did, setDid] = useState<IotaDID>();
    const [didDoc, setDidDoc] = useState<IotaDocument>();
    const [vc, setVc] = useState<Credential>();

    const [trigger, setTrigger] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getIDfromBackend = async () => {
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

        if(trigger){
            window.ethereum.on('accountsChanged', getIDfromBackend);
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

    return (
    <IdentityContext.Provider
        value={{
            did,
            didDoc,
            vc,
            trigger,
            loading,
            setTriggerTrue,
            setTriggerFalse
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