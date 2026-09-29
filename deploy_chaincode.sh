#!/bin/bash
set -e
export PATH=/usr/local/go/bin:$HOME/fabric-samples/bin:$PATH
export FABRIC_CFG_PATH=$HOME/fabric-samples/config/
cd $HOME/fabric-samples/test-network

./network.sh deployCC \
  -ccn basic \
  -ccp /mnt/c/Users/willfaa/Documents/VSCode-Project/blockchain-verifier/chaincode-go \
  -ccl go \
  -c chainnesa \
  -ccep "OR('Org1MSP.peer','Org2MSP.peer')" \
  -cci InitLedger
