// Shared look for every wallet dialog of this DAPP.
//
// Two defaults worked against readability here. Chakra renders a backdrop only if
// <Dialog.Backdrop /> is present in the tree — no dialog in this DAPP had one, so the
// popup sat straight on the page with nothing behind it. And Dialog.Content keeps the
// default panel background, which is the same near-white as the page gradient, behind a
// `subtle` border : same background, no visible edge.
//
// The fix is one idea — a lifted white sheet over a dimmed page — so the dimming does the
// separating and the border only has to draw the edge.
//
// The surface is pinned to light on purpose. The panels hardcode light colors (gray.200
// surfaces, green.50 / orange.50 callouts, black text), so letting the dialog follow the
// OS color mode would wrap light-mode content in dark-mode chrome.

export const DIALOG_BACKDROP = {
  bg: "blackAlpha.600",
  backdropFilter: "blur(2px)",
} as const;

export const DIALOG_CONTENT = {
  bg: "white",
  color: "black",
  borderWidth: "1px",
  borderColor: "gray.400",
  borderRadius: "lg",
  boxShadow: "2xl",
} as const;

// The body of the STRK20 dialogs scrolls (a running log under a capped height), so these
// two rules mark where the scrollable area starts and ends instead of letting the content
// bleed under the title and the buttons.
export const DIALOG_HEADER = {
  borderBottomWidth: "1px",
  borderColor: "gray.300",
} as const;

export const DIALOG_FOOTER = {
  borderTopWidth: "1px",
  borderColor: "gray.300",
} as const;
