// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { useMetaMask } from '@/hooks/useMetaMask'
import { NETWORKS, NETWORK_BGCOLOR, NETWORK_HEIGHT, NETWORK_IMAGE, NETWORK_SYMBOL, NETWORK_WIDTH, formatChainAsNum } from '@/utils'
import { Figure, Toast, Row} from 'react-bootstrap'
import { Link } from 'react-router-dom'

export const Display = () => {

  const { wallet } = useMetaMask()
  const baseExplorerURL = import.meta.env.VITE_EVM_EXPLORER;
  
  return (
    <>
      <Toast className='mt-3 ms-5'>
        <Toast.Header closeButton={false}>
          <Figure className='mt-2 ms-2 rounded me-2' style={{backgroundColor: NETWORK_BGCOLOR[Number(wallet.chainId)]}}>
            <Figure.Image
              width={NETWORK_WIDTH[Number(wallet.chainId)]}
              height={NETWORK_HEIGHT[Number(wallet.chainId)]}
              src={NETWORK_IMAGE[Number(wallet.chainId)]}
              className="ms-3 me-3 mt-3 mb-3"
            />
          </Figure>
          <strong className="mb-auto me-auto mt-auto text-black">{NETWORKS[Number(wallet.chainId)]}</strong>
        </Toast.Header>
        <Toast.Body className='ms-2'><strong className="text-black">Wallet Account: </strong><Link target="_blank" to={`${baseExplorerURL+"/address/"+wallet.accounts[0]}`} style={{textDecoration: 'none'}}>{wallet.accounts[0]}</Link></Toast.Body>
        <Toast.Body className='ms-2'><strong className="text-black">Balance: </strong>{wallet.balance} {NETWORK_SYMBOL[Number(wallet.chainId)]} </Toast.Body>
        <Row xs={2} className='ms-2'>
        <Toast.Body><strong className="text-black">ChainId: </strong>{formatChainAsNum(wallet.chainId)}</Toast.Body>
        </Row>
      </Toast>
    </>
  );
}