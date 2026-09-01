"use client";

import Image from 'next/image'
import styles from './page.module.css'
import { Center, Box, Tabs } from '@chakra-ui/react';
import { Button } from "@chakra-ui/react";
import { Provider } from "@/components/ui/provider";
import { CairoBytes31 } from 'starknet';
import InteractContract from './components/client/Contract/InteractContract';
import { useStoreWallet } from './components/Wallet/walletContext';
import starknetJsImg from '../../public/Images/StarkNet-JS_logo.png';
import WalletApiTag from './components/client/WalletHandle/WalletApiTag';
import SelectWallet from './components/client/WalletHandle/SelectWallet';
import WalletAccountTag from './components/client/WalletHandle/WalletAccountTag';
import WalletAccountV6Tag from './components/client/WalletHandle/WalletAccountV6Tag';
import { useFrontendProvider } from './components/client/provider/providerContext';
import LowerBanner from "./components/client/LowerBanner";

// Shared look for the four tab triggers: the selected one is a solid ink slab with white
// text, the others stay quiet until hovered. Kept in one place so the four stay in sync.
const tabStyle = {
  fontWeight: "bold",
  rounded: "l2",
  // The three states sit far apart on the ramp on purpose - 500 for the idle label, 600
  // for the active fill, 800 for its hover. Packed any closer they read as one blue.
  color: { base: "ink.500", _dark: "ink.200" },
  transition: "background-color 150ms ease, color 150ms ease",
  _hover: { bg: "ink.muted" },
  _selected: {
    bg: "ink.solid",
    color: "ink.contrast",
    shadow: "sm",
    // Nested, so the selector is [data-selected]:hover and outranks the bare :hover above.
    // As siblings they tie on specificity and the hover background wins, repainting the
    // active tab near-white under its white label. Darken on hover rather than lighten.
    _hover: { bg: { base: "ink.800", _dark: "ink.700" } },
  },
};

export default function Page() {
  const addressAccountFromContext = useStoreWallet(state => state.address);
  const { setAddressAccount } = useStoreWallet(state => state);

  const myFrontendProviderIndex = useFrontendProvider(state => state.currentFrontendProviderIndex);
  const { setCurrentFrontendProviderIndex } = useFrontendProvider(state => state);

  const myWallet = useStoreWallet(state => state.StarknetWalletObject);
  const setMyWallet = useStoreWallet(state => state.setMyStarknetWalletObject);

  const chainFromContext = useStoreWallet(state => state.chain);
  const { setChain } = useStoreWallet(state => state);

  
  const providerFromContext = useStoreWallet(state => state.provider);
  const { setProvider } = useStoreWallet(state => state);

  const { isConnected, setConnected } = useStoreWallet(state => state);


  return (
    <Provider>
      <div>
        <p className={styles.bgText}>
          Test WalletAccountV6 of Starknet.js v10.7.0 <br></br>
          with get-starknet v6.0.4 and Wallet API v0.10.4-beta.2
        </p>
        <Center>
          <Image src={starknetJsImg} alt='starknet.js' width={150} />
        </Center>
        <div>
          {!isConnected ? (
            <>
              
                 <SelectWallet></SelectWallet>
              
            </>
          ) : (
            <>
              <Center>
                <Button
                  variant="surface"
                  textDecoration="none !important"
                  fontWeight='bold'
                  outline="none !important"
                  boxShadow="none !important"
                  mt={3}
                  px={5}
                  onClick={() => {
                    setConnected(false);
                  }}
                >
                  {addressAccountFromContext
                    ? `Your wallet : ${addressAccountFromContext?.slice(0, 7)}...${addressAccountFromContext?.slice(-4)} is connected`
                    : "No Account"}
                </Button>
              </Center>
              <br />
              <Tabs.Root
                variant="plain"
                colorPalette="ink"
                size="lg"
                defaultValue="blockChain"
                fitted >
                <Tabs.List bg="ink.subtle" borderWidth="1px" borderColor="ink.emphasized" rounded="l3" p="1.5" gap="1" >
                  <Tabs.Trigger {...tabStyle} value="blockChain">BlockChain</Tabs.Trigger>
                  <Tabs.Trigger {...tabStyle} value="walletAPI">Wallet API</Tabs.Trigger>
                  <Tabs.Trigger {...tabStyle} value="walletAccount">WalletAccount</Tabs.Trigger>
                  <Tabs.Trigger {...tabStyle} value="walletAccountV6">WalletAccountV6</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="blockChain">
                  <Box bg='pink.200' color='black' borderWidth='1px' borderRadius='md'>
                    <p className={styles.text1}>
                      address = {addressAccountFromContext}<br />
                      chain = {chainFromContext != "" ? new CairoBytes31(chainFromContext).decodeUtf8() : ""}
                      <br />
                      provider = the frontend provider uses {myFrontendProviderIndex == 0 ? "MAINNET" : "TESTNET"
                      }
                      <br />
                      isConnected={isConnected ? "Yes" : "No"}

                    </p>
                  </Box>
                  {!!providerFromContext &&
                    <InteractContract ></InteractContract>}
                </Tabs.Content>
                <Tabs.Content value="walletAPI">
                  <p></p>
                  <WalletApiTag></WalletApiTag>
                </Tabs.Content>
                <Tabs.Content value="walletAccount">
                  <WalletAccountTag></WalletAccountTag>
                </Tabs.Content>
                <Tabs.Content value="walletAccountV6">
                  <WalletAccountV6Tag></WalletAccountV6Tag>
                </Tabs.Content>
              </Tabs.Root>
            </>
          )
          }
        </div>
        <LowerBanner></LowerBanner>
      </div >
    </Provider >
  )
}


