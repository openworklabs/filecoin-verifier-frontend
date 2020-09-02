import React, { useState } from 'react'
import axios from 'axios'
import styled from 'styled-components'
import { validateAddressString } from '@openworklabs/filecoin-address'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import {
  Box,
  Button,
  Card,
  Text,
  Input,
  InputLabelBase,
  Label,
  StepHeader
} from './Shared'
import reportError from '../utils/reportError'

dayjs.extend(relativeTime)

const Form = styled.form`
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-grow: 1;
`

export default () => {
  const [filAddress, setFilAddress] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [remainingBytes, setRemainingBytes] = useState(null)
  const [mostRecentAllocation, setMostRecentAllocation] = useState('')
  const onSubmit = async (e) => {
    e.preventDefault()
    const isValid = validateAddressString(filAddress)
    if (isValid) {
      setLoading(true)
      try {
        const res = await axios.get(
          `${process.env.VERIFIER_URL}/account-remaining-bytes/${filAddress}`
        )
        if (res.status !== 200) {
          setErr(res.statusText)
          reportError(
            'components/CheckVerifiedStorageAmount.jsx:1',
            false,
            res.statusText
          )
        } else {
          setRemainingBytes(res.data.remainingBytes)
          setMostRecentAllocation(res.data.mostRecentAllocation)
        }
      } catch (err) {
        setErr(err.response.data.error)
        reportError(
          'components/CheckVerifiedStorageAmount.jsx:2',
          false,
          err.response.data.error,
          err.message,
          err.stack
        )
      }
    } else {
      setErr('Invalid Filecoin address.')
    }
    setLoading(false)
  }

  const calcNextAllocationTime = () => {
    if (dayjs(mostRecentAllocation).isBefore(dayjs())) {
      return 'now'
    }
    return dayjs().to(dayjs(mostRecentAllocation).add(30, 'day'))
  }

  return (
    <Box
      display='flex'
      flexDirection='column'
      p={3}
      mt={5}
      minHeight={10}
      width='100%'
      maxWidth={13}
      alignItems='center'
      justifyContent='center'
    >
      <Box
        display='flex'
        width='100%'
        justifyContent='space-between'
        flexWrap='wrap'
        mb={3}
      >
        <Text
          color='core.nearblack'
          textAlign='center'
          p='0'
          m={0}
          textTransform='uppercase'
        >
          CHECK
        </Text>
        <Text color='core.darkgray' textAlign='left' p='0' m={0}>
          Enter an address to check its status
        </Text>
      </Box>
      <Card
        p={0}
        border={0}
        width='100%'
        maxWidth={13}
        height={7}
        display='flex'
        flexDirection='column'
        justifyContent='space-between'
        boxShadow={2}
      >
        <Box
          display='flex'
          flexDirection='row'
          justifyContent='space-between'
          flexWrap='wrap'
        >
          <Form onSubmit={onSubmit}>
            <Box
              position='relative'
              display='flex'
              flexGrow='1'
              flexWrap='wrap'
              alignItems='center'
            >
              <InputLabelBase display='none' htmlFor='check-fil-address' />
              <Input.Base
                id='check-fil-address'
                width='100%'
                flexShrink='1'
                pr={8}
                overflow='scroll'
                placeholder='t1OwL...'
                value={filAddress}
                onChange={(e) => {
                  setMostRecentAllocation('')
                  setRemainingBytes(null)
                  setErr('')
                  setFilAddress(e.target.value)
                }}
              />
              <Button
                position='absolute'
                right='0'
                type='submit'
                title='Check'
                variant='secondary'
                mx={2}
                px={4}
                disabled={!filAddress}
                bg='transparent'
              />
            </Box>
          </Form>
        </Box>
      </Card>
      <Box pt={0} mx={3} minHeight={4} mt={3}>
        {remainingBytes && !err && (
          <>
            <Text color='core.black'>
              {filAddress} has {remainingBytes} bytes of verified Filecoin
              storage left.
            </Text>
            <Text color='core.black'>
              {filAddress} can renew its verification {calcNextAllocationTime()}
              .
            </Text>
          </>
        )}
        <Label color='status.fail.background' mb={0}>
          {err}
        </Label>
      </Box>
    </Box>
  )
}
