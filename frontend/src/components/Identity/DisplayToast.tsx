import { useIdentity } from '@/hooks/useIdentity'
import { formatDid } from '@/utils';
import { Figure, Toast } from 'react-bootstrap'
import { Link } from 'react-router-dom';

export const IdentityToast = () => {

  const { did, didDoc, vc } = useIdentity()

  return (
    <>
      <Toast className='mt-3 ms-5'>
        <Toast.Header closeButton={false}>
          <Figure className='rounded mt-3'>
            <Figure.Image
              width={80}
              height={50}
              src="../images/fingerprint-seeklogo.com-3.svg"
            />
          </Figure>
          <strong className="mb-auto me-auto mt-auto text-black">User Identity</strong>
        </Toast.Header>
        {
            did == undefined && didDoc == undefined ? 
              <Toast.Body className='ms-2'>
                <strong className="text-black"><Link style={{color: 'red', textDecoration: 'none'}} to="/identity">Please create your Identity</Link>  </strong>
              </Toast.Body>
            :
            <>
              <Toast.Body className='ms-2'><strong className="text-black">Decentralized IDentifier </strong>
                <Link target="_blank" to={`https://explorer.shimmer.network/testnet/identity-resolver/${did?.toString()}`} style={{ textDecoration: 'none' }}>{formatDid(did?.toString())}</Link>
              </Toast.Body>
              <Toast.Body className='ms-2'> 
                <Link style={{textDecoration: 'none'}} to="/identity">
                  {vc == undefined ? "Please request a new Verifiable Credential" : "DID Document and Verifiable Credential"}        
                </Link>                  
              </Toast.Body>
            </>
        }
        
      </Toast>
    </>
  );
}