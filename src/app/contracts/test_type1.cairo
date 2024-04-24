#[contract]
mod HelloStarknet {
    struct Storage {
        balance: felt252, 
    }
    
    #[view]
    fn test1(p1: felt252) -> felt252 {
        p1 + 1_felt252
    }

    #[view]
    fn test2(p1: u128) -> u128 {
        let a: u128 = 4_u128;
        p1 + 1_u128
    }

    #[view]
    fn test3() -> u128 {
        let a: u128 = 4_u128;

        a
    }

    // Increases the balance by the given amount.
    #[external]
    fn increase_balance(amount: felt252) {
        balance::write(balance::read() + amount);
    }

    // Returns the current balance.
    #[view]
    fn get_balance() -> felt252 {
        balance::read()
    }
}
