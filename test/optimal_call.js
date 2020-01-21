'use strict';

const Utils = require('./test_lib/utils.js');
const config = require('./test_lib/config');
const web3 = require('./test_lib/web3.js');
const { Event } = require('./test_lib/event_decoder');

const OptimalWalletCreator = artifacts.require('OptimalWalletCreator');

const TokenHolder = artifacts.require('TokenHolder');

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
    
    beforeEach(async () => {

      accountProvider = new Utils.AccountProvider(accounts);

      deployerAddress = accountProvider.get();

      owner = accountProvider.get();
      admin = accountProvider.get();
      worker = accountProvider.get();
      const expirationHeightDelta = 10;
  
      workers = [worker];

      const currentBlockNumber = await web3.eth.getBlockNumber();
      expirationHeight = currentBlockNumber + expirationHeightDelta;

      organization = await Organization.new(
        owner,
        admin,
        workers,
        expirationHeight,
        { from: deployerAddress },
      );
      organizationAddr = organization.address;
 
      brandedToken = await EIP20TokenMock.new(
        SYMBOL,
        NAME,
        DECIMALS,
        { from: deployerAddress },
      );

      walletFactoryContract = await UserWalletFactory.new({ from: deployerAddress });

      ubtContract = await UtilityBrandedToken.new(
        brandedToken.address,
        SYMBOL,
        NAME,
        DECIMALS,
        organizationAddr,
        { from: deployerAddress },
      )
      ubtContractAddr = ubtContract.address;

      walletFactoryContractAddr = walletFactoryContract.address;

      optimalWalletCreator = await OptimalWalletCreator.new(ubtContractAddr,walletFactoryContractAddr,organizationAddr, { from: owner });

      await organization.setWorker(optimalWalletCreator.address, expirationHeight, { from: owner });

      });
   
    //negative test cases similar to the createUserWallet. 
    contract('Negative Tests', async () => {
        it('Reverts if gnosis safe\'s master copy address is null.', async () => {
         
          await Utils.expectRevert(
            optimalWalletCreator.optimalCall(
              Utils.NULL_ADDRESS, // gnosis safe's master copy
              '0x', // gnosis safe's setup data
              accountProvider.get(), // token holder's master copy
              accountProvider.get(), // token rules
              [], // session key addresses
              [], // session keys' spending limits
              [], // session keys' expiration heights
              {from : worker},
            ),
            'Should revert as the master copy address is null.',
            'Master copy address is null.',
          );
        });
    
        it('Reverts if token holder\'s master copy address is null.', async () => {
         
          await Utils.expectRevert(
            optimalWalletCreator.optimalCall(
              accountProvider.get(), // gnosis safe's master copy
              '0x', // gnosis safe's setup data
              Utils.NULL_ADDRESS, // token holder's master copy
              accountProvider.get(), // token rules
              [], // session key addresses
              [], // session keys' spending limits
              [], // session keys' expiration heights
              {from : worker},
            ),
            'Should revert as the master copy address is null.',
            'Master copy address is null.',
          );
        });
      });

      contract('Optimal Create Call', async () => {

        it('Reverts if non-worker address is doing function calls', async () => {

          const internalActors = [];
          internalActors.push(accountProvider.get());
          const nonWorker = accountProvider.get();
    
          await Utils.expectRevert(
            optimalWalletCreator.optimalCall(
              accountProvider.get(), // gnosis safe's master copy
              '0x', // gnosis safe's setup data
              accountProvider.get(), // token holder's master copy
              accountProvider.get(), // token rules
              [], // session key addresses
              [], // session keys' spending limits
              [], // session keys' expiration heights
            { from: nonWorker },
          ),
          'Worker should be registered.',
          'Only whitelisted workers are allowed to call this method.');
        });
       
        it('Worker address is doing function calls', async () => {
          
          const gnosisSafeMasterCopy = accountProvider.get();
          const tokenHolderMasterCopy = accountProvider.get();

          const returnData = await optimalWalletCreator.optimalCall.call(
            gnosisSafeMasterCopy, // gnosis safe's master copy
            '0x', // gnosis safe's setup data
            tokenHolderMasterCopy, // token holder's master copy
            accountProvider.get(), // token rules
            [], // session key addresses
            [], // session keys' spending limits
            [], // session keys' expiration heights
            { from: worker },
          );

          const transactionResponse = await optimalWalletCreator.optimalCall(
            gnosisSafeMasterCopy, // gnosis safe's master copy
            '0x', // gnosis safe's setup data
            tokenHolderMasterCopy, // token holder's master copy
            accountProvider.get(), // token rules
            [], // session key addresses
            [], // session keys' spending limits
            [], // session keys' expiration heights
            { from: worker },
          );

          assert.strictEqual(
            await organization.isWorker(worker),
            true
          )

          assert.strictEqual(
            await organization.isWorker(optimalWalletCreator.address),
            true
          );

          assert.strictEqual(
            await ubtContract.exists.call(returnData[1]),
            true
          );

          // const events = Event.decodeTransactionResponse(
          //   transactionResponse,
          // );
          //console.log('transactionResponse', JSON.stringify(transactionResponse, null, 2));

        });
          
      });
});