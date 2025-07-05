// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title OLYMToken
 * @dev ERC20 token for Challenge Wave GameFi DApp
 * Used as rewards and entry fees for games
 */
contract OLYMToken is ERC20, ERC20Burnable, Ownable, Pausable {
    
    // Events
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event GameRewardDistributed(address indexed winner, uint256 amount);
    
    // Game contract that can mint tokens
    address public gameContract;
    
    // Constants
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1 million OLYM
    uint256 public constant MAX_SUPPLY = 10000000 * 10**18; // 10 million OLYM
    
    // Modifiers
    modifier onlyGameContract() {
        require(msg.sender == gameContract, "Only game contract can call this");
        _;
    }
    
    modifier notExceedMaxSupply(uint256 amount) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
        _;
    }

    constructor() ERC20("OLYM Token", "OLYM") Ownable(msg.sender) {
        // Mint initial supply to contract deployer
        _mint(msg.sender, INITIAL_SUPPLY);
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
     * @dev Mint tokens (only owner or game contract)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) 
        external 
        onlyOwner 
        notExceedMaxSupply(amount)
    {
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Mint tokens for game rewards (only game contract)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mintGameReward(address to, uint256 amount) 
        external 
        onlyGameContract 
        notExceedMaxSupply(amount)
    {
        _mint(to, amount);
        emit GameRewardDistributed(to, amount);
    }

    /**
     * @dev Burn tokens from caller
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @dev Burn tokens from specific address (only owner)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address from, uint256 amount) public override onlyOwner {
        super.burnFrom(from, amount);
        emit TokensBurned(from, amount);
    }

    /**
     * @dev Pause token transfers (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause token transfers (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Override _update to include pausable functionality
     */
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }

    /**
     * @dev Get token info
     */
    function getTokenInfo() external view returns (
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint256 maxSupply,
        address gameContractAddress
    ) {
        return (
            name,
            symbol,
            totalSupply,
            MAX_SUPPLY,
            gameContract
        );
    }

    /**
     * @dev Check if address can mint tokens
     */
    function canMint(address account) external view returns (bool) {
        return account == owner() || account == gameContract;
    }

    /**
     * @dev Get remaining mintable supply
     */
    function getRemainingMintableSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
} 