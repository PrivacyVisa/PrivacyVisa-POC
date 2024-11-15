// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IBankVerifierRouter {
    // Verify proof call to verifiers contract
    function verifyTransaction(
        string memory _transactionHashed,
        uint[2] calldata p_a,
        uint[2][2] calldata p_b,
        uint[2] calldata p_c,
        uint[2] calldata pub_output
    ) external returns (bool);

    // Bank initialize transaction hashed prepare for receiving verified proof from user
    function addTransactionHashedInfo(
        string memory _transactionHashed,
        uint _amount
    ) external;

    // Getting nonce for each wallet address used to generate proof
    function getNounce() external view returns (uint _nounce);

    // Checking if a transaction hash is valid
    function checkTransactionValid(
        string memory _transactionHashed
    ) external view returns (EStatus);

    // Getting transactions for the sender's wallet
    function getTransactionHashed() external view returns (string[] memory);

    // Getting transactions for a specific wallet address
    function getTransactionHashed(
        address walletAddress
    ) external view returns (string[] memory);

    // Overridden renounceOwnership
    function renounceOwnership() external view;

    // Overridden transferOwnership
    function transferOwnership(address newOwner) external view;

    // Public getters for state variables
    function verifier() external view returns (ICardVerifier);

    function transactionHashedToDetails(
        string memory _transactionHashed
    ) external view returns (uint amount, EStatus status);

    function walletToTransactionHashed(
        address walletAddress
    ) external view returns (string[] memory);
}