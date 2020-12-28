import { generateKeyPairSync } from 'crypto';
import { parseKey } from 'sshpk'
import * as fs from 'fs';
import * as path from 'path';


const sshKeysDir = path.join(__dirname, 'protected', 'sshKeys')
const privateKeyFile = path.join(sshKeysDir, 'privateKey.pem')
const publicKeyFile = path.join(sshKeysDir, 'publicKey.pem')
fs.mkdirSync(path.join(__dirname, 'protected', 'sshKeys'), { recursive: true});

function getKeyPair() {
  const { publicKey, privateKey} = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      format: 'pem',
      type: 'pkcs1'
    },
    privateKeyEncoding: {
      format: 'pem',
      type: 'pkcs1'
    }
  });
  return {publicKey, privateKey}
};

let sshPrivateKey = '';
let sshPublicKey = '';
if (fs.existsSync(privateKeyFile) && fs.existsSync(publicKeyFile)) {
  sshPrivateKey = fs.readFileSync(privateKeyFile).toString()
  sshPublicKey = fs.readFileSync(publicKeyFile).toString()
} else {
  let {publicKey, privateKey} = getKeyPair();
  sshPublicKey = parseKey(publicKey, 'pem').toString('ssh');
  sshPrivateKey = privateKey;
  fs.writeFileSync(privateKeyFile, sshPrivateKey);
  fs.writeFileSync(publicKeyFile, sshPublicKey)
}

export {sshPublicKey, sshPrivateKey};
