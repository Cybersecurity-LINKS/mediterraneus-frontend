import './Login.css'
import { Button, Container, Form } from "react-bootstrap"
import { Navigate } from "react-router";
import catalogueAPI from '@/api/catalogueAPIs';
import connectorAPI from '@/api/connectorAPIs';

import { useIdentity } from "@/hooks/useIdentity";
import { useAuth } from "@/hooks/useAuth";
import { useError } from "@/hooks/useError";
import { useMetaMask } from "@/hooks/useMetaMask";

import isUrl from "is-url";


export function Login() {    

    const { isAuthenticated, setIsAuthenticated } = useAuth();
    const { wallet } = useMetaMask();
    const { connectorUrl } = useIdentity()
    const { setError } = useError();

    const handleLogin = async () => {
        if (!isUrl(connectorUrl)) {
            setError('Connector url missing');
            throw "Connector url missing";
        }

        try {
            // login to backend, receive challenge
            const challenge = await catalogueAPI.getChallenge(wallet.accounts[0]);
            // ask connector (identity key wallet) to create a vp
            const signed_vp = await connectorAPI.generatePresentation(connectorUrl, challenge, wallet.accounts[0]);
            // send vp to verifier (catalogue)
            if( await catalogueAPI.login(signed_vp, wallet.accounts[0]) ) { // login ok 
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
        <Navigate to="/public-catalogue" /> 
        :
        <Container className="mt-5 d-flex justify-content-center">
            <div className="login-container">
                <div className="login-box">
                    <Form className="p-4 rounded">
                        <h1 className="text-center">Hello!</h1>
                        {/* Login Buttons */}
                        <Container className="d-flex justify-content-center">
                            <Button className="mt-5" variant="outline-info" onClick={handleLogin}> Log in with credential</Button>
                            {/* <Button className="ms-3 mt-5" variant="outline-dark" onClick={handleRegister}>
                                Sign up
                            </Button> */}
                        </Container>
                    </Form>
                </div>
            </div>
        </Container>
    )
}