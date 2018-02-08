import React, { Component } from 'react'
import getWeb3 from './utils/getWeb3'


export default class MessageSigner extends Component {
  constructor(props) {
    super(props)
    this.state = {
      credits: 1,
      signature: ''
    }
  }

  async componentDidMount() {
    const { account } = this.props
    const web3 = await getWeb3()
    const channelId = web3.utils.sha3(account.address)
    this.setState({ channelId })
  }

  onCreditsChange = (event) => {
    this.setState({
      credits: +event.target.value,
      signature: ''
    })
  }

  onSign = async () => {
    const { account } = this.props
    const { channelId, credits } = this.state
    const web3 = await getWeb3()
    const messageHash = web3.utils.soliditySha3(channelId, credits)
    const signature = await web3.eth.sign(messageHash, account.address)
    this.setState({ signature })
  }

  render() {
    const { account } = this.props
    const { channelId, credits, signature } = this.state
    return (
      <div className="message-signer">
        <h4>Sign message</h4>

        <label>ChannelId</label>
        <span className="value">{channelId}</span>
        <br />

        <label>Credits</label>
        <input type="number" className="credits" value={credits} onChange={this.onCreditsChange} />
        <br />

        <label>Signature</label>
        <span className="value">{signature}</span>
        <button type="button" onClick={this.onSign}>Sign</button>

      </div>
    )
  }
}
