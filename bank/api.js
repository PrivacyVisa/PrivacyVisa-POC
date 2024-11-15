const express = require('express');

const fs = require('fs');
const { execSync } = require('child_process');
const circomlibjs = require("circomlibjs");
const crypto = require('crypto');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
const PORT = 4000;

// interface in api backend 
// mock response interface {message : "" , payload ""}
const ITransactionStatus = {
    Unknown: 0,
    Pending: 1,
    Rejected: 2,
    Approved: 3
};

// mock card with the balance 
let cardsDataBase = [
    {
        // user account
        card_number: '1234567890123456',
        balance: 1000,
    },
    {
        // shop account
        card_number: '1234567890123457',
        balance: 0
    }
];

let cardAndProof = [];

// hash the number using SHA-256 and convert it to a BigInt-compatible format
function hashNumberToBigInt(input) {
    const hash = crypto.createHash('sha256').
        update(input.toString()).digest('hex');
    return BigInt('0x' + hash).toString();
}

// // Endpoint to receive TX request from shop and generate nonce
// app.get('/generate-nonce/:pi3', (req, res) => {
//     // const nonce = generateNonce();
//     // res.status(200).json({ nonce: nonce });
//     const { pi3 } = req.params;
//     // find nonce of the card
//     const card = cards.find(c => c.pi3 === pi3);
//     console.log("card:", card);
//     const cardBalance = cardsBalances.find(c => c.card_number === card.card_number);
//     if (!cardBalance) {
//         console.log("Card not found");
//         res.status(400).json({ message: 'Card not found' });
//         return;
//     }
//     const nonceHashed = hashNumberToBigInt(cardBalance.nonce);
//     res.status(200).json({ nonce: nonceHashed });
//     return;
// });

// 1. endpoint to send cardSetup.wasm and cardSetup_0000.zkey to the user
app.get('/user/request/card-setup', (req, res) => {
    res.zip([
        { path: './cardSetup_0000.zkey', name: 'cardSetup_0000.zkey' },
        { path: './cardSetup_js/cardSetup.wasm', name: 'cardSetup.wasm' }
    ]);
});

// 2. Endpoint to user send proof and verify the setup proof from PrivacyVisa and keep in bank backend 
app.post('/store-setup', async (req, res) => {
    const { proof, public_output, _card_number } = req.body;
    // check that the card number is not already stored
    if (cardAndProof.find(card => card.card_number === _card_number)) {
        console.log("Card already stored");
        res.status(400).json({ message: 'Card already stored', payload : "" });
        return;
    }
    try {
        const verificationKey = JSON.parse(fs.readFileSync("cardSetup_verification_key.json"));
        // Verify proof 
        const isValid = await snarkjs.groth16.verify(verificationKey, public_output, proof);
        if (isValid) {
            console.log("Setup proof verification successful");
            cardAndProof.push({ card_number: _card_number, pi3: public_output[1] });
            res.status(200).json({ message: 'Proof verified and setup data stored' , payload : "" });
        } else {
            console.log("Setup proof verification failed");
            res.status(400).json({ message: 'Invalid proof', payload : "" });
        }
    } catch (error) {
        console.error("Error during setup verification:", error);
        res.status(500).json({ message: 'Error during setup verification', payload : error.toString() });
    }
});

// 3. Endpoint to create a transaction order from shop initialize onchain
app.post('/create-transaction', async (req, res) => {
    const { transaction_hashed , amount , check_pi3} = req.body;
    // check that the user's card number is stored in cards offchain
    const certain_card = cardAndProof.find(card => card.pi3 === check_pi3);
    if (!certain_card) {
        console.log("Card not found");
        res.status(400).json({ message: 'Card not found' , payload : ""});
        return;
    }

    const callData = {
        pi3: certain_card.pi3,
        transaction: transaction_hashed,
        amount: amount
    };
    // Send callData intialize onchain with verifier router contract 

    console.log("Transaction order created:", transaction_hashed);
    res.status(200).json({ message: 'Transaction order created onchain', payload: callData.transaction_hashed });
    return;
    // revert 
    // res.status(400).json({ message: 'Failed to create transaction order onchain', payload: callData.transaction_hashed });
});

// 4. Endpoint to send cardVerification.wasm and cardVerification_0000.zkey to the user for generating verify proof 
app.get('/user/request/card-verification', (req, res) => {
    res.zip([
        { path: './cardVerification_0000.zkey', name: 'cardVerification_0000.zkey' },
        { path: './cardVerification_js/cardVerification.wasm', name: 'cardVerification.wasm' }
    ]);
});


// 5. Endpoint to check the transaction status
app.get('/shop/check-transaction/:transaction_hashed', async (req, res) => {
    const { transaction_hashed } = req.params;
    // Querry transaction_hashed onchain and check is valid & onchain
    // ongetStatusByTransactionHashed()
    // interface on chain ITransactionStatus = {
    //     Unknown: 0,
    //     Pending: 1,
    //     Rejected: 2,
    //     Approved: 3
    // };
    const transaction_status = 3; 
    switch (transaction_status) {
        case ITransactionStatus.Unknown:
            res.status(400).json({ message: 'Transaction order does not exist', payload: "" });
            console.log("Transaction status is Unknown.");
            break;
        case ITransactionStatus.Pending:
            res.status(400).json({ message: 'Transaction order waiting proof from user', payload: "" });
            console.log("Transaction is Pending. Please wait for approval.");
            break;
        case ITransactionStatus.Rejected:
            res.status(400).json({ message: 'Transaction failed. Invalid Proof from user', payload: "" });
            console.log("Transaction has been Rejected. Please check details.");
            break;
        case ITransactionStatus.Approved:
            res.status(200).json({ message: 'Tranaction succeed. Proof from user is valid', payload: "" });
            console.log("Transaction has been Approved!");
            break;
        default:
            console.log("Invalid transaction status.");
            break;
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Bank server is running on port ${PORT}`);
});