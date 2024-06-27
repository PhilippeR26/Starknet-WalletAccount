import { isWalletObj } from "get-starknet-core";

import { Box, Button, Center, Image, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, StackDivider, VStack, useDisclosure } from "@chakra-ui/react";
import { useStoreWallet } from "../../Wallet/walletContext";
import { useFrontendProvider } from "../provider/providerContext";
import { useEffect } from "react";
import { useState } from "react";
import { WalletAccount, wallet, validateAndParseAddress, constants as SNconstants } from "starknet";
import { WALLET_API } from "@starknet-io/types-js";
import { compatibleApiVersions, myFrontendProviders } from "@/utils/constants";

// export interface StarknetWalletProvider extends StarknetWindowObject {}
type ValidWallet = {
    wallet: WALLET_API.StarknetWindowObject;
    isValid: boolean;
}

export async function scanObjectForWalletsCustom(
    obj: Record<string, any>, // Browser window object
    isWalletObject: (wallet: any) => boolean,
): Promise<ValidWallet[]> {
    const AllObjectsNames: string[] = Object.getOwnPropertyNames(obj); // names of objects of level -1 of window
    const listNames: string[] = AllObjectsNames.filter((name: string) =>
        name.startsWith("starknet")
    );
    const Wallets: WALLET_API.StarknetWindowObject[] = Object.values(
        [...new Set(listNames)].reduce<Record<string, WALLET_API.StarknetWindowObject>>(
            (wallets, name: string) => {
                const wallet = obj[name] as WALLET_API.StarknetWindowObject;
                if (!wallets[wallet.id]) { wallets[wallet.id] = wallet }
                return wallets;
            },
            {}
        )
    );
    const validWallets: ValidWallet[] = await Promise.all(Wallets.map(
        async (wallet: WALLET_API.StarknetWindowObject) => {
            const isValid = await checkCompatibility(wallet);
            return { wallet: wallet, isValid: isValid } as ValidWallet;
        }
    ))
    console.log(validWallets);
    return validWallets;
}

const checkCompatibility = async (myWalletSWO: WALLET_API.StarknetWindowObject) => {
    let isCompatible: boolean = false;
    try {
        const apiVersions = (await myWalletSWO.request({ type:"wallet_supportedSpecs"  })) as string[];
        //if (compatibleApiVersions.some(r => apiVersions.includes(r))) { isCompatible = true };
        isCompatible = true;
    } catch {
        (err: any) => { console.log("Wallet compatibility failed.\n", err) };
    }
    return isCompatible;
}

export default function SelectWallet() {
    const { isOpen, onOpen, onClose } = useDisclosure()

    const myWallet = useStoreWallet(state => state.StarknetWalletObject);
    const setMyWallet = useStoreWallet(state => state.setMyStarknetWalletObject);

    const myWalletAccount = useStoreWallet(state => state.myWalletAccount);
    const setMyWalletAccount = useStoreWallet(state => state.setMyWalletAccount);
    const myFrontendProviderIndex = useFrontendProvider(state => state.currentFrontendProviderIndex);
    const setCurrentFrontendProviderIndex = useFrontendProvider(state => state.setCurrentFrontendProviderIndex);

    const isConnected = useStoreWallet(state => state.isConnected);
    const setConnected = useStoreWallet(state => state.setConnected);

    const displaySelectWalletUI = useStoreWallet(state => state.displaySelectWalletUI);
    const setSelectWalletUI = useStoreWallet(state => state.setSelectWalletUI);

    const setWalletApi = useStoreWallet(state => state.setWalletApiList);

    const setChain = useStoreWallet(state => state.setChain);
    const setAddressAccount = useStoreWallet(state => state.setAddressAccount);

    const [walletList, setWalletList] = useState<ValidWallet[]>([]);

    const handleSelectedWallet = async (selectedWallet: WALLET_API.StarknetWindowObject) => {
        console.log("Trying to connect wallet=", selectedWallet);
        setMyWallet(selectedWallet); // zustand
        setMyWalletAccount(new WalletAccount(myFrontendProviders[2], selectedWallet));

        const result = await wallet.requestAccounts(selectedWallet);
        if (typeof (result) == "string") {
            console.log("This Wallet is not compatible.");
            setSelectWalletUI(false);
            return;
        }
        console.log("Current account addr =", result);
        if (Array.isArray(result)) {
            const addr = validateAndParseAddress(result[0]);
            setAddressAccount(addr); // zustand
        }
        const isConnectedWallet: boolean = await wallet.getPermissions(selectedWallet).then((res: any) => (res as WALLET_API.Permission[]).includes( WALLET_API.Permission.ACCOUNTS));
        setConnected(isConnectedWallet); // zustand
        if (isConnectedWallet) {
            const chainId = (await wallet.requestChainId(selectedWallet)) as string;
            setChain(chainId);
            //setCurrentFrontendProviderIndex(chainId === StarknetChainId.SN_MAIN ? 0 : 2);
            setCurrentFrontendProviderIndex(chainId === '0x534e5f4d41494e' ? 0 : 2);
            console.log("change Provider index to :", myFrontendProviderIndex);
        }
        // ********** TODO : replace supportedSpecs by api versions when available in SNJS
        setWalletApi(await wallet.supportedSpecs(selectedWallet));

        setSelectWalletUI(false);
        // console.log("End of handleSelectedWallet", isConnected);
    }

    useEffect(
        () => {
            const fetchData = async () => {
                const res = await scanObjectForWalletsCustom(window, isWalletObj);
                return res
            }
            console.log("Launch select wallet window.");
            fetchData().then((wallets) => setWalletList(wallets));
            onOpen();
            return () => { }
        },
        []
    )

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                setSelectWalletUI(false);
                onClose()
            }}
            closeOnOverlayClick={true}
        >
            <ModalOverlay />
            <ModalContent>
                <ModalHeader fontSize='lg' fontWeight='bold'>
                    Select a wallet.
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack
                        divider={<StackDivider borderColor='gray.200' />}
                        spacing={3}
                        align='stretch'
                    >
                        {
                            walletList.map((wallet: ValidWallet, index: number) => {
                                const iconW: string = typeof (wallet.wallet.icon) == "string" ? wallet.wallet.icon : wallet.wallet.icon.light;
                                return <>
                                    {wallet.isValid ? <>
                                        <Button id={"wId" + index.toString()}
                                            leftIcon={<Image src={iconW} width={30} />}
                                            onClick={() => {
                                                setMyWallet(wallet.wallet); // zustand
                                                setSelectWalletUI(false);
                                                handleSelectedWallet(wallet.wallet);
                                                onClose();
                                            }} >{wallet.wallet.name + ' ' + wallet.wallet.version}
                                        </Button>
                                    </> : <>
                                        <Button id={"wId" + index.toString()}
                                            backgroundColor="orange"
                                            isDisabled={true}
                                            leftIcon={<Image src={iconW} width={30} />}
                                        >{wallet.wallet.name + ' ' + wallet.wallet.version + " not compatible!"}
                                        </Button>
                                    </>}
                                </>
                            })

                        }
                    </VStack>
                </ModalBody>
                <ModalFooter>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}