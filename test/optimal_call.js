'use strict';

const Utils = require('./test_lib/utils.js');
const web3 = require('./test_lib/web3.js');
const { Event } = require('./test_lib/event_decoder');
const { AccountProvider } = require('./test_lib/utils.js');
const MockContract = artifacts.require("./MockContract.sol");
const OptimalWalletCreator = artifacts.require('OptimalWalletCreator');

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

    let brandedToken;

    const SYMBOL = 'MOCK';
    const NAME = 'Mock Token';
    const { decimals: DECIMALS } = config;
    

    let internalActors = [];
    let optimalWalletCreator;
    let mock;

    const owner = accountProvider.get();
    const admin = accountProvider.get();
    const worker = accountProvider.get();
    const expirationHeightDelta = 10;

    let organization = null;
    let expirationHeight = 0;

    const workers = [];

    organization = await Organization.new(
      owner,
      admin,
      workers,
      expirationHeight,
    );

    const currentBlockNumber = await web3.eth.getBlockNumber();
    expirationHeight = currentBlockNumber + expirationHeightDelta;
    
    beforeEach(async () => {
        
        accountProvider = new utils.AccountProvider(accounts);

        organizationAddr = accountProvider.get();

        brandedToken = await EIP20TokenMock.new(
          SYMBOL,
          NAME,
          DECIMALS,
          { from: organizationAddr },
        );
          
        walletFactoryContract = await UserWalletFactory.new();

        ubtContract = UtilityBrandedToken.new(
          brandedToken.address,
          SYMBOL,
          NAME,
          DECIMALS,
          utils.NULL_ADDRESS,
          { from: organizationAddr },
        )
        ubtContractAddr = ubtContract.address;
        walletFactoryContractAddr = walletFactoryContract.address;
        mock = await MockContract.new();

        optimalWalletCreator = await OptimalWalletCreator.new(ubtContractAddr,walletFactoryContractAddr,organizationAddr);

        organization.setWorker(optimalWalletCreator.address, expirationHeight, { from: owner });
        
      });
   
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

      contract('Optimal Create Call', async () => {
          it('Reverts if non-worker address is doing function calls', async () => {

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
      });
});