// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { IotaDID, IotaDocument, Jwt } from "@iota/identity-wasm/web"
import { useState, useEffect, createContext, PropsWithChildren, useContext } from 'react'
import isUrl from 'is-url';
import connectorAPI from "@/api/connectorAPIs";

interface IdentityData {
    id: number | undefined
    did: IotaDID | undefined
    didDoc: IotaDocument | undefined
    vc: Jwt | undefined
    credentialId: number | undefined
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
    const [id, setId] = useState<number>();
    const [did, setDid] = useState<IotaDID>();
    const [didDoc, setDidDoc] = useState<IotaDocument>();
    const [vc, setVc] = useState<Jwt>();
    const [credentialId, setCredentialId] = useState<number>();

    const [trigger, setTrigger] = useState(true);
    const [loading, setLoading] = useState(true);
    // const { wallet } = useMetaMask();

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
                setId(identity.id);
                setDid(identity.did);
                setDidDoc(identity.did_doc); // TODO: new api or contact directly the node
                if(identity.vcredential != undefined && identity.vcredential != null) { // TODO: show the json
                    // setVc(Credential.fromJSON(identity.vc)); 
                    setVc(new Jwt(identity.vcredential as string));
                    setCredentialId(identity.credentialId);
                } else {
                    setVc(undefined);
                    setCredentialId(undefined);
                }
            } catch (err) {
                setId(undefined);
                setDid(undefined);
                setDidDoc(undefined);
                setVc(undefined);
                setCredentialId(undefined);
            }
            setLoading(false);
        };

        if(trigger){
            window.ethereum.on('accountsChanged', getIDfromBackend);
            // console.log("Connecting to Connector:", connectorUrl)
            if(connectorUrl !== "") {
                getIDfromBackend();   
            } else {
                setId(undefined);
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
        setId(undefined);
        setDid(undefined);
        setDidDoc(undefined);
        setVc(undefined);
    }

    // const createDID = async () => {
    //     try {
    //         console.log("Wallet address: ", wallet.accounts[0]);
    //         await connectorAPI.createDID(connectorUrl,  wallet.accounts[0]);
            
    //     } catch (error) {
    //         console.log(error)
    //         throw error;
    //     }
    // }

    return (
    <IdentityContext.Provider
        value={{
            id,
            did,
            didDoc,
            vc,
            credentialId,
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
        throw new Error('useIdentity must be used within a "IdentityContextProvider"')
    }
    return context
}