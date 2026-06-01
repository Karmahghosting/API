 
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Crypto } from '@peculiar/webcrypto';
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
if (!globalThis.crypto) {
  globalThis.crypto = new Crypto();
}

export function getRegistrationOptions(user: any) {
  console.log('Generating registration options for user:', user);
  return generateRegistrationOptions({
    rpName: 'Croissant',
    rpID: 'croissant-api.fr',
    userID: user.id,
    userName: user.username,
    attestationType: 'none',
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
  });
}

export async function verifyRegistration(body: any, expectedChallenge: string) {
  return verifyRegistrationResponse({
    response: body.credential,
    expectedChallenge,
    expectedOrigin: 'https://croissant-api.fr',
    expectedRPID: 'croissant-api.fr',
  });
}

export function getAuthenticationOptions(credentials: any[]) {
  return generateAuthenticationOptions({
    rpID: 'croissant-api.fr',
    userVerification: 'preferred',
    allowCredentials: credentials
      .filter(c => c.id)
      .map(c => ({
        id: c.id,
        transports: c.transports,
      })),
  });
}

export async function verifyAuthentication(body: any, expectedChallenge: string, credentials: any[]) {
  const authenticator = credentials.find(c => c.id === body.credential.id);
  if (!authenticator || !authenticator.publicKey) {
    throw new Error('Authenticator not found');
  }
  return verifyAuthenticationResponse({
    response: body.credential,
    expectedChallenge,
    expectedOrigin: 'https://croissant-api.fr',
    expectedRPID: 'croissant-api.fr',
    credential: {
      id: authenticator.id,
      publicKey: new Uint8Array(Buffer.from(authenticator.publicKey, 'base64url')),
      counter: authenticator.counter ?? 0,
      transports: authenticator.transports,
    },
  });
}
