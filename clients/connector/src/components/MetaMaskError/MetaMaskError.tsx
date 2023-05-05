import { useMetaMask } from '@/hooks/useMetaMask'
import { Alert } from 'react-bootstrap'
// import styles from './MetaMaskError.module.css'

export const MetaMaskError = () => {
  const { error, errorMessage, clearError } = useMetaMask()
  return (
    <>
    {
      error 
        &&
      <Alert key='danger' variant='danger' onClick={() => { clearError() }}>
        <strong>Error:</strong> { errorMessage }
      </Alert>
    }
    </>
  )
}