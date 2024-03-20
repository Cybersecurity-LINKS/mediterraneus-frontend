// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import './Login.css'
import { Button, Container, } from "react-bootstrap"
import { Navigate } from "react-router";
// import catalogueAPI from '@/api/catalogueAPIs'; 
import connectorAPI from '@/api/connectorAPIs';

import { useIdentity } from "@/hooks/useIdentity";
import { useAuth } from "@/hooks/useAuth";
import { useError } from "@/hooks/useError";
// import { useMetaMask } from "@/hooks/useMetaMask"; 

import isUrl from "is-url";
import verifierAPI from '@/api/verifierAPIs';


export function Login() {    

    const { isAuthenticated, setIsAuthenticated } = useAuth();
    // const { wallet } = useMetaMask();
    const { connectorUrl, did, id } = useIdentity()
    const { setError } = useError();

    const handleLogin = async () => {
        if (!isUrl(connectorUrl)) {
            setError('Connector url missing');
            throw "Connector url missing";
        }

        // try {
        //     // login to backend, receive challenge
        //     const challenge = await catalogueAPI.getChallenge(wallet.accounts[0]);
        //     // ask connector (identity key wallet) to create a vp
        //     const signed_vp = await connectorAPI.generatePresentation(connectorUrl, challenge, wallet.accounts[0]);
        //     // send vp to verifier (catalogue)
        //     if( await catalogueAPI.login(signed_vp, wallet.accounts[0]) ) { // login ok 
        //         setIsAuthenticated(true);
        //         localStorage.setItem("token", "true");
        //     } else {
        //         setError('Login failed!');
        //     } 
        // } catch (error) {
        //     setError('Login failed!');
        //     console.log(error)
        // }

        // Verifier test
        try {
            console.log(did!.toString());
            // login to backend, receive challenge
            const challenge = await verifierAPI.getChallenge(did!.toString());
            // ask connector (identity key wallet) to create a vp
            const presentationJwt = await connectorAPI.generatePresentation(connectorUrl, challenge, id!, null);
            // send vp to verifier (catalogue)
            if( await verifierAPI.helloWorld(presentationJwt.presentation) ) { // login ok 
                setIsAuthenticated(true);
                localStorage.setItem("token", "true");
            } else {
                setError('Login failed!');
            } 
        } catch (error) {
            setError('Login failed!');
            console.log(error)
        }
    }

    // const handleRegister = async () => {
    //     if (!isUrl(connectorUrl)) {
    //         setErrorMessage('Connector url missing');
    //         throw "Connector url missing";
    //     }
    //     try {
    //         // TODO: check if the credential is set, then check if it is still active 
    //         const IDSC_istance = await getIdentitySC(provider!);
    //         const is_active = await IDSC_istance.isVCActive_Addr(wallet.accounts[0]);
    //         if(is_active === true) {
    //             setErrorMessage("Already registered. Please continue with Login")
    //         } else {
    //             navigate("/register");
    //         }    
    //     } catch (error: any) {
    //         // if exception is thrown by the idsc call it means that the given
    //         // eth address does not have a vc. So it still lies in the case where
    //         // the navigate has to be called.
    //         navigate("/register");
    //     }
        
    // }

    return( 
        isAuthenticated 
        ? 
        <Navigate to="/protected-catalogue" /> 
        :
        <>
            <h1 className="text-center">Verifier</h1>
            <Container className="d-flex justify-content-center mt-5">
                <Button variant="primary" onClick={handleLogin}>Log in with credential</Button>  
            </Container>     
        </>
    )
}