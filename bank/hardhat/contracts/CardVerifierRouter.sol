// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28 ;

import { ICardVerifier } from "./ICardVerifier.sol" ;
import "@openzeppelin/contracts/access/Ownable.sol";

enum EStatus {
    Pending,    
    Rejected,   
    Approved
}

struct ITransactionInfo {
    uint amount ; 
    EStatus status ;
}

contract BankVerifierRouter is Ownable {
    ICardVerifier public immutable verifier;    

    mapping (string => ITransactionInfo) public transactionHashedToDetails;  
    mapping (address => string[]) walletToTransactionHashed; 

    constructor(
        address admin,
        ICardVerifier _verifier
    ) Ownable(admin) {
        verifier = _verifier ;    
    }

    function verifyTransaction(
        string memory _transactionHashed,
        uint[2] calldata p_a,
        uint[2][2] calldata p_b,
        uint[2] calldata p_c,
        uint[2] calldata pub_output
    ) public returns (bool) {
        require(transactionHashedToDetails[_transactionHashed].status !=  Estatus.Approved ,"Transaction already proof" )
        try verifier.verifyProof(p_a, p_b, p_c, pub_output){
            transactionHashedToDetails[transactionHashed].status = Estatus.Approved ;
            walletToTransactionHashed[msg.sender].push(transactionHashed) ; 
            return true ;
        }catch {
            transactionHashedToDetails[transactionHashed].status = Estatus.Rejected ;
            walletToTransactionHashed[msg.sender].push(transactionHashed) ; 
            return false ;
        }
    }   

    function addTransactionHashedInfo(
        string memory _transactionHashed,
        string memory _origin,
        uint _amount
    ) external onlyOwner() {
        transactionHashedToDetails[_transactionHashed] = ITransactionInfo({
            uint amount ; 
            EStatus status ;
        })
    }

    function checkTransactionValid (
        string _transactionHashed
    ) public view returns(Estatus _status){

    }

    function getTransactionHashed () public view returns(string[]){
        return walletToTransactionHashed[msg.sender] ; 
    }
    function getTransactionHashed (address walletAddress ) public view returns(string[]){
        return walletToTransactionHashed[walletAddress] ; 
    }
}