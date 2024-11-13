#!/bin/bash

# Remove generated witness files
rm -f witness/cardSetup/witness.wtns
rm -f witness/cardVerification/witness.wtns

# Remove compiled circuit files
rm -f CardSetup.r1cs CardSetup.sym
rm -f CardVerification.r1cs CardVerification.sym

# Remove files in compile directories
rm -rf compile/cardSetup
rm -rf compile/cardVerification

# Remove Power of Tau files
rm -f pot/powersOfTau0000.ptau pot/powersOfTau0001.ptau pot/powersOfTauFinal.ptau

# Remove zKey files
rm -rf zkey/cardSetup/*
rm -rf zkey/cardVerification/*

# Remove exported verification keys
rm -f json/CardSetup/card_setup_verification_key.json
rm -f json/CardVerification/card_verification_verification_key.json

# Additional cleanup if needed
rm -f cardSetup_proof.json cardSetup_public.json
rm -f cardVerification_proof.json cardVerification_public.json

echo "All generated files and directories have been removed."