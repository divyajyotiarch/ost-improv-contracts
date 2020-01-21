'use strict';

const Utils = require('./test_lib/utils.js');
const config = require('./test_lib/config');
const web3 = require('./test_lib/web3.js');
const { Event } = require('./test_lib/event_decoder');
const { AccountProvider } = require('./test_lib/utils.js');
const MockContract = artifacts.require("./MockContract.sol");
const OptimalWalletCreator = artifacts.require('OptimalWalletCreator');

const TokenHolder = artifacts.require('TokenHolder');

const TestUtilityBrandedToken = artifacts.require('TestUtilityBrandedToken');
const UtilityBrandedToken = artifacts.require('UtilityBrandedToken');
const EIP20TokenMock = artifacts.require('EIP20TokenMock');
const UserWalletFactory = artifacts.require('UserWalletFactory');
const Organization = artifacts.require('Organization');

contract('OptimalWalletCreator::optimalCall', async (accounts) => {

    
    let ubtContract;
    let ubtContractAddr;
    let walletFactoryContractAddr;
    let walletFactoryContract;
    let organizationAddr;
    let deployerAddress;
    let accountProvider;
    let testUtilityBrandedToken;

    let tokenHolderAddr;

    let owner;
    let admin;
    let worker;
    let workers=[];

    let organization = null;
    let expirationHeight = 0;
    

    let brandedToken;

    const SYMBOL = 'MOCK';
    const NAME = 'Mock Token';
    const { decimals: DECIMALS } = config;
    
    let optimalWalletCreator;
    let mock;
    
    beforeEach(async () => {

      console.log(`Before each entry point`); 
      accountProvider = new Utils.AccountProvider(accounts);

      deployerAddress = accountProvider.get();

      owner = accountProvider.get();
      admin = accountProvider.get();
      worker = accountProvider.get();
      const expirationHeightDelta = 10;
  
      workers = [worker];
  
      console.log(`workers: ${workers}`);

      const currentBlockNumber = await web3.eth.getBlockNumber();
      console.log(`block number: ${currentBlockNumber}`);
      expirationHeight = currentBlockNumber + expirationHeightDelta;

      organization = await Organization.new(
        owner,
        admin,
        workers,
        expirationHeight,
        { from: deployerAddress },
      );
      console.log(`organization: ${organization.address}`);  

      organizationAddr = organization.address;

      
      console.log(`deployer: ${deployerAddress}`);  
      brandedToken = await EIP20TokenMock.new(
        SYMBOL,
        NAME,
        DECIMALS,
        { from: deployerAddress },
      );
      console.log(`brandedToken: ${brandedToken.address}`);  

        testUtilityBrandedToken = await TestUtilityBrandedToken.new(
        brandedToken.address,
        SYMBOL,
        NAME,
        DECIMALS,
        organizationAddr,
        { from: deployerAddress },
      );
      console.log(`TestbrandedToken: ${testUtilityBrandedToken.address}`);  

      walletFactoryContract = await UserWalletFactory.new({ from: deployerAddress });
      console.log(`walletFactoryContract: ${walletFactoryContract.address}`); 
      ubtContract = await UtilityBrandedToken.new(
        brandedToken.address,
        SYMBOL,
        NAME,
        DECIMALS,
        organizationAddr,
        { from: deployerAddress },
      )
      ubtContractAddr = ubtContract.address;
      console.log(`utilitybrandtoken: ${ubtContract.address}`);
      walletFactoryContractAddr = walletFactoryContract.address;
      mock = await MockContract.new();

      optimalWalletCreator = await OptimalWalletCreator.new(ubtContractAddr,walletFactoryContractAddr,organizationAddr, { from: owner });
      console.log(`optimalWallet: ${optimalWalletCreator.address}`);
      const txresponse = await organization.setWorker(optimalWalletCreator.address, expirationHeight, { from: owner });
      console.log(`tx response of set worker: ${txresponse}`);
      });
  /* 
    //negative test cases similar to the createUserWallet. 
    contract('Negative Tests', async () => {
        it('Reverts if gnosis safe\'s master copy address is null.', async () => {
         
          await mock.givenAnyReturnBool(true);
          await Utils.expectRevert(
            optimalWalletCreator.optimalCall(
              Utils.NULL_ADDRESS, // gnosis safe's master copy
              '0x', // gnosis safe's setup data
              accountProvider.get(), // token holder's master copy
              accountProvider.get(), // token
              accountProvider.get(), // token rules
              [], // session key addresses
              [], // session keys' spending limits
              [], // session keys' expiration heights
              internalActors,
              {from : optimalWalletCreator.address},
            ),
            'Should revert as the master copy address is null.',
            'Master copy address is null.',
          );
        });
    
        it('Reverts if token holder\'s master copy address is null.', async () => {

          await mock.givenAnyReturnBool(true);
         
          await Utils.expectRevert(
            optimalWalletCreator.optimalCall(
              accountProvider.get(), // gnosis safe's master copy
              '0x', // gnosis safe's setup data
              Utils.NULL_ADDRESS, // token holder's master copy
              accountProvider.get(), // token
              accountProvider.get(), // token rules
              [], // session key addresses
              [], // session keys' spending limits
              [], // session keys' expiration heights
              internalActors,
              {from : optimalWalletCreator.address},
            ),
            'Should revert as the master copy address is null.',
            'Master copy address is null.',
          );
        });
      });
*/
      contract('Optimal Create Call', async () => {

  /*      it('Reverts if non-worker address is doing function calls', async () => {

          await mock.givenAnyReturnBool(true);
          const internalActors = [];
          internalActors.push(accountProvider.get());
          const nonWorker = accountProvider.get();
    
          await Utils.expectRevert(
            optimalWalletCreator.optimalCall(
              accountProvider.get(), // gnosis safe's master copy
              '0x', // gnosis safe's setup data
              accountProvider.get(), // token holder's master copy
              accountProvider.get(), // token
              accountProvider.get(), // token rules
              [], // session key addresses
              [], // session keys' spending limits
              [], // session keys' expiration heights
              internalActors,
            { from: nonWorker },
          ),
          'Worker should be registered.',
          'Only whitelisted workers are allowed to call this method.');
        });
*/
       
       
          it('Worker address is doing function calls', async () => {
            const txresponse1 = await organization.isWorker(worker);
            console.log(`tx response  is worker: ${txresponse1}`);
            const txresponse2 = await organization.isWorker(optimalWalletCreator.address);
            console.log(`optimalContract is worker: ${txresponse2}`);
            // TODO check contract isWorker
            // transfer gas
            console.log('deployer balance:', await web3.eth.getBalance(deployerAddress));
            console.log('optimalWallet balance:', await web3.eth.getBalance(optimalWalletCreator.address));

            const receipt = await web3.eth.sendTransaction({from: deployerAddress, to: optimalWalletCreator.address, value: '100000000'});
            console.log(`receipt:`, receipt);
            console.log('optimalWallet balance:', await web3.eth.getBalance(optimalWalletCreator.address));
      
              const txresponse = await optimalWalletCreator.optimalCall(
                accountProvider.get(), // gnosis safe's master copy
                '0x', // gnosis safe's setup data
                accountProvider.get(), // token holder's master copy
                accountProvider.get(), // token
                accountProvider.get(), // token rules
                [], // session key addresses
                [], // session keys' spending limits
                [], // session keys' expiration heights
                { from: worker },
            );
           
            console.log(`tx Response: ${txresponse}`);

          });
          
      });
});