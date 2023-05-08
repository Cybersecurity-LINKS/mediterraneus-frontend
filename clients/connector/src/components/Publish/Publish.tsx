import { MouseEvent, useState } from 'react';
import { Card } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { ethers } from 'ethers';
import { getContractABI, getContractAddress } from '@/utils';
import { useMetaMask } from '@/hooks/useMetaMask';

export const Publish = () => {
    const [NFTname, setNFTname] = useState("");
    const [NFTsymbol, setNFTsymbol] = useState("");
    const [NFTuri, setNFTuri] = useState("");
    const [errors, setErrors] = useState({});
    const [published, setPublished] = useState(false);

    const { wallet, provider } = useMetaMask()

    const handleSubmit = async (event: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
        try{
            event.preventDefault();
            const contractABI = await getContractABI("ERC721Factory");
            const contractAddress = getContractAddress("ERC721Factory");
            // console.log(contractAddress);
            // console.log(contractABI);

            const signer = await provider!.getSigner();

            let contractIstance = new ethers.Contract(contractAddress!, contractABI, signer);

            await contractIstance.deployERC721Contract(
                NFTname,
                NFTsymbol,
                NFTuri.toString(),
                wallet.accounts[0]
            ); 
            console.log("New ERC721 NFT contract deployed successfully!");
            
            await contractIstance.on("NFTCreated", async (erc721Instance, newERC721baseAddress, name, owner, symbol, tokenURI, sender, event) => {
                console.log(erc721Instance, newERC721baseAddress, name, owner, symbol, tokenURI, sender, event);
                // let newERC721Address: string[] = await contractIstance.getNFTCreatedAddress();
                // console.log(newERC721Address);
            });

        } catch (err) {
            console.log(err);
        }
    }

    return (
        <>
        <Card style={{width: '80rem'}}>
        <Card.Body>
            <Card.Title>Publish new Data NFT</Card.Title>
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

            <Form.Group className="mb-3" controlId="formNFTuri">
                <Form.Label>NFT Metadata URI</Form.Label>
                <Form.Control size="lg" type="input" placeholder="Enter the NFT metadata URI" onChange={(event) => { setNFTuri(event.target.value) }} />
            </Form.Group>

            <Button variant="primary" type="submit" className='mt-3 mb-3' onClick={(event) => { handleSubmit(event) }}>
                Create Data NFT
            </Button>
            </Form>
        </Card>
        </>
    );
}