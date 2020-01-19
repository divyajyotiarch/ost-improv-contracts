'use strict';

const config = require('./test_lib/config');
const utils = require('./test_lib/utils');
const { Event } = require('./test_lib/event_decoder');
const { AccountProvider } = require('./test_lib/utils.js');
const MockContract = artifacts.require("./MockContract.sol");
const OptimalWalletCreator = artifacts.require('OptimalWalletCreator');

const UtilityBrandedToken = artifacts.require('UtilityBrandedToken');
const EIP20TokenMock = artifacts.require('EIP20TokenMock');
const UserWalletFactory = artifacts.require('UserWalletFactory');


contract('OptimalWalletCreator::constructor', async(accounts) => {
   
    let ubtContract;
    let ubtContractAddr;
    let walletFactoryContractAddr;
    let walletFactoryContract;
    let organizationAddr;
    let accountProvider;
    let mock;

    let brandedToken;

    const SYMBOL = 'MOCK';
    const NAME = 'Mock Token';
    const { decimals: DECIMALS } = config;
    
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

      });


      contract('Negative Tests', async () => {
        it('Reverts if null address is passed as organizationAddr', async () => {
          await utils.expectRevert(OptimalWalletCreator.new(
            ubtContractAddr,
            walletFactoryContractAddr,
            utils.NULL_ADDRESS,
          ),
          'Organization contract address should not be zero',
          'Organization contract address must not be zero.');
        });

        it('Reverts if null address is passed as ubtContractAddr', async () => {
          
          await mock.givenAnyReturnBool(true);
          
          await utils.expectRevert(OptimalWalletCreator.new(
            utils.NULL_ADDRESS,
            walletFactoryContractAddr,
            organizationAddr,
          ),
          'Utility Brand Token contract address should not be zero'+ walletFactoryContractAddr,
          'Utility Brand Token contract address must not be zero.');
        });

        it('Reverts if null address is passed as walletFactoryContractAddr', async () => {
            await utils.expectRevert(OptimalWalletCreator.new(
              ubtContractAddr,
              utils.NULL_ADDRESS,
              organizationAddr,
            ),
            'UserWalletFactory contract address should not be zero',
            'UserWalletFactory contract address must not be zero.');
          });
      });

      contract('Storage', async () => {
        it('Successfully sets state variables', async () => {
            await utils.expectRevert(OptimalWalletCreator.new(
                ubtContractAddr,
                organizationAddr,
                walletFactoryContractAddr,
            ),
            'Error in setting state variables.'
          );
        });
      });
    });