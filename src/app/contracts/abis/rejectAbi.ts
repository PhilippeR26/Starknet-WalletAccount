export const rejectAbi= [
  {
    "type": "impl",
    "name": "TestReject",
    "interface_name": "reject::reject::ITestReject"
  },
  {
    "type": "interface",
    "name": "reject::reject::ITestReject",
    "items": [
      {
        "type": "function",
        "name": "test_fail",
        "inputs": [
          {
            "name": "p1",
            "type": "core::integer::u8"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "get_counter",
        "inputs": [],
        "outputs": [
          {
            "type": "core::integer::u8"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "get_nonce",
        "inputs": [],
        "outputs": [
          {
            "type": "core::felt252"
          }
        ],
        "state_mutability": "view"
      },
      {
        "type": "function",
        "name": "init_count",
        "inputs": [
          {
            "name": "p1",
            "type": "core::integer::u8"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "process_nonce",
        "inputs": [],
        "outputs": [],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": []
  },
  {
    "type": "event",
    "name": "reject::reject::MyTestReject::Event",
    "kind": "enum",
    "variants": []
  }
]