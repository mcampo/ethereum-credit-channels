import React, { Component } from 'react'
import getWeb3 from './utils/getWeb3'
import creditChannels from './truffle/build/contracts/CreditChannels.json'
import AccountSelector from './AccountSelector'
import MessageSigner from './MessageSigner'
import MessageVerifier from './MessageVerifier'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      accounts: [],
      providerAccount: null,
      consumerAccount: null
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
    const { providerAccount } = this.state
    const web3 = await getWeb3()
    const balance = web3.utils.fromWei(await web3.eth.getBalance(account.address))
    account.balance = balance

    const contract = providerAccount && providerAccount.contract
    if (contract) {
      const hasChannelOpen = await contract.methods.hasChannelOpen().call({ from: account.address })
      account.hasChannelOpen = hasChannelOpen

      if (hasChannelOpen) {
        const credits = await contract.methods.getCredits().call({ from: account.address })
        account.credits = credits
      }
    } else {
      account.hasChannelOpen = false
    }
  }

  refreshContract = async () => {
    const { providerAccount: { contract } } = this.state
    const web3 = await getWeb3()
    const balance = web3.utils.fromWei(await web3.eth.getBalance(contract.options.address))
    contract.balance = balance
  }

  onProviderAccountChange = async ({ selectedAccount }) => {
    await this.refreshAccount(selectedAccount)
    this.setState({ providerAccount: selectedAccount }, async () => {
      const { consumerAccount } = this.state
      await this.refreshAccount(consumerAccount)
      this.setState({ consumerAccount })
    })
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
    await this.refreshAccount(providerAccount)
    deployedContract.setProvider(contract.currentProvider)
    deployedContract.balance = 0
    providerAccount.contract = deployedContract
    this.setState({ providerAccount })
  }

  onConsumerCreditsRefresh = async () => {
    const { consumerAccount, providerAccount: { contract } } = this.state
    const credits = await contract.methods.getCredits().call({ from: consumerAccount.address })
    consumerAccount.credits = credits
    this.setState({ consumerAccount })
  }

  onOpenChannel = async () => {
    const { consumerAccount, providerAccount: { contract } } = this.state
    await contract.methods.openChannel().send({ from: consumerAccount.address, value: 100000000000000000, gas: 500000 })
    await this.refreshAccount(consumerAccount)
    await this.refreshContract()
    this.setState({ consumerAccount })
  }

  render() {
    const {
      accounts,
      providerAccount,
      consumerAccount
    } = this.state
    const contract = providerAccount && providerAccount.contract
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
            { contract &&
              <div>
                <label>Contract deployed at</label>
                <span className="eth-address">{contract.options.address}</span>
                <br />

                <label>Balance</label>
                <span className="amount">{contract.balance} ETH</span>
                <br />

                <MessageVerifier account={providerAccount} contract={contract} />
              </div>
            }



          </div>
          <div className="consumer">
            <h2>Consumer</h2>
            <AccountSelector accounts={accounts} selectedAccount={consumerAccount} onChange={this.onConsumerAccountChange}/>
            <br />

            <h3>Credit channel</h3>
            {
              !contract &&
              <span>There is no deployed contracy by current provider</span>
            }
            {
              !!contract && !consumerHasChannelOpen &&
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
                <br />

                <MessageSigner account={consumerAccount} />
              </div>
            }

            {
              // consumerAccount && <MessageSigner account={consumerAccount} />
            }

          </div>
        </div>
      </div>
    )
  }
}

export default App
