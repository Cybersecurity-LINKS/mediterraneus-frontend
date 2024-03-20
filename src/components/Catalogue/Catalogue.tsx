// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { Alert, Col, Row, Spinner } from "react-bootstrap";
import { DataOffering } from "./DataOffering";
import { useEffect, useState } from "react";
import { getContractABI, getContractAddress } from "@/utils";
import { useMetaMask } from "@/hooks/useMetaMask";
import { ethers } from "ethers";

export interface IDataOffering {
    owner: string
    NFTaddress: string
    NFTname: string
    NFTsymbol: string
    NFTmetadataURI: string
    DTname: string
    DTsymbol: string
    DTcontractAddress: string
    AssetDownloadURL: string
}

export const Catalogue = () => {

    const [dataOfferings, setDataOfferings] = useState<IDataOffering[]>([]);
    const [loading, setLoading] = useState(true);
    const columnsPerRow = 2;

    const { provider } = useMetaMask();

    useEffect(() => {

        const getNFTinfo = async (contractAddress: string): Promise<IDataOffering | undefined> => {
            try {
                const serviceBaseABI = await getContractABI("ServiceBase");
                const serviceBaseIstance = new ethers.Contract(
                    contractAddress, 
                    serviceBaseABI, 
                    provider
                );
                const [...DTcontractAddress] =  await serviceBaseIstance.getATaddresses();

                const accessTokenABI = await getContractABI("AccessTokenBase");
                const accessTokenIstance = new ethers.Contract(
                    DTcontractAddress[0], 
                    accessTokenABI, 
                    provider
                );
                
                const NFTinfo: IDataOffering = {
                    owner: await serviceBaseIstance.getServiceOwner(),
                    NFTaddress: contractAddress,
                    NFTname: await serviceBaseIstance.name(),
                    NFTsymbol: await serviceBaseIstance.symbol(),
                    NFTmetadataURI: await serviceBaseIstance.tokenURI(1),
                    DTname: await accessTokenIstance.name(),
                    DTsymbol: await accessTokenIstance.symbol(),
                    DTcontractAddress: DTcontractAddress[0],
                    AssetDownloadURL: await serviceBaseIstance.getAssetDownloadURL()
                };
                return NFTinfo;
            } catch (error) {
                console.log(error);
            }
        }
    
        const getDataOfferings = async () => {
            // call to SC
            try {
                const contractABI = await getContractABI("Factory");
                const contractAddress = getContractAddress("Factory");
                const contractIstance = new ethers.Contract(contractAddress!, contractABI, provider);
    
                const [...NFTaddresses]: string[] = await contractIstance.getAllNFTCreatedAddress();
                const NFTobjs: IDataOffering[] = [];
                for(let i = 0; i < NFTaddresses.length; i++ ) {
                    const serviceInfo = await getNFTinfo(NFTaddresses[i]);
                    if (serviceInfo != undefined) {
                        NFTobjs.push(serviceInfo);
                    }
                }
                setDataOfferings(NFTobjs);
                setLoading(false); 
            } catch (error) {
                console.log(error);
            }
        }
            
        getDataOfferings();
        
    }, [dataOfferings.length, provider]);

    return(<>
            <h1 className="text-center">Self catalogue</h1>
            {
                loading 
                ? <Row className="justify-content-center mt-5"><Spinner animation="grow" variant="primary" /></Row>
                : dataOfferings.length == 0 
                    ? <Alert variant="primary" className="text-center mt-3"> <strong>Nothing published yet!</strong></Alert> 
                    :
                    <Row md={columnsPerRow}> 
                        {
                            dataOfferings.map((NFTdataobj, index) => (<Col key={index}><DataOffering key={index} NFTdataobj={NFTdataobj} /></Col>))
                        }
                    </Row>
            }
        </>
    );
}
