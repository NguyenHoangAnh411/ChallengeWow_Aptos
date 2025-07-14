module challenge_wow_aptos::game_module {
    use std::signer;
    use std::error;
    use std::string;
    use aptos_framework::coin;

    struct PlayerData has key, store {
        score: u64,
        games_played: u64,
    }

    struct MyToken has store, drop {}

    struct CapStore has key {
        burn_cap: coin::BurnCapability<MyToken>,
        mint_cap: coin::MintCapability<MyToken>,
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

    public entry fun init_caps(account: &signer) {
        let addr = signer::address_of(account);
        assert!(!exists<CapStore>(addr), error::already_exists(2));

        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<MyToken>(
            account,
            string::utf8(b"My Token"),
            string::utf8(b"MTK"),
            6,
            false
        );

        move_to(account, CapStore {
            burn_cap,
            mint_cap,
        });

        coin::destroy_freeze_cap(freeze_cap);

        coin::register<MyToken>(account);
    }


    public entry fun mint_tokens(account: &signer, to: address, amount: u64) acquires CapStore {
        let caps = borrow_global<CapStore>(signer::address_of(account));
        let minted = coin::mint<MyToken>(amount, &caps.mint_cap);
        coin::deposit(to, minted);
    }

    public entry fun send_reward(sender: &signer, receiver: address, amount: u64) {
        coin::transfer<MyToken>(sender, receiver, amount);
    }

    public entry fun burn_tokens(account: &signer, amount: u64) acquires CapStore {
        let caps = borrow_global<CapStore>(signer::address_of(account));
        let coin_to_burn = coin::withdraw<MyToken>(account, amount);
        coin::burn<MyToken>(coin_to_burn, &caps.burn_cap);
    }
}
