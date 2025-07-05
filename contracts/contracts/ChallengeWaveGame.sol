// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interface for NFT contract
interface IChallengeWaveNFT {
    function getNFTByRoom(bytes16 roomId) external view returns (
        uint256 tokenId,
        address host,
        address winner,
        string memory tokenURI,
        bool isTransferred
    );
    function transferToWinner(bytes16 roomId, address winner) external;
}

contract ChallengeWaveGame is Ownable, ReentrancyGuard {
    event GameEnded(bytes16 indexed roomId, address indexed winner, uint256 score, bytes32 zkProof);
    event NFTTransferredToWinner(bytes16 indexed roomId, uint256 indexed tokenId, address indexed winner);

    struct GameResult {
        bytes16 roomId;
        address winner;
        uint256 score;
        bytes32 zkProof;
        uint256 timestamp;
    }
    mapping(bytes16 => GameResult) public gameResults;

    address public nftContract;

    modifier nftContractSet() {
        require(nftContract != address(0), "NFT contract not set");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setNFTContract(address _nftContract) external onlyOwner {
        require(_nftContract != address(0), "Invalid NFT contract address");
        nftContract = _nftContract;
    }

    function submitGameResult(
        bytes16 roomId,
        address winner,
        uint256 score,
        bytes32 zkProof
    ) external nftContractSet {
        gameResults[roomId] = GameResult({
            roomId: roomId,
            winner: winner,
            score: score,
            zkProof: zkProof,
            timestamp: block.timestamp
        });
        emit GameEnded(roomId, winner, score, zkProof);
        // Gọi trực tiếp internal
        transferNFTToWinner(roomId, winner);
    }

    function transferNFTToWinner(bytes16 roomId, address winner)
        internal
        nftContractSet
    {
        (bool success, ) = nftContract.call(
            abi.encodeWithSignature("transferToWinner(bytes16,address)", roomId, winner)
        );
        if (success) {
            (uint256 tokenId, , , , ) = IChallengeWaveNFT(nftContract).getNFTByRoom(roomId);
            emit NFTTransferredToWinner(roomId, tokenId, winner);
        }
    }

    function getGameResult(bytes16 roomId) external view returns (GameResult memory) {
        return gameResults[roomId];
    }
} 