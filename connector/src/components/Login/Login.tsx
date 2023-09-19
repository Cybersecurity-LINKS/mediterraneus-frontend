import { useMetaMask } from "@/hooks/useMetaMask";
import { useEffect, useState } from "react";
import { Alert, Button, Container, Form } from "react-bootstrap"
import './Login.css'
import { Credential, Duration, IotaDocument, Presentation, ProofOptions, Timestamp } from "@iota/identity-wasm/web";
import { extractNumberFromVCid, getIdentitySC, privKeytoBytes } from "@/utils";
import { useNavigate } from "react-router";
import { useConnector } from "@/hooks/useConnector";

export const Login = () => {    
    const navigate = useNavigate();

    const { wallet, isConnecting, connectMetaMask, provider } = useMetaMask();
    const [errorMessage, setErrorMessage] = useState('');
    const [loginFile, setLoginFile] = useState<HTMLInputElement | null>(null);
    const { connectorUrl, setConnector } = useConnector();


    useEffect(() => {
        setLoginFile(document.getElementById("uploadIdMat") as HTMLInputElement);
    }, []);

    const clearError = () => setErrorMessage('')

    const handleLogin = async () => {
        try {
            // get vc from file
            const login_file = loginFile!.files?.[0];
            const content = await login_file?.text();
            const idmat_json = JSON.parse(content!)
            const vc = Credential.fromJSON(idmat_json["vc"]);
            const holder_diddoc = IotaDocument.fromJSON(idmat_json["did_doc"])
            const key = privKeytoBytes(idmat_json["key"]);
            console.log(vc.credentialSubject().at(0)?.id) // holder did

            // verify if vc_id is on IDSC and active
            const vc_id = extractNumberFromVCid(vc);
            const IDSC_istance = await getIdentitySC(provider!);
            if(!(await IDSC_istance.isVCActive(vc_id))) {
                throw "VC is not Active!";
            }

            // req challenge from back
            // TODO
            const challenge = ""

            // create VP
            const unsignedVp = new Presentation({
                holder: vc.credentialSubject().at(0)?.id,
                verifiableCredential: vc,
            });
            
            // Sign the verifiable presentation using the holder's verification method
            // and include the requested challenge and expiry timestamp.
            const signedVp = await holder_diddoc.signPresentation(
                unsignedVp,
                key,
                "#key-1",
                new ProofOptions({
                    challenge: challenge,
                    expires: Timestamp.nowUTC().checkedAdd(Duration.minutes(10)),
                }),
            );

            // send VP to backend   
            
        } catch (error) {
            console.log(error)
        }
    }

    const handleRegister = async () => {
        navigate("/register", {
            state: {fromLogin: true}
        })
    }

    return(
        <Container className="mt-5 d-flex justify-content-center">
            <div className="login-container">
                <div className="login-box">
                    <Form className="login-form p-4 rounded">
                        <h1 className="text-center" style={{color: 'blue'}}>Login</h1>

                    {/* Connect Wallet Section */}
                    <Form.Group className="mt-5" controlId="username">
                        <h4>Connect your wallet</h4>
                        <hr className="mb-3" />
                        {/* Check if MetaMask is available and no accounts are connected */}
                        {window.ethereum?.isMetaMask && wallet.accounts.length < 1 && (
                        <Button
                            variant="outline-primary"
                            disabled={isConnecting}
                            onClick={connectMetaMask}
                        >
                            Connect MetaMask
                        </Button>
                        ) || <Form.Text style={{fontSize: '18px', color: 'blue'}}>{wallet.accounts[0]}</Form.Text>
                        }
                    </Form.Group>

                    {/* Load Verifiable Presentation Section */}
                    <Form.Group controlId="uploadIdMat" className="mt-5">
                        <h4>Load your Identity</h4>
                        <hr className="mb-3" />
                        <div className='d-flex justify-content-center '>
                            <Form.Control type="file" size="lg" accept='.json'/>
                        </div>
                    </Form.Group>

                    <Form.Group controlId="connService" className="mt-5">
                        <h4>Specify your Connector Service</h4>
                        <hr className="mb-3" />
                        <div className='d-flex justify-content-center '>
                            <Form.Control type="input" size="lg" onChange={(event) => {setConnector(event.target.value)}}/>
                        </div>
                    </Form.Group>

                    {/* Login Button */}
                    <Container className="d-flex justify-content-center">
                        <Button className="mt-5 btn-block" size="lg" variant="outline-success" onClick={handleLogin}>
                            Login
                        </Button>
                        <Button className="ms-3 mt-5 btn-block" size="lg" variant="outline-warning" onClick={handleRegister}>
                            Register
                        </Button>
                    </Container>

                    {/* Error Message Display */}
                    {errorMessage && (
                        <Alert className="mt-4" variant="danger" onClick={clearError} dismissible>
                        <strong>Error:</strong> <div style={{color: 'black'}}>{errorMessage}</div>
                        </Alert>
                    )}
                    </Form>
                </div>
            </div>
        </Container>
    )
}