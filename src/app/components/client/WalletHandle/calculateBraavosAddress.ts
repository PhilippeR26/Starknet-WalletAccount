
import { ec, hash, num, CallData, BigNumberish, } from "starknet";
import { type Calldata } from "starknet";

const BraavosProxyClassHash: BigNumberish = "0x03131fa018d520a037686ce3efddeab8f28895662f019ca3ca18a626650f7d1e";
const BraavosInitialClassHash = "0x5aa23d5bb71ddaa783da7ea79d405315bafa7cf0387a74f4593578c3e9e6570";
const BraavosAccountClassHash1 = "0x2c2b8f559e1221468140ad7b2352b1acvv5be32660d0bf1a3ae3a054a4ec5254e4"; // 03/jun/2023
const BraavosAccountClassHash = "0x0105c0cf7aadb6605c9538199797920884694b5ce84fc68f92c832b0c9f57ad9"; // 27/aug/2023, will probably change over time


const calcBraavosInit = (starkKeyPubBraavos: string) => CallData.compile({ public_key: starkKeyPubBraavos });
const BraavosProxyConstructor = (BraavosInitializer: Calldata) => CallData.compile({
    implementation_address: BraavosInitialClassHash,
    initializer_selector: hash.getSelectorFromName("initializer"),
    calldata: [...BraavosInitializer,]
});

export function calculateAddressBraavos(
    privateKeyBraavos: num.BigNumberish,
): string {
    const starkKeyPubBraavos = ec.starkCurve.getStarkKey(num.toHex(privateKeyBraavos));
    const BraavosInitializer: Calldata = calcBraavosInit(starkKeyPubBraavos);
    const BraavosProxyConstructorCallData = BraavosProxyConstructor(BraavosInitializer);

    return hash.calculateContractAddressFromHash(
        starkKeyPubBraavos,
        BraavosProxyClassHash,
        BraavosProxyConstructorCallData,
        0);

}

