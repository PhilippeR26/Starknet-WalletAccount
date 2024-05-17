//Cairo 2.6.0
// class : 0x67b6b4f02baded46f02feeed58c4f78e26c55364e59874d8abfd3532d85f1ba

#[starknet::interface]
trait ITestReject<TContractState> {
    fn test_fail(ref self: TContractState, p1: u8);
    fn get_counter(self: @TContractState) -> u8;
    fn get_nonce(self: @TContractState) -> felt252;
    fn init_count(ref self: TContractState, p1: u8);
    fn process_nonce(ref self: TContractState);
}

#[starknet::contract]
mod MyTestReject {
    #[storage]
    struct Storage {
        counter: u8,
        declare_nonce: felt252
    }

    #[constructor]
    fn constructor(ref self: ContractState,) {
        self.declare_nonce.write(0);
    }

    #[abi(embed_v0)]
    impl TestReject of super::ITestReject<ContractState> {
        fn test_fail(ref self: ContractState, p1: u8) {
            assert(p1 == 100, 'Fatal');
            self.counter.write(p1);
        }

        fn get_counter(self: @ContractState) -> u8 {
            self.counter.read()
        }

        fn get_nonce(self: @ContractState) -> felt252 {
            self.declare_nonce.read()
        }

        fn init_count(ref self: ContractState, p1: u8) {
            self.counter.write(p1);
        }

        fn process_nonce(ref self: ContractState) {
            self.declare_nonce.write(self.declare_nonce.read()+1);
        }
    }
}
