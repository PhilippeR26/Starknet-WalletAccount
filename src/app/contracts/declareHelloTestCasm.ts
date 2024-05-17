import { CairoAssembly, hash } from "starknet";

getHelloTestCasm
export function getHelloTestCasm(idx: number): CairoAssembly {
  const selector = hash.getSelector("get_name" + idx.toString().padStart(4, "0"));
  return {
    "prime": "0x800000000000011000000000000000000000000000000000000000000000001",
    "compiler_version": "2.6.0",
    "bytecode": [
      "0xa0680017fff8000",
      "0x7",
      "0x482680017ffa8000",
      "0x100000000000000000000000000000000",
      "0x400280007ff97fff",
      "0x10780017fff7fff",
      "0x95",
      "0x4825800180007ffa",
      "0x0",
      "0x400280007ff97fff",
      "0x482680017ff98000",
      "0x1",
      "0x48297ffc80007ffd",
      "0x20680017fff7fff",
      "0x4",
      "0x10780017fff7fff",
      "0xa",
      "0x482680017ffc8000",
      "0x1",
      "0x480a7ffd7fff8000",
      "0x480680017fff8000",
      "0x0",
      "0x480280007ffc8000",
      "0x10780017fff7fff",
      "0x8",
      "0x480a7ffc7fff8000",
      "0x480a7ffd7fff8000",
      "0x480680017fff8000",
      "0x1",
      "0x480680017fff8000",
      "0x0",
      "0x20680017fff7ffe",
      "0x6d",
      "0x48307ffc80007ffd",
      "0x20680017fff7fff",
      "0x4",
      "0x10780017fff7fff",
      "0x10",
      "0x40780017fff7fff",
      "0x1",
      "0x480680017fff8000",
      "0x496e70757420746f6f206c6f6e6720666f7220617267756d656e7473",
      "0x400080007ffe7fff",
      "0x48127ff77fff8000",
      "0x48127ff57fff8000",
      "0x480a7ffb7fff8000",
      "0x480680017fff8000",
      "0x1",
      "0x48127ffa7fff8000",
      "0x482480017ff98000",
      "0x1",
      "0x208b7fff7fff7ffe",
      "0x1104800180018000",
      "0xe9",
      "0x482480017fff8000",
      "0xe8",
      "0x480080007fff8000",
      "0xa0680017fff8000",
      "0x9",
      "0x4824800180007ff3",
      "0x11bc",
      "0x482480017fff8000",
      "0x100000000000000000000000000000000",
      "0x400080007ff27fff",
      "0x10780017fff7fff",
      "0x3d",
      "0x4824800180007ff3",
      "0x11bc",
      "0x400080007ff37fff",
      "0x482480017ff38000",
      "0x1",
      "0x20680017fff7ff7",
      "0x10",
      "0x40780017fff7fff",
      "0x2",
      "0x40780017fff7fff",
      "0x1",
      "0x480680017fff8000",
      "0x456e7465722061206e616d65",
      "0x400080007ffe7fff",
      "0x48127ffa7fff8000",
      "0x480a7ffb7fff8000",
      "0x48127ffc7fff8000",
      "0x482480017ffb8000",
      "0x1",
      "0x10780017fff7fff",
      "0x20",
      "0x480680017fff8000",
      "0x0",
      "0x480680017fff8000",
      "0x361458367e696363fbcc70777d07ebbd2394e89fd0adcaf147faccd1d294d60",
      "0x480680017fff8000",
      "0x53746f726167655772697465",
      "0x400280007ffb7fff",
      "0x400280017ffb7ffb",
      "0x400280027ffb7ffd",
      "0x400280037ffb7ffe",
      "0x400280047ffb7ff4",
      "0x480280067ffb8000",
      "0x20680017fff7fff",
      "0xd",
      "0x40780017fff7fff",
      "0x1",
      "0x48127ffa7fff8000",
      "0x480280057ffb8000",
      "0x482680017ffb8000",
      "0x7",
      "0x480680017fff8000",
      "0x0",
      "0x48127ffb7fff8000",
      "0x48127ffa7fff8000",
      "0x208b7fff7fff7ffe",
      "0x480280057ffb8000",
      "0x482680017ffb8000",
      "0x9",
      "0x480280077ffb8000",
      "0x480280087ffb8000",
      "0x48127ff77fff8000",
      "0x48127ffb7fff8000",
      "0x48127ffb7fff8000",
      "0x480680017fff8000",
      "0x1",
      "0x48127ffa7fff8000",
      "0x48127ffa7fff8000",
      "0x208b7fff7fff7ffe",
      "0x40780017fff7fff",
      "0x1",
      "0x480680017fff8000",
      "0x4f7574206f6620676173",
      "0x400080007ffe7fff",
      "0x482480017ff08000",
      "0x1",
      "0x48127fee7fff8000",
      "0x480a7ffb7fff8000",
      "0x480680017fff8000",
      "0x1",
      "0x48127ffa7fff8000",
      "0x482480017ff98000",
      "0x1",
      "0x208b7fff7fff7ffe",
      "0x40780017fff7fff",
      "0x1",
      "0x480680017fff8000",
      "0x4661696c656420746f20646573657269616c697a6520706172616d202331",
      "0x400080007ffe7fff",
      "0x48127ff87fff8000",
      "0x48127ff67fff8000",
      "0x480a7ffb7fff8000",
      "0x480680017fff8000",
      "0x1",
      "0x48127ffa7fff8000",
      "0x482480017ff98000",
      "0x1",
      "0x208b7fff7fff7ffe",
      "0x40780017fff7fff",
      "0x1",
      "0x480680017fff8000",
      "0x4f7574206f6620676173",
      "0x400080007ffe7fff",
      "0x482680017ff98000",
      "0x1",
      "0x480a7ffa7fff8000",
      "0x480a7ffb7fff8000",
      "0x480680017fff8000",
      "0x1",
      "0x48127ffa7fff8000",
      "0x482480017ff98000",
      "0x1",
      "0x208b7fff7fff7ffe",
      "0xa0680017fff8000",
      "0x7",
      "0x482680017ffa8000",
      "0x100000000000000000000000000000000",
      "0x400280007ff97fff",
      "0x10780017fff7fff",
      "0x60",
      "0x4825800180007ffa",
      "0x0",
      "0x400280007ff97fff",
      "0x482680017ff98000",
      "0x1",
      "0x48297ffc80007ffd",
      "0x20680017fff7fff",
      "0x4",
      "0x10780017fff7fff",
      "0x10",
      "0x40780017fff7fff",
      "0x1",
      "0x480680017fff8000",
      "0x496e70757420746f6f206c6f6e6720666f7220617267756d656e7473",
      "0x400080007ffe7fff",
      "0x48127ffc7fff8000",
      "0x48127ffa7fff8000",
      "0x480a7ffb7fff8000",
      "0x480680017fff8000",
      "0x1",
      "0x48127ffa7fff8000",
      "0x482480017ff98000",
      "0x1",
      "0x208b7fff7fff7ffe",
      "0x1104800180018000",
      "0x55",
      "0x482480017fff8000",
      "0x54",
      "0x480080007fff8000",
      "0xa0680017fff8000",
      "0x9",
      "0x4824800180007ff8",
      "0xd70",
      "0x482480017fff8000",
      "0x100000000000000000000000000000000",
      "0x400080007ff77fff",
      "0x10780017fff7fff",
      "0x2b",
      "0x4824800180007ff8",
      "0xd70",
      "0x400080007ff87fff",
      "0x480680017fff8000",
      "0x0",
      "0x480680017fff8000",
      "0x361458367e696363fbcc70777d07ebbd2394e89fd0adcaf147faccd1d294d60",
      "0x482480017ff68000",
      "0x1",
      "0x480680017fff8000",
      "0x53746f7261676552656164",
      "0x400280007ffb7fff",
      "0x400280017ffb7ffb",
      "0x400280027ffb7ffc",
      "0x400280037ffb7ffd",
      "0x480280057ffb8000",
      "0x20680017fff7fff",
      "0x10",
      "0x40780017fff7fff",
      "0x1",
      "0x480280067ffb8000",
      "0x400080007ffe7fff",
      "0x48127ffb7fff8000",
      "0x480280047ffb8000",
      "0x482680017ffb8000",
      "0x7",
      "0x480680017fff8000",
      "0x0",
      "0x48127ffa7fff8000",
      "0x482480017ff98000",
      "0x1",
      "0x208b7fff7fff7ffe",
      "0x48127ffd7fff8000",
      "0x480280047ffb8000",
      "0x482680017ffb8000",
      "0x8",
      "0x480680017fff8000",
      "0x1",
      "0x480280067ffb8000",
      "0x480280077ffb8000",
      "0x208b7fff7fff7ffe",
      "0x40780017fff7fff",
      "0x1",
      "0x480680017fff8000",
      "0x4f7574206f6620676173",
      "0x400080007ffe7fff",
      "0x482480017ff58000",
      "0x1",
      "0x48127ff37fff8000",
      "0x480a7ffb7fff8000",
      "0x480680017fff8000",
      "0x1",
      "0x48127ffa7fff8000",
      "0x482480017ff98000",
      "0x1",
      "0x208b7fff7fff7ffe",
      "0x40780017fff7fff",
      "0x1",
      "0x480680017fff8000",
      "0x4f7574206f6620676173",
      "0x400080007ffe7fff",
      "0x482680017ff98000",
      "0x1",
      "0x480a7ffa7fff8000",
      "0x480a7ffb7fff8000",
      "0x480680017fff8000",
      "0x1",
      "0x48127ffa7fff8000",
      "0x482480017ff98000",
      "0x1",
      "0x208b7fff7fff7ffe"
    ],
    "bytecode_segment_lengths": [
      169,
      116
    ],
    "hints": [
      [
        0,
        [
          {
            "TestLessThanOrEqual": {
              "lhs": {
                "Immediate": "0x0"
              },
              "rhs": {
                "Deref": {
                  "register": "FP",
                  "offset": -6
                }
              },
              "dst": {
                "register": "AP",
                "offset": 0
              }
            }
          }
        ]
      ],
      [
        38,
        [
          {
            "AllocSegment": {
              "dst": {
                "register": "AP",
                "offset": 0
              }
            }
          }
        ]
      ],
      [
        57,
        [
          {
            "TestLessThanOrEqual": {
              "lhs": {
                "Immediate": "0x11bc"
              },
              "rhs": {
                "Deref": {
                  "register": "AP",
                  "offset": -12
                }
              },
              "dst": {
                "register": "AP",
                "offset": 0
              }
            }
          }
        ]
      ],
      [
        75,
        [
          {
            "AllocSegment": {
              "dst": {
                "register": "AP",
                "offset": 0
              }
            }
          }
        ]
      ],
      [
        98,
        [
          {
            "SystemCall": {
              "system": {
                "Deref": {
                  "register": "FP",
                  "offset": -5
                }
              }
            }
          }
        ]
      ],
      [
        101,
        [
          {
            "AllocSegment": {
              "dst": {
                "register": "AP",
                "offset": 0
              }
            }
          }
        ]
      ],
      [
        125,
        [
          {
            "AllocSegment": {
              "dst": {
                "register": "AP",
                "offset": 0
              }
            }
          }
        ]
      ],
      [
        140,
        [
          {
            "AllocSegment": {
              "dst": {
                "register": "AP",
                "offset": 0
              }
            }
          }
        ]
      ],
      [
        154,
        [
          {
            "AllocSegment": {
              "dst": {
                "register": "AP",
                "offset": 0
              }
            }
          }
        ]
      ],
      [
        169,
        [
          {
            "TestLessThanOrEqual": {
              "lhs": {
                "Immediate": "0x0"
              },
              "rhs": {
                "Deref": {
                  "register": "FP",
                  "offset": -6
                }
              },
              "dst": {
                "register": "AP",
                "offset": 0
              }
            }
          }
        ]
      ],
      [
        186,
        [
          {
            "AllocSegment": {
              "dst": {
                "register": "AP",
                "offset": 0
              }
            }
          }
        ]
      ],
      [
        205,
        [
          {
            "TestLessThanOrEqual": {
              "lhs": {
                "Immediate": "0xd70"
              },
              "rhs": {
                "Deref": {
                  "register": "AP",
                  "offset": -7
                }
              },
              "dst": {
                "register": "AP",
                "offset": 0
              }
            }
          }
        ]
      ],
      [
        229,
        [
          {
            "SystemCall": {
              "system": {
                "Deref": {
                  "register": "FP",
                  "offset": -5
                }
              }
            }
          }
        ]
      ],
      [
        232,
        [
          {
            "AllocSegment": {
              "dst": {
                "register": "AP",
                "offset": 0
              }
            }
          }
        ]
      ],
      [
        255,
        [
          {
            "AllocSegment": {
              "dst": {
                "register": "AP",
                "offset": 0
              }
            }
          }
        ]
      ],
      [
        270,
        [
          {
            "AllocSegment": {
              "dst": {
                "register": "AP",
                "offset": 0
              }
            }
          }
        ]
      ]
    ],
    "entry_points_by_type": {
      "EXTERNAL": [
        {
          "selector": "0xf61980aeb34c9c7f823d576c10d00648fdab6c03a59b539ed0824be31da466",
          "offset": 0,
          "builtins": [
            "range_check"
          ]
        },
        {
          "selector": selector,
          "offset": 169,
          "builtins": [
            "range_check"
          ]
        }
      ],
      "L1_HANDLER": [],
      "CONSTRUCTOR": []
    }
  }
}