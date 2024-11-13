const snarkjs = require('snarkjs');

const fs = require("fs");
const crypto = require('crypto');
const { execSync } = require('child_process');
const path = require('path')

// Function to hash the string using SHA-256 and convert it to a BigInt-compatible format
function hashStringToBigInt(input) {
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    return BigInt('0x' + hash).toString();
}

// Function to run shell commands
function runCommand(command) {
    try {
        console.log(`Executing: ${command}`);
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Error executing command: ${command}`, error);
    }
}

// Step 1: Compile Circuits and Run Setup
function compileAndSetupCircuits() {
    runCommand('scripts/removeFiles.sh');

    // Compile the circuits
    runCommand('circom circom/CardSetup.circom --r1cs --wasm --sym');
    runCommand('circom circom/CardVerification.circom --r1cs --wasm --sym');
    
    // generate witness.wtns
    runCommand("node CardSetup_js/generate_witness.js CardSetup_js/CardSetup.wasm json/CardSetup/input.json witness/cardSetup/witness.wtns");
    runCommand("node CardVerification_js/generate_witness.js CardVerification_js/CardVerification.wasm json/CardVerification/input.json witness/cardVerification/witness.wtns");

    // Move compiled files for both setup & verification
    const destinationCardsetup = path.resolve(__dirname, 'compile', 'cardSetup');
    runCommand(`mkdir -p ${destinationCardsetup}`);
    runCommand(`cp CardSetup.r1cs CardSetup.sym ${destinationCardsetup}`);
    runCommand('rm CardSetup.r1cs CardSetup.sym');
    const destinationCardVerification = path.resolve(__dirname, 'compile', 'cardVerification');
    runCommand(`mkdir -p ${destinationCardVerification}`);
    runCommand(`cp CardVerification.r1cs CardVerification.sym ${destinationCardVerification}`);
    runCommand('rm CardVerification.r1cs CardVerification.sym');
    
    // Generated Power of Tau
    runCommand("snarkjs powersoftau new bn128 12 pot/powersOfTau0000.ptau -v");
    runCommand('echo "Setup zkVisa power of tau" | snarkjs powersoftau contribute pot/powersOfTau0000.ptau pot/powersOfTau0001.ptau --name="Setup zkVisa" -v');
    runCommand('snarkjs powersoftau prepare phase2 pot/powersOfTau0001.ptau pot/powersOfTauFinal.ptau -v');

    // Genearting zKey for card setup
    runCommand('snarkjs groth16 setup compile/cardSetup/cardSetup.r1cs pot/powersOfTauFinal.ptau zkey/cardSetup/cardSetup00.zkey');
    runCommand('echo "Setup zkVisa genearting zkey" | snarkjs zkey contribute  zkey/cardSetup/cardSetup00.zkey zkey/cardSetup/cardSetup01.zkey --name="Generating zkey 1st" -v');
    // Genearting zKey for card verification 
    runCommand('snarkjs groth16 setup compile/cardVerification/cardVerification.r1cs pot/powersOfTauFinal.ptau zkey/cardVerification/cardVerification00.zkey');
    runCommand('echo "Setup zkVisa genearting zkey" | snarkjs zkey contribute  zkey/cardVerification/cardVerification00.zkey zkey/cardVerification/cardVerification01.zkey --name="Generating zkey 1st" -v');

    // Export the verification keys
    runCommand('snarkjs zkey export verificationkey zkey/cardSetup/cardSetup01.zkey json/cardSetup/card_setup_verification_key.json');
    runCommand('snarkjs zkey export verificationkey zkey/cardVerification/cardVerification01.zkey json/cardVerification/card_verification_verification_key.json');
}
// Function to run the setup phase and generate PI1, PI2, PI3
async function runSetup() {
    try {
        const salt = "salt1234";
        const cvc = "123";  // Example CVC
        const cn = "1234567890123456"; // Example card number

        const saltHashed = hashStringToBigInt(salt);
        const cvcHashed = hashStringToBigInt(cvc);
        console.log(
            {
                "cardNumber": cn,
                "salt": saltHashed,
                "cvc": cvcHashed
            }
        )
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            {
                "cardNumber": cn,
                "salt": saltHashed,
                "cvc": cvcHashed
            },
            "cardSetup_js/cardSetup.wasm",
            "cardSetup_0000.zkey"
            // "cardSetup.wasm",
            // "cardSetup_0000.zkey"
        );

        console.log("Setup Public Signals (PI2, PI3):", publicSignals);

        // Write outputs to a file for later use in verification
        fs.writeFileSync("setup_publicSignals.json", JSON.stringify(publicSignals));
        fs.writeFileSync("setup_proof.json", JSON.stringify(proof));
        console.log("Setup public signals saved.");
    } catch (error) {
        console.error("Error in Setup Phase:", error);
    }
}

// Function to run the verification phase using PI1, PI2, PI3
async function runVerification() {
    try {
        // Retrieve expected PI1, PI2, PI3 from setup phase
        const setupPublicSignals = JSON.parse(fs.readFileSync("setup_publicSignals.json"));
        const expected_PI2 = setupPublicSignals[0];
        const expected_PI3 = setupPublicSignals[1];
        // const expected_PI1 = setupPublicSignals[0];
        // const expected_PI2 = setupPublicSignals[1];
        // const expected_PI3 = setupPublicSignals[2];
        const salt = "salt1234";
        const cvc = "123";  // Example CVC
        const cn = "1234567890123456"; // Example card number

        const saltHashed = hashStringToBigInt(salt);
        const cvcHashed = hashStringToBigInt(cvc);
        const txHashed = hashStringToBigInt("order-001-amount-100");
        const nonceHashed = hashStringToBigInt("unique-nonce-value");

        // Use PI1 from setup phase to simulate expected_PIB generation
        // const expected_PIB = hashStringToBigInt(`${expected_PI1}${txHashed}${nonceHashed}`);
        console.log(
            {
                "cardNumber": cn,
                // "pi1": expected_PI1,
                "pi2": expected_PI2,
                "pi3": expected_PI3,
                "cvc": cvcHashed,
                "salt": saltHashed,
                "transaction": txHashed,
                "nonce": nonceHashed,
            }
        )
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            {
                "cardNumber": cn,
                // "pi1": expected_PI1,
                "pi2": expected_PI2,
                "pi3": expected_PI3,
                "cvc": cvcHashed,
                "salt": saltHashed,
                "transaction": txHashed,
                "nonce": nonceHashed,
            },
            "cardVerification_js/cardVerification.wasm",
            "cardVerification_0000.zkey"
        );

        console.log("Verification Public Signals:", publicSignals);

        // Write outputs to a file for verification check
        fs.writeFileSync("verification_proof.json", JSON.stringify(proof));
        fs.writeFileSync("verification_publicSignals.json", JSON.stringify(publicSignals));
        console.log("Verification proof and public signals saved.");
    } catch (error) {
        console.error("Error in Verification Phase:", error);
    }
}

async function main() {
    console.log("Running Compile and Setup Circuit:");
    await compileAndSetupCircuits();

    // console.log("Running Setup Phase:");
    // await runSetup();

    // console.log("Running Verification Phase:");
    // await runVerification();
}

main().then(() => {
    process.exit(0);
});
