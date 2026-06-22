Ready ID 0x01d7058090fe47353fac3703a3000a74395883f3602a799fb05000e77f65d93b
XVerse ID 0x5d96b2697e1d46f19a506f3225aad1ae84e21e3b720ee7902dd64ac275086b9

|                    Function |             Ready             |       XVerse        |
| --------------------------: | :---------------------------: | :-----------------: |
|       **STRK20 in Testnet** |               ❌               |          ❌          |
|                 **BALANCE** |                               |                     |
|                        list |               ✅               |          ✅          |
|                         all |               ✅               |          ✅          |
|                 **DEPOSIT** |                               |                     |
|     prepara_invoke/simulate |               ✅               |          ❌          |
| prepara_invoke/ no simulate |               ✅               |          ❌          |
|                      submit |               ✅               |          ✅          |
|                **WITHDRAW** |                               |                     |
|     prepara_invoke/simulate |               ✅               |          ❌          |
| prepara_invoke/ no simulate |               ✅               |          ❌          |
|                      submit |               ✅               |          ✅          |
|                **TRANSFER** |                               |                     |
|     prepara_invoke/simulate |               ✅               |          ❌          |
| prepara_invoke/ no simulate |               ✅               |          ❌          |
|                      submit |               ✅               |          ✅          |
|           **TRANSFER OPEN** |                               |                     |
|     prepara_invoke/simulate |               ✅               |          ❌          |
| prepara_invoke/ no simulate |               ✅               |          ❌          |
|                      submit |          ❌ Error 156          | ❌ Insufficient STRK |
|                  **INVOKE** |          not tested           |     not tested      |
|            **Multi action** |                               |                     |
|        (with OPEN transfer) | ❌ not enough fund to pay fees | ❌ Insufficient STRK |
