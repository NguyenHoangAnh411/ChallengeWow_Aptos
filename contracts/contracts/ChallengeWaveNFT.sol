// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ChallengeWaveNFT
 * @dev NFT contract for Challenge Wave GameFi DApp
 * NFTs are minted by hosts and transferred to winners
 */
contract ChallengeWaveNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {

    // Events
    event NFTMinted(uint256 indexed tokenId, address indexed host, string tokenURI);
    event NFTTransferred(uint256 indexed tokenId, address indexed from, address indexed to, bytes16 roomId);
    event GameNFTCreated(uint256 indexed tokenId, bytes16 indexed roomId, address indexed winner);

    // State variables
    uint256 private _tokenIds;
    mapping(bytes16 => uint256) public roomToNFT; // roomId => tokenId
    mapping(uint256 => bytes16) public nftToRoom; // tokenId => roomId
    mapping(uint256 => address) public nftHost; // tokenId => host address
    mapping(uint256 => address) public nftWinner; // tokenId => winner address
    
    // Game contract that can trigger transfers
    address public gameContract;
    
    // NFT metadata
    string public baseURI;
    uint256 public mintPrice = 0.01 ether; // 0.01 OLYM for minting
    
    // Modifiers
    modifier onlyGameContract() {
        require(msg.sender == gameContract, "Only game contract can call this");
        _;
    }
    
    modifier onlyNFTHost(uint256 tokenId) {
        require(nftHost[tokenId] == msg.sender, "Only NFT host can call this");
        _;
    }

    constructor() ERC721("Challenge Wave NFT", "CWAVE") Ownable(msg.sender) {
        baseURI = "";
    }

    /**
     * @dev Set the game contract address
     * @param _gameContract Address of the game contract
     */
    function setGameContract(address _gameContract) external onlyOwner {
        require(_gameContract != address(0), "Invalid game contract address");
        gameContract = _gameContract;
    }

    /**
     * @dev Mint NFT for a game room (only owner can call)
     * @param roomId ID of the game room (bytes16 UUID)
     * @param metadataURI URI for the NFT metadata
     */
    function mintGameNFT(bytes16 roomId, string memory metadataURI) 
        external 
        payable 
        nonReentrant 
        onlyOwner
        returns (uint256 tokenId) 
    {
        require(msg.value >= mintPrice, "Insufficient mint price");
        require(roomToNFT[roomId] == 0, "NFT already exists for this room");
        
        _tokenIds++;
        tokenId = _tokenIds;
        
        // Mint NFT to owner (you)
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        // Store metadata
        roomToNFT[roomId] = tokenId;
        nftToRoom[tokenId] = roomId;
        nftHost[tokenId] = msg.sender; // This will be your address
        
        emit NFTMinted(tokenId, msg.sender, metadataURI);
        
        return tokenId;
    }

    /**
     * @dev Transfer NFT to winner (only game contract can call)
     * @param roomId ID of the game room (bytes16 UUID)
     * @param winner Address of the winner
     */
    function transferToWinner(bytes16 roomId, address winner) 
        external 
        onlyGameContract 
        nonReentrant 
    {
        uint256 tokenId = roomToNFT[roomId];
        require(tokenId > 0, "NFT not found for this room");
        require(ownerOf(tokenId) == nftHost[tokenId], "NFT not owned by host");
        require(winner != address(0), "Invalid winner address");
        
        address host = nftHost[tokenId];
        nftWinner[tokenId] = winner;
        
        // Transfer NFT from host to winner
        _transfer(host, winner, tokenId);
        
        emit NFTTransferred(tokenId, host, winner, roomId);
        emit GameNFTCreated(tokenId, roomId, winner);
    }

    /**
     * @dev Get NFT info by room ID
     * @param roomId ID of the game room (bytes16 UUID)
     */
    function getNFTByRoom(bytes16 roomId) external view returns (
        uint256 tokenId,
        address host,
        address winner,
        string memory metadataURI,
        bool isTransferred
    ) {
        tokenId = roomToNFT[roomId];
        if (tokenId > 0) {
            host = nftHost[tokenId];
            winner = nftWinner[tokenId];
            metadataURI = tokenURI(tokenId);
            isTransferred = winner != address(0);
        }
    }

    /**
     * @dev Get NFT info by token ID
     * @param tokenId ID of the NFT
     */
    function getNFTInfo(uint256 tokenId) external view returns (
        bytes16 roomId,
        address host,
        address winner,
        string memory metadataURI,
        address currentOwner
    ) {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        roomId = nftToRoom[tokenId];
        host = nftHost[tokenId];
        winner = nftWinner[tokenId];
        metadataURI = tokenURI(tokenId);
        currentOwner = ownerOf(tokenId);
    }

    /**
     * @dev Get all NFTs owned by an address
     * @param owner Address to check
     */
    function getNFTsByOwner(address owner) external view returns (uint256[] memory) {
        uint256 currentSupply = _tokenIds;
        uint256[] memory ownedTokens = new uint256[](balanceOf(owner));
        uint256 ownedIndex = 0;
        
        for (uint256 i = 1; i <= currentSupply; i++) {
            if (_ownerOf(i) != address(0) && ownerOf(i) == owner) {
                ownedTokens[ownedIndex] = i;
                ownedIndex++;
            }
        }
        
        return ownedTokens;
    }

    /**
     * @dev Get NFTs won by an address
     * @param winner Address to check
     */
    function getNFTsWonBy(address winner) external view returns (uint256[] memory) {
        uint256 currentSupply = _tokenIds;
        uint256[] memory wonTokens = new uint256[](currentSupply);
        uint256 wonIndex = 0;
        
        for (uint256 i = 1; i <= currentSupply; i++) {
            if (_ownerOf(i) != address(0) && nftWinner[i] == winner) {
                wonTokens[wonIndex] = i;
                wonIndex++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](wonIndex);
        for (uint256 i = 0; i < wonIndex; i++) {
            result[i] = wonTokens[i];
        }
        
        return result;
    }

    /**
     * @dev Update base URI (only owner)
     * @param newBaseURI New base URI
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        baseURI = newBaseURI;
    }

    /**
     * @dev Update mint price (only owner)
     * @param newPrice New mint price in wei
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdrawBalance() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Emergency function to transfer NFT (only owner)
     * @param tokenId ID of the NFT
     * @param to Address to transfer to
     */
    function emergencyTransfer(uint256 tokenId, address to) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        require(to != address(0), "Invalid recipient address");
        
        address currentOwner = ownerOf(tokenId);
        _transfer(currentOwner, to, tokenId);
        
        emit NFTTransferred(tokenId, currentOwner, to, nftToRoom[tokenId]);
    }

    // Override functions
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    // Override tokenURI to return the full URI set at mint, not baseURI + tokenURI
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return ERC721URIStorage.tokenURI(tokenId);
    }



    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Get total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIds;
    }

    /**
     * @dev Check if NFT exists
     * @param tokenId ID of the NFT
     */
    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
} 