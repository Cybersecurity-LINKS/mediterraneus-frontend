import { MouseEvent, useState } from 'react';
import { Card, Button, Form } from 'react-bootstrap';
import { FixedNumber, MaxUint256, ethers } from 'ethers';
import { getContractABI, getContractAddress, getPermitDigest } from '@/utils';
import { useMetaMask } from '@/hooks/useMetaMask';

export const Publish = () => {
    const [NFTname, setNFTname] = useState("");
    const [NFTsymbol, setNFTsymbol] = useState("");
    const [NFTuri, setNFTuri] = useState("");

    const [DTname, setDTname] = useState("");
    const [DTsymbol, setDTsymbol] = useState("");
    const [DTinitialSupply, setDTinitialSupply] = useState<BigInt>(BigInt(0));
    const [DTmaxSupply, setDTmaxSupply] = useState<BigInt>(BigInt(0));

    const [errors, setErrors] = useState({});
    const [published, setPublished] = useState(false);

    const { wallet, provider } = useMetaMask()

    const handleSubmit = async (event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
        try{
            event.preventDefault();
            const signer = await provider!.getSigner();

            const contractABI = await getContractABI("ERC721Factory");
            const exchangeABI = await getContractABI("FixedRateExchange");
            const contractAddress = getContractAddress("ERC721Factory");
            const exchangeAddress = getContractAddress("FixedRateExchange");

            const contractIstance = new ethers.Contract(contractAddress!, contractABI, signer);
            const exchangeInstance = new ethers.Contract(exchangeAddress!, exchangeABI, signer);

            await contractIstance.deployERC721Contract(
                NFTname,
                NFTsymbol,
                NFTuri.toString(),
                wallet.accounts[0]
            );

            await contractIstance.on("NFTCreated", async (newERC721Contract, ERC721baseAddress, name, owner, symbol, tokenURI, sender, event) => {
                console.log("New ERC721 NFT contract deployed successfully!");
                console.log(newERC721Contract, ERC721baseAddress, name, owner, symbol, tokenURI, sender, event);
                /**
                * Given the new NFT contract address create also the required DT.
                */
                const ERC721baseABI = await getContractABI("ERC721Base");
                let erc721ContractIstance = new ethers.Contract(newERC721Contract, ERC721baseABI, signer);
                            
                await erc721ContractIstance.createDataToken(
                    DTname,
                    DTsymbol,
                    ethers.parseEther(DTmaxSupply.toString())
                );
                await erc721ContractIstance.on("TokenCreated", async (name_, symbol_, owner_, NFTcontractAddress_, newERC20address_, maxSupply_, initialSupply_, event) => {
                    console.log(name_, symbol_, owner_, NFTcontractAddress_, newERC20address_, maxSupply_, initialSupply_, event);
                    /**
                     * Given the new DT contract address wait for minting.
                     */
                    const ERC20baseABI = await getContractABI("ERC20Base");
                    let erc20ContractIstance = new ethers.Contract(newERC20address_, ERC20baseABI, signer);
                    
                    /** exchange with no mint permission => so i can test the permit mechnism
                     *  1. Mint tokens to the owner address
                     *  2. Approve the exchange to move tokens on behalf of owner
                     *  3. Try to exchange DT <=> SMR and see if the exchange can actually call the transferFrom()
                    *  */ 
                    const ownerAddress = await erc20ContractIstance.getDTowner();
                    let ownerWallet = new ethers.Wallet("e437c5b63d7514211dc55d47cd380cf002a2f44cb3034b6ebc101027bfb3dbce", provider);  
                    const nonce = await erc20ContractIstance.nonces(ownerAddress);

                    await erc20ContractIstance.mint(ownerAddress, ethers.parseEther("10")); // mint 10 DTs
                    await erc20ContractIstance.createFixedRate(exchangeAddress, BigInt(1e16), 0);
                    
                    erc20ContractIstance.on("FixedRateCreated", async (exchangeID, _owner, fixedRateAddress_, event) => {
                        console.log(exchangeID, _owner, fixedRateAddress_, event);
                        // const approve = {
                        //     owner: ownerAddress,
                        //     spender: exchangeAddress!,
                        //     value: ethers.parseEther("10")
                        // }
                        // const digest = getPermitDigest(
                        //     DTname,
                        //     newERC20address_,
                        //     Number((await provider!.getNetwork()).chainId),
                        //     approve,
                        //     nonce,
                        //     MaxUint256
                        // )
                        // const signature = ownerWallet.signingKey.sign(digest)
    
                        // await exchangeInstance.safeDeposit(
                        //     newERC20address_,
                        //     signature.v, signature.r, signature.s,
                        //     ethers.parseEther("10")
                        // )

                        await erc20ContractIstance.approve(exchangeAddress, ethers.parseEther("1"))
                        erc20ContractIstance.on("Approval", async (owner, spender, amount, event) => {
                            console.log(owner, spender, amount, event);
                            const allowance = await erc20ContractIstance.allowance(owner, spender);
                            console.log(`allowance: ${allowance}`);
                            // await erc20ContractIstance.transferFrom(ownerAddress, exchangeAddress, ethers.parseEther("1"));
                            // erc20ContractIstance.on("Transfer", (from, to, amount, event) => {
                            //     console.log(from, to, amount, event)
                            // })
                        })
                    })
                });
            });
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <>
        <Card style={{width: '80rem'}} className='mb-5 mt-3'>
            <Card.Body>
                <Card.Title>Publish new Data/Service NFT</Card.Title>
            </Card.Body>
            <Form className="container mt-3 mb-3 ps-5 pe-5">
            <Form.Group className="mb-3" controlId="formNFTname">
                <Form.Label>NFT Name</Form.Label>
                <Form.Control size="lg" type="input" placeholder="Enter the NFT Name" onChange={(event) => { setNFTname(event.target.value) }}/>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formNFTsymbol">
                <Form.Label>NFT Symbol</Form.Label>
                <Form.Control size="lg" type="input" placeholder="Enter the NFT symbol" onChange={(event) => { setNFTsymbol(event.target.value) }} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="NFTdescription">
                <Form.Label>NFT short description</Form.Label>
                <Form.Control as="textarea" rows={3} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formNFTuri">
                <Form.Label>NFT Metadata URI</Form.Label>
                <Form.Control size="lg" type="input" placeholder="Enter the NFT metadata URI" onChange={(event) => { setNFTuri(event.target.value) }} />
            </Form.Group>

            <Card.Body>
                <Card.Title>Create your fungible Data Token</Card.Title>
                <Form.Group className="mb-3 mt-3" controlId="formDTname">
                    <Form.Label>DataToken Name</Form.Label>
                    <Form.Control size="lg" type="input" placeholder="Enter the DT Name" onChange={(event) => { setDTname(event.target.value) }}/>
                </Form.Group>

                <Form.Group className="mb-3" controlId="formDTsymbol">
                    <Form.Label>DataToken Symbol</Form.Label>
                    <Form.Control size="lg" type="input" placeholder="Enter the DT symbol" onChange={(event) => { setDTsymbol(event.target.value) }} />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formDTinitialSupply">
                    <Form.Label>Initial Supply</Form.Label>
                    <Form.Control size="lg" type="input" placeholder="Enter the DT initial supply" onChange={(event) => { setDTinitialSupply(BigInt(event.target.value)) }} />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formDTmaxSupply">
                    <Form.Label>Maximum Supply</Form.Label>
                    <Form.Control size="lg" type="input" placeholder="Enter the DT maximum supply" onChange={(event) => { setDTmaxSupply(BigInt(event.target.value)) }} />
                </Form.Group>
            </Card.Body>

            <Button variant="primary" type="submit" className='mt-3 mb-3' onClick={(event) => { handleSubmit(event) }}>
                Submit
            </Button>
            </Form>
        </Card>
        </>
    );
}