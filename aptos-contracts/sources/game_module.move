module challenge_wow_aptos::game_module {
    use std::signer;
    use std::error;
    use aptos_framework::coin;
    use aptos_framework::coin::Coin;
    use aptos_framework::coin::BurnCapability;
    use aptos_framework::aptos_coin;

    struct PlayerData has key, store {
        score: u64,
        games_played: u64,
    }

    struct CapStore has key {
        burn_cap: BurnCapability<aptos_coin::AptosCoin>,
    }

    public entry fun init_player(account: &signer) {
        let addr = signer::address_of(account);
        assert!(!exists<PlayerData>(addr), error::invalid_argument(1));
        move_to(account, PlayerData { score: 0, games_played: 0 });
    }

    public entry fun submit_score(account: &signer, score: u64) acquires PlayerData {
        let addr = signer::address_of(account);
        let data = borrow_global_mut<PlayerData>(addr);
        data.score = data.score + score;
        data.games_played = data.games_played + 1;
    }

    public fun get_score(addr: address): u64 acquires PlayerData {
        borrow_global<PlayerData>(addr).score
    }

    public fun get_games_played(addr: address): u64 acquires PlayerData {
        borrow_global<PlayerData>(addr).games_played
    }

    public entry fun send_reward(sender: &signer, receiver: address, amount: u64) {
        coin::transfer<aptos_coin::AptosCoin>(sender, receiver, amount);
    }

    public fun get_burn_cap(account: &signer): BurnCapability<aptos_coin::AptosCoin> {
        let (burn_cap, _, _) = coin::initialize<aptos_coin::AptosCoin>(
            account,
            b"Aptos Coin", // name
            b"APT",        // symbol
            8,             // decimals
            false          // monitor_supply
        );
        burn_cap
    }

    public entry fun init_caps(account: &signer) {
        if (exists<CapStore>(signer::address_of(account))) {
            return;
        }
        let (burn_cap, _, _) = coin::initialize<aptos_coin::AptosCoin>(
            account,
            b"Aptos Coin", // name
            b"APT",        // symbol
            8,             // decimals
            false          // monitor_supply
        );
        move_to(account, CapStore { burn_cap });
    }

    public entry fun burn_tokens(account: &signer, amount: u64) acquires CapStore {
        let cap = borrow_global<CapStore>(signer::address_of(account));
        let coin_to_burn: Coin<aptos_coin::AptosCoin> = coin::withdraw<aptos_coin::AptosCoin>(account, amount);
        coin::burn<aptos_coin::AptosCoin>(coin_to_burn, &cap.burn_cap);
    }

}
