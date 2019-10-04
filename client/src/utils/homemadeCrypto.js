// import bigInt from "big-integer";
import { keccak256 } from "js-sha3";
import { Buffer } from "buffer";
const bigInt = require('big-integer');

const PARALLELS = 10;

function bigExponentiate(base, exp, modulus) {
    // base: BigInt
    // exp: int
    // modulus: BigInt
    if (exp === 0) {
        return bigInt(1);
    } else if (exp === 1) {
        return base.mod(modulus);
    } else if (exp % 2 === 0) {
        const half = bigExponentiate(base, exp/2, modulus);
        return half.multiply(half).mod(modulus);
    } else {
        const half = bigExponentiate(base, Math.floor(exp/2), modulus);
        return half.multiply(half).multiply(base).mod(modulus);
    }
}

function positiveIntArrToString (arr){
    let repr = "[";
    for (let i=0; i<arr.length; i++) {
        repr += ` ${arr[i]},`
    }
    repr += "]";
    return repr;
}

function randomBitsFromPositiveIntArr (arr) {
    const repr = positiveIntArrToString(arr);
    const hashBuf = Buffer.from(keccak256(repr), 'hex');
    let bits = []
    for (let i=0; i<hashBuf.length; i++) {
        let elt = hashBuf.readUInt8(i);
        for (let bit=0; bit<8; bit++) {
            bits.push(!! ((elt >> bit) & 0x01));
        }
    }
    return bits;
}

function dLogProof(x, g, p) {
    // x: int, in [p-1]
    // g: int, generator mod p
    // p: int, prime
    // return: [array[int], array[int]], each of length PARALLELS
    // ZK proof of knowledge of x such that g^x = y mod p
    let r = [];
    for (let i=0; i<PARALLELS; i++) {
        r.push(Math.floor(Math.random()*(p-1)));
    }
    const gBig = bigInt(g);
    const pBig = bigInt(p);
    let t = r.map(ri => bigExponentiate(gBig, ri, pBig).toJSNumber());
    let b = randomBitsFromPositiveIntArr(t);
    let s = [];
    for (let i=0; i<PARALLELS; i++) {
        s.push(b[i] ? r[i]+x : r[i]);
    }
    return [t,s];
}

function verifyDlogProof(y, g, p, proof) {
    // y: int, in [p]*
    // g: int, generator mod p
    // p: int, prime
    // proof: [array[int],array[int]] of length PARALLELS
    // Verify ZK proof (t,s) of knowledge x such that g^x = y mod p
    const t = proof[0];
    const s = proof[1];
    const b = randomBitsFromPositiveIntArr(t);
    const gBig = bigInt(g);
    const yBig = bigInt(y);
    const pBig = bigInt(p);
    const oneBig = bigInt(1);
    for (let i=0; i<PARALLELS; i++) {
        const lhs = bigExponentiate(gBig, s[i], pBig);
        const rhs = ((b[i] ? yBig : oneBig).multiply(bigInt(t[i]))).mod(pBig);
        if (lhs.neq(rhs)) {
            return false;
        }
    }
    return true;
}

function testOneDimension() {
    const p=31;
    const g=3;
    const x=17;
    const y=22;
    // Let's prove we know x such that g^x = y mod p
    const proof = dLogProof(x, g, p);
    const goodResult = verifyDlogProof(y, g, p, proof);
    console.log('This should be true: ' + goodResult);
    const badResult = verifyDlogProof(23, g, p, proof);
    console.log('This should be false: ' + badResult);
}

const twoDimDLogProof = (x, y, g, h, p, q) => {
    // x: int, in [p-1]
    // y: int, in [q-1]
    // g: int, generator mod p and 1 mod q
    // h: int, generator mod q and 1 mod p
    // p: int, prime
    // q: int, prime
    // return: [array[int], array[int], array[int], array[int]], each of length PARALLELS
    // ZK proofs of knowledge of x, y such that g^xh^y = z mod pq
    const proof1 = dLogProof(x, g%p, p);
    const proof2 = dLogProof(y, h%q, q);
    return [proof1, proof2]
}

const verifyTwoDimDLogProof = (z, g, h, p, q, proofs) => {
    // z: int, in [pq]*
    // g: int, generator mod p and 1 mod q
    // h: int, generator mod q and 1 mod p
    // p: int, prime
    // q: int, prime
    // Verify ZK proofs of knowledge of x, y such that g^xh^y = z
    return verifyDlogProof(z%p, g, p, proofs[0]) && verifyDlogProof(z%q, h, q, proofs[1]);
}

const testTwoDimension = () => {
    const p = 23;
    const q = 31;
    const g = 559; // 7 mod 23, 1 mod 31
    const h = 323; // 1 mod 23, 13 mod 31
    const x = 15;
    const y = 17;
    const z = 451;
    // Let's prove we know x,y such that g^xh^y = z mod pq
    const proofs = twoDimDLogProof(x, y, g, h, p, q);
    const goodResult = verifyTwoDimDLogProof(z, g, h, p, q, proofs);
    console.log('This should be true: ' + goodResult);
    const badResult = verifyTwoDimDLogProof(163, g, h, p, q, proofs);
    console.log('This should be false: ' + badResult);
}

export { bigExponentiate, twoDimDLogProof, verifyTwoDimDLogProof };
