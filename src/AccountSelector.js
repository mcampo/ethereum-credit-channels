import React, { Component } from 'react'

export default class AccountSelector extends Component {
  onChange = (event) => {
    const { accounts, onChange } = this.props
    const selectedAddress = event.target.value
    const selectedAccount = accounts.find(account => account.address === selectedAddress)
    onChange({ selectedAccount })
  }

  render() {
    const { accounts, selectedAccount } = this.props
    const selectedAddress = selectedAccount ? selectedAccount.address : ''
    return (
      <div>
        <label>Address</label>
        <select value={selectedAddress} onChange={this.onChange}>
        {accounts.map(account => <option value={account.address} key={account.address}>{account.address}</option>)}
        </select>
        <br />

        <label>Balance</label>
        <span className="amount">{selectedAccount && selectedAccount.balance} ETH</span>
        <br />
      </div>
    )
  }
}
