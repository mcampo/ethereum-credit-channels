pragma solidity ^0.4.18;

contract CreditChannels {

  struct Channel {
    address consumer;
    uint deposit;
    uint conversionRate;
  }

  address provider;
  mapping (bytes32 => Channel) channels;

  function CreditChannels(address _provider) public {
    provider = _provider;
  }

  function openChannel() payable external returns (bytes32) {
    bytes32 channelId = keccak256(msg.sender);
    Channel memory channel = Channel(
      msg.sender,
      msg.value,
      1000000
    );

    channels[channelId] = channel;
  }

  function hasChannelOpen() external view returns (bool) {
    bytes32 channelId = keccak256(msg.sender);
    if (channels[channelId].consumer == msg.sender) {
      return true;
    }
    return false;
  }

  function getCredits() external view returns (uint) {
    bytes32 channelId = keccak256(msg.sender);
    if (channels[channelId].consumer == msg.sender) {
      return ethToCredits(channels[channelId].deposit, channels[channelId].conversionRate);
    }
    return 0;
  }

  function verifyMessage(bytes32 channelId, uint credits, uint8 v, bytes32 r, bytes32 s) external view returns (bool) {
    Channel memory channel;
    channel = channels[channelId];

    // verify the channel has enough credits
    if (credits > ethToCredits(channel.deposit, channel.conversionRate)) {
      return false;
    }

    // verift the consumer has signed the promise
    bytes32 messageHash = keccak256(channelId, credits);
    bytes memory prefix = "\x19Ethereum Signed Message:\n32";
    messageHash = keccak256(prefix, messageHash);
    address signer = ecrecover(messageHash, v, r, s);
    if (signer != channel.consumer) {
      return false;
    }

    return true;
  }

  function closeChannel(uint clientId, bytes32[3] h, uint8 v, uint credits) external {
    // h[0]    Hash of (id, credits)
    // h[1]    r of signature
    // h[2]    s of signature

    bytes32 channelId = keccak256(clientId);

    // only the provider can close the channel
    require(msg.sender == provider);

    Channel memory channel;
    channel = channels[channelId];

    // verify the channel has enough credits
    require(credits <= ethToCredits(channel.deposit, channel.conversionRate));

    address signer = ecrecover(h[0], v, h[1], h[2]);
    require(signer == channel.consumer);

    // verify the hash provided is of the channel id and the amount sent
    bytes32 proof = keccak256(channelId, credits);
    require(proof == h[0]);

    uint consumedEth = creditsToEth(credits, channel.conversionRate);
    provider.transfer(consumedEth);
    channel.consumer.transfer(channel.deposit - consumedEth);

    delete channels[channelId];
  }

  function ethToCredits(uint ethAmount, uint conversionRate) internal pure returns (uint) {
    return ethAmount * conversionRate;
  }

  function creditsToEth(uint credits, uint conversionRate) internal pure returns (uint) {
    return credits / conversionRate;
  }

  function ping() external pure returns (uint) {
    return 200;
  }

}
