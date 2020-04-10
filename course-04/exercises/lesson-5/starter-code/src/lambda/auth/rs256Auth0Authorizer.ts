
import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'


import { verify } from 'jsonwebtoken'
import { JwtToken } from '../../auth/JwtToken'

const cert = `-----BEGIN CERTIFICATE-----
MIIDBzCCAe+gAwIBAgIJFdskvbQDYB4MMA0GCSqGSIb3DQEBCwUAMCExHzAdBgNV
BAMTFmRldi0xMmFodmg2aS5hdXRoMC5jb20wHhcNMTkxMTIzMDI0MTIwWhcNMzMw
ODAxMDI0MTIwWjAhMR8wHQYDVQQDExZkZXYtMTJhaHZoNmkuYXV0aDAuY29tMIIB
IjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA9J3Cyd8/w2RWYWKfhxZATI35
SBJ1kFAEWFQlVfjKi/by4NzE/Lz3ODxJ9EgHP0ta8PFb0f1bvqsYH6t0LpQwK6Vz
p3JyDpPNbnOzbM60tnzvrQT2R7xGBIZwrPTZJ1Ea0WezjP5X0bZDwwOGlVM2+rKn
7N/E7QUViMSEM64P7v4GF+wPIrmRwJ5IYW8uaDEIJlsTN5zkzo67FBOhZH3o/EJe
EmkpVVw3VpRw6Ibg/SeY5NHa27hTfOY7x9DqLUzYy6ZGJlx9mUvCgCF0MQTbtPJa
Vg3F7KVR04nPkxugZFU0d2DBxlZpjj99t82RywO9mrZ4LnrbQoS7f5buhcQnJwID
AQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBQbNBwJrR8wh3kZlIVO
MIQNzQxn8DAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEBAAFPclRX
wLIuPJFLYNEG4WG3mb5diHQt7V/fsQthLMVGDte9SY6wjKg/HoJ5dyMFgVTn6gY4
/2X5Wbr1rcxFEtuP1g8POkXr/nZhObjq2n00+58mK5T6r166xHeSBZkrE2GYPW7A
MWSKFip68j7oJc2V8ylU8J5qKJbkTapNWF0IdP4/nEn0ElyZ7goMhtRm/8Ybx+hE
+7UG1PkNcKyhAsN2bucqxlIM1K7mJnMVUeTfM8E7HEXyQGNTcFK2vaUvZRHH7W4a
RmXkEBnKowX0lvVrwdYKPWKgHg7pzf+FyDaxvej0IpSQy5tpjdAu9eaVleQUli9M
eb6jvoE6BV2NOPY=
-----END CERTIFICATE-----`

export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  try {
    const decodedToken = verifyToken(event.authorizationToken)
    console.log('User was authorized', decodedToken)

    return {
      principalId: decodedToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    console.log('User was not authorized', e.message)

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}


function verifyToken(authHeader: string): JwtToken {
  if (!authHeader)
    throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return verify(token, cert, { algorithms: ['RS256'] }) as JwtToken
}
