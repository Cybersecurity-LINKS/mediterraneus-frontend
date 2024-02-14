// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { useError } from '@/hooks/useError'
import { Alert } from 'react-bootstrap'

export const Error = () => {
  const { error, errorMessage, clearError } = useError()
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