// verification of MerkleTree proof from Starknet.js V5
// Cairo 1 code

// trait IMerkleVerify {
//     fn get_root() -> felt252;
//     fn get_hash(value1: felt252, value2: felt252) -> felt252;
//     fn verify_proof(leaf: felt252, proof: Array<felt252>) -> bool;
//     fn request_airdrop(address: felt252, amount: felt252, proof: Array<felt252>);
// }

#[contract]
mod merkle {
    use array::ArrayTrait;
    use option::OptionTrait;
    use traits::PartialOrd;

    struct Storage {
        merkle_root_storage: felt252
    }


    #[constructor]
    fn constructor(merkle_root: felt252) {
        merkle_root_storage::write(merkle_root);
    }

    // provide root value
    #[view]
    fn get_root() -> felt252 {
        merkle_root_storage::read()
    }

    // get pedersen hash of 2 values.
    #[view]
    fn get_hash(value1: felt252, value2: felt252) -> felt252 {
        pedersen(value1, value2)
    }

    // verify that a proof relates to the stored root
    //
    // @param :
    // - leaf : felt252 : the pedersen hash of the leaf to verify. Result of
    //          StarknetMerkleTree.leafHash(leaf) from starknet.js V5.
    //          In Cairo, h(h(h(p1,p2),p3)...,p_len).
    // - proof : array of felt252 : the proof of the leaf. Result of
    //           myTree.getProof(numOfDatas|datas[numsOfDatas]) from starknet.js V5.
    // @returns :
    // - res : bool : TRUE if leaf is part of the Merkle tree
    //
    #[view]
    fn verify_proof(leaf: felt252, proof: Array<felt252>) -> bool {
        let hash: felt252 = hash_proof(leaf, proof);
        let root: felt252 = get_root();
        if hash == root {
            return true;
        }
        return false;
    }

    // calculate proof hash
    fn hash_proof(leaf: felt252, proofEnter: Array<felt252>) -> felt252 {
        // mandatory in current cairo1 recursion
        match gas::withdraw_gas() {
            Option::Some(_) => {},
            Option::None(_) => {
                let mut data = ArrayTrait::<felt252>::new();
                data.append('NoGasError');
                panic(data);
            },
        }
        let mut proof = proofEnter;
        if (proof.len() == 0_u32) {
            return leaf;
        }
        let mut hash: felt252 = 0_felt252;
        if integer::u256_from_felt252(
            leaf
        ) < integer::u256_from_felt252(
            *proof[0_u32]
        ) {
            hash = get_hash(leaf, *proof[0_u32]);
        } else {
            hash = get_hash(*proof[0_u32], leaf);
        }
        proof.pop_front().unwrap();
        let result = hash_proof(hash, proof);
        result
    }

    #[external]
    fn request_airdrop(address: felt252, amount: felt252, proof: Array<felt252>) {
        let h0: felt252 = get_hash(0, address);
        let h1: felt252 = get_hash(h0, amount);
        let hashed_leaf: felt252 = get_hash(h1, 2); // 2= length of data (address & amount)
        let is_valid_request: bool = verify_proof(hashed_leaf, proof);
        assert(is_valid_request  == true, 'Proof not valid.'); // revert if not valid
        // Airdop
        // Do not forget to first store this address in a storage of addresses already airdropped,
        // to be sure to perform the airdrop only once per address.
        // Perform here your transfer of ERC20 or ERC721, using address & amount.
        return ();
    }
}

