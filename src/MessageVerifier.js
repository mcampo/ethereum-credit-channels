import React, { Component } from 'react'
import getWeb3 from './utils/getWeb3'


export default class MessageVerifier extends Component {
  constructor(props) {
    super(props)
    this.state = {
      channelId: '',
      credits: '',
      signature: ''
    }
  }

  onChannelIdChange = (event) => {
    this.setState({ channelId: event.target.value })
  }

  onCreditsChange = (event) => {
    this.setState({ credits: +event.target.value })
  }

  onSignatureChange = (event) => {
    const signature = event.target.value

    this.setState({ signature })
  }

  onVerify = async () => {
    const { account, contract } = this.props
    const { channelId, credits, signature } = this.state

    const web3 = await getWeb3()
    const signatureParts = {
      r: signature.slice(0, 66),
      s: '0x' + signature.slice(66, 130),
      v: web3.utils.hexToNumber('0x' + signature.slice(130, 132)) + 27
    }
    const isValid = await contract.methods.verifyMessage(channelId, credits, signatureParts.v, signatureParts.r, signatureParts.s).call({ from: account.address })
    console.log(isValid)
    this.setState({ isValid })
  }

  render() {
    const { channelId, credits, signature } = this.state
    return (
      <div className="message-verifier">
        <h4>Verify message</h4>

        <label>ChannelId</label>
        <input type="text" value={channelId} onChange={this.onChannelIdChange} />
        <br />

        <label>Credits</label>
        <input type="number" className="credits" value={credits} onChange={this.onCreditsChange} />
        <br />

        <label>Signature</label>
        <input type="text" value={signature} onChange={this.onSignatureChange} />
        <br />

        <button type="button" onClick={this.onVerify}>Verify</button>
      </div>
    )
  }
}
