import React, { Component } from 'react'
import getWeb3 from './utils/getWeb3'
import creditChannels from './truffle/build/contracts/CreditChannels.json'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      contractAddress: creditChannels.networks[Object.keys(creditChannels.networks)[0]].address
    }
  }

  async componentDidMount() {
    const web3 = await getWeb3()
    const accounts = await web3.eth.getAccounts()
    const consumerAddress = accounts[0]
    this.setState({ consumerAddress })
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevState.consumerAddress !== this.state.consumerAddress) {
      this.refreshConsumer()
    }
  }

  getContract = async () => {
    const web3 = await getWeb3()
    const contract = new web3.eth.Contract(creditChannels.abi, this.state.contractAddress)
    return contract
  }

  refreshConsumer = async () => {
    const { consumerAddress } = this.state
    const web3 = await getWeb3()
    const consumerBalance = web3.utils.fromWei(await web3.eth.getBalance(consumerAddress))
    const contract = await this.getContract()
    const consumerHasChannelOpen = await contract.methods.hasChannelOpen().call({ from: consumerAddress })
    let consumerCredits = 0;

    if (consumerHasChannelOpen) {
      consumerCredits = await contract.methods.getCredits().call({ from: consumerAddress })
    }

    this.setState({ consumerBalance, consumerHasChannelOpen, consumerCredits })
  }

  onContractPing = async () => {
    const contract = await this.getContract()
    const pingResult = await contract.methods.ping().call()
    this.setState({ pingResult })
  }

  onConsumerCreditsRefresh = async () => {
    const { consumerAddress } = this.state
    const contract = await this.getContract()
    const consumerCredits = await contract.methods.getCredits().call({ from: consumerAddress })
    this.setState({ consumerCredits })
  }

  onOpenChannel = async () => {
    const { consumerAddress } = this.state
    const contract = await this.getContract()
    const openChannelResult = await contract.methods.openChannel().send({ from: consumerAddress, value: 100000000000000000, gas: 500000 })
    this.refreshConsumer()
    console.log(openChannelResult)
  }

  render() {
    const {
      consumerAddress,
      consumerBalance,
      consumerHasChannelOpen,
      consumerCredits,
      pingResult,
      contractAddress,
    } = this.state

    return (
      <div className="app">
        <div className="contract-section">
          <label>Contract address</label>
          <span className="eth-address">{contractAddress}</span>
          <button type="button" onClick={this.onContractPing}>ping</button>
          <span>{pingResult}</span>
        </div>

        <div className="consumer-provider-container">
          <div className="provider">
            <h2>Provider</h2>
          </div>
          <div className="consumer">
            <h2>Consumer</h2>
            <label>Address</label>
            <span className="eth-address">{consumerAddress}</span>
            <br />

            <label>Balance</label>
            <span className="amount">{consumerBalance} ETH</span>
            <br />

            <h3>Credit channel</h3>
            {
              !consumerHasChannelOpen &&
              <button type="button" onClick={this.onOpenChannel}>open channel</button>
            }
            {
              consumerHasChannelOpen &&
              <div>
                <label>Credits</label>
                <span className="amount">{consumerCredits}</span>
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
