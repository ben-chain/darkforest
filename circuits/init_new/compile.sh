#!/bin/bash
echo "clearing files to rebuild"
rm circuit.json
rm proving_key.json
rm proving_key.bin
rm verification_key.json
rm proof.json
rm public.json
rm verifier.sol
rm witness.json
rm witness.bin
echo "compiling circuit to snarkjs..." &&
date &&
circom circuit.circom &&
rm -rf ../../client/src/circuits/init_new/ &&
mkdir -p ../../client/src/circuits/init_new/ &&
cp circuit.json ../../client/src/circuits/init_new/ &&
echo "generating prover and verification keys..." &&
date &&
snarkjs setup --protocol groth &&
echo "calculating witness..." &&
date &&
snarkjs calculatewitness &&
echo "generating proof..." &&
date &&
snarkjs proof &&
echo "verifying proof..." &&
date &&
snarkjs verify &&
echo "compiling smart contract..." &&
date &&
snarkjs generateverifier &&
echo "creating witness binary..." &&
node ../../client/node_modules/websnark/tools/buildwitness.js &&
echo "creating proving key binary..." &&
rm ../../client/public/proving_key_init_new.bin
node ../../client/node_modules/websnark/tools/buildpkey.js &&
cp ./proving_key.bin ../../client/public/proving_key_init_new.bin &&
echo "done!" &&
date
