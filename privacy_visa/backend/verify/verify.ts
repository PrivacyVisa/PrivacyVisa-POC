import { ethers } from "ethers" ;
import * as dotenv from "dotenv";
import abi from "./abi.json"
import { data } from "./card_verification.json"

type Bytes32 = string;

async function verify(
    contractAddress : string,
    pA: any,
    pB: any,
    pC: any,
    pubSignals: any
){
    dotenv.config();
    const provider = new ethers.JsonRpcProvider(process.env.JSON_RPC_PROVIDER);
    const walletPrivateKey = process.env.WALLET_PRIVATE_KEY;
    if (!walletPrivateKey) {
        throw new Error("WALLET_PRIVATE_KEY is not defined in the environment variables.");
    }

    const wallet = new ethers.Wallet(walletPrivateKey,provider);
    const contract = new ethers.Contract(contractAddress, abi , wallet);
    const tx = await contract.verifyProof(pA,pB,pC,pubSignals) ;
    console.log(tx);
}

const pa = data[0]
const pb = data[1]
const pc = data[2]
const publicSig = data[3]
console.log("pa : ",pa)
console.log("pb : ",pb)
console.log("pc : ",pc)
console.log("publicsig : ",publicSig)

verify("0x75614c6E00fB4E7C2d7e84eB14f711C7351f058a",data[0],data[1],data[2],data[3]).catch((error)=>{
    console.log("Verify contract call error at : ",error)
});