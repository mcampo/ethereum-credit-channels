import React, { Component } from 'react'
import getWeb3 from './utils/getWeb3'
import creditChannels from './truffle/build/contracts/CreditChannels.json'
import AccountSelector from './AccountSelector'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      accounts: [],
      providerAccount: null,
      consumerAccount: null,
      contract: null
    }
  }

  async componentDidMount() {
    const web3 = await getWeb3()
    const accounts = (await web3.eth.getAccounts()).map(address => ({ address }))
    const providerAccount = accounts[0] // first account
    const consumerAccount = accounts[accounts.length - 1] // last account
    await this.refreshAccount(providerAccount)
    await this.refreshAccount(consumerAccount)
    this.setState({ accounts, providerAccount, consumerAccount })
  }

  refreshAccount = async (account) => {
    const { contract } = this.state
    const web3 = await getWeb3()
    const balance = web3.utils.fromWei(await web3.eth.getBalance(account.address))
    account.balance = balance

    if (contract) {
      const hasChannelOpen = await contract.methods.hasChannelOpen().call({ from: account.address })
      account.hasChannelOpen = hasChannelOpen

      if (hasChannelOpen) {
        const credits = await contract.methods.getCredits().call({ from: account.address })
        account.credits = credits
      }
    }
    return account
  }

  onProviderAccountChange = async ({ selectedAccount }) => {
    await this.refreshAccount(selectedAccount)
    this.setState({ providerAccount: selectedAccount })
  }

  onConsumerAccountChange = async ({ selectedAccount }) => {
    await this.refreshAccount(selectedAccount)
    this.setState({ consumerAccount: selectedAccount })
  }

  onDeployContract = async () => {
    const { providerAccount } = this.state
    const web3 = await getWeb3()
    const contract = new web3.eth.Contract(creditChannels.abi)
    const deployedContract = await contract.deploy({
      data: creditChannels.bytecode,
      arguments: [providerAccount.address]
    }).send({
      from: providerAccount.address,
      gas: 1500000,
      gasPrice: 1
    })
    const updatedAccount = await this.refreshAccount({ ...providerAccount })
    deployedContract.setProvider(contract.currentProvider)
    this.setState({ contract: deployedContract, providerAccount: updatedAccount })
  }

  onConsumerCreditsRefresh = async () => {
    const { consumerAccount, contract } = this.state
    const credits = await contract.methods.getCredits().call({ from: consumerAccount.address })
    const updatedAccount = await this.refreshAccount({ ...consumerAccount })
    this.setState({ consumerAccount: updatedAccount })
  }

  onOpenChannel = async () => {
    const { consumerAccount, contract } = this.state
    const openChannelResult = await contract.methods.openChannel().send({ from: consumerAccount.address, value: 100000000000000000, gas: 500000 })
    const updatedAccount = await this.refreshAccount({ ...consumerAccount })
    this.setState({ consumerAccount: updatedAccount })
  }

  render() {
    const {
      accounts,
      providerAccount,
      consumerAccount,
      contract
    } = this.state
    const consumerHasChannelOpen = consumerAccount && consumerAccount.hasChannelOpen

    return (
      <div className="app">
        <div className="consumer-provider-container">
          <div className="provider">
            <h2>Provider</h2>
            <AccountSelector accounts={accounts} selectedAccount={providerAccount} onChange={this.onProviderAccountChange}/>
            <br />

            <h3>Contract</h3>
            { !contract &&
              <div>
                <span>No deployed contract</span>
                <button type="button" onClick={this.onDeployContract}>Deploy contract</button>
              </div>
            }
            { !!contract &&
              <div>
                <span>Contract deployed at</span> <span className="eth-address">{contract.options.address}</span>
              </div>
            }

          </div>
          <div className="consumer">
            <h2>Consumer</h2>
            <AccountSelector accounts={accounts} selectedAccount={consumerAccount} onChange={this.onConsumerAccountChange}/>
            <br />

            <h3>Credit channel</h3>
            {
              !consumerHasChannelOpen &&
              <div>
                <span>Consumer does not have an open channel</span>
                <button type="button" onClick={this.onOpenChannel}>Open channel</button>
              </div>
            }
            {
              consumerHasChannelOpen &&
              <div>
                <label>Credits</label>
                <span className="amount">{consumerAccount.credits}</span>
                <button type="button" onClick={this.onConsumerCreditsRefresh}>refresh</button>
              </div>
            }
          </div>
        </div>
      </div>
    )
  }
}

export default App
