use starknet::ContractAddress;

// Must match privacy::objects::OpenNoteDeposit (positional Serde).
#[derive(Serde, Copy, Drop, PartialEq, Debug)]
pub struct OpenNoteDeposit {
    pub note_id: felt252,
    pub token: ContractAddress,
    pub amount: u128,
}

#[starknet::interface]
pub trait IErc20<TState> {
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
}

#[starknet::interface]
pub trait IStrkInvokeHelper<TState> {
    // Called by the privacy pool via selector!("privacy_invoke").
    fn privacy_invoke(
        ref self: TState,
        token: ContractAddress, // STRK (literal felt in calldata)
        pool_address: ContractAddress, // wallet placeholder: poolAddress
        note_id: felt252 // wallet placeholder: openNoteIds[0]
    ) -> Span<OpenNoteDeposit>;
    fn get_invoke_count(self: @TState) -> u64;
    fn get_last_note_id(self: @TState) -> felt252;
}

#[starknet::contract]
mod StrkInvokeHelper {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use super::{IErc20Dispatcher, IErc20DispatcherTrait, OpenNoteDeposit};

    mod errors {
        pub const BAD_POOL: felt252 = 'BAD_POOL';
        pub const NO_INPUT: felt252 = 'NO_INPUT';
        pub const AMOUNT_OVERFLOW: felt252 = 'AMOUNT_OVERFLOW';
    }

    #[storage]
    struct Storage {
        invoke_count: u64,
        last_note_id: felt252,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Invoked: Invoked,
    }

    #[derive(Drop, starknet::Event)]
    struct Invoked {
        #[key]
        note_id: felt252,
        amount: u128,
        caller: ContractAddress,
    }

    #[abi(embed_v0)]
    impl HelperImpl of super::IStrkInvokeHelper<ContractState> {
        fn privacy_invoke(
            ref self: ContractState,
            token: ContractAddress,
            pool_address: ContractAddress,
            note_id: felt252,
        ) -> Span<OpenNoteDeposit> {
            // Demonstrates the poolAddress placeholder and validates it: it must be the caller.
            let caller = get_caller_address();
            assert(pool_address == caller, errors::BAD_POOL);

            let erc20 = IErc20Dispatcher { contract_address: token };
            // The pool already sent the STRK here (phase order: withdraw < invoke).
            let balance: u256 = erc20.balance_of(get_contract_address());
            let amount: u128 = balance.try_into().expect(errors::AMOUNT_OVERFLOW);
            assert(amount != 0, errors::NO_INPUT);

            // Echo: allow the pool to pull everything back to fill the open note.
            erc20.approve(pool_address, balance);

            // Side effect — proves invoke runs arbitrary logic atomically.
            self.invoke_count.write(self.invoke_count.read() + 1);
            self.last_note_id.write(note_id);
            self.emit(Invoked { note_id, amount, caller });

            array![OpenNoteDeposit { note_id, token, amount }].span()
        }

        fn get_invoke_count(self: @ContractState) -> u64 {
            self.invoke_count.read()
        }

        fn get_last_note_id(self: @ContractState) -> felt252 {
            self.last_note_id.read()
        }
    }
}
