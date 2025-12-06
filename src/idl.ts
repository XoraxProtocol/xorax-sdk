import { Idl } from "@coral-xyz/anchor";

export const XORAX_IDL: Idl = {
  address: "JJWGp5cinhhupX8LNm6oThsuzdt3esnJZZLYTosqMEm",
  metadata: {
    name: "xorax",
    version: "0.1.0",
    spec: "0.1.0",
    description: "Created with Anchor",
  },
  instructions: [
    {
      name: "deposit",
      docs: ["Deposit any amount into the mixer with a commitment"],
      discriminator: [242, 35, 198, 137, 82, 225, 242, 182],
      accounts: [
        {
          name: "deposit_record",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [100, 101, 112, 111, 115, 105, 116],
              },
              {
                kind: "arg",
                path: "commitment",
              },
            ],
          },
        },
        {
          name: "depositor",
          writable: true,
          signer: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "commitment",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "amount",
          type: "u64",
        },
        {
          name: "withdrawal_delay",
          type: "i64",
        },
      ],
    },
    {
      name: "withdraw",
      docs: ["Withdraw funds using nullifier proof"],
      discriminator: [183, 18, 70, 156, 148, 109, 161, 34],
      accounts: [
        {
          name: "deposit_record",
          writable: true,
        },
        {
          name: "nullifier_record",
          writable: true,
          pda: {
            seeds: [
              {
                kind: "const",
                value: [110, 117, 108, 108, 105, 102, 105, 101, 114],
              },
              {
                kind: "arg",
                path: "nullifier",
              },
            ],
          },
        },
        {
          name: "recipient",
          writable: true,
        },
        {
          name: "relayer",
          writable: true,
          signer: true,
        },
        {
          name: "system_program",
          address: "11111111111111111111111111111111",
        },
      ],
      args: [
        {
          name: "secret",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "nullifier",
          type: {
            array: ["u8", 32],
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: "DepositRecord",
      discriminator: [164, 239, 130, 196, 198, 159, 73, 4],
    },
    {
      name: "NullifierRecord",
      discriminator: [220, 171, 248, 26, 97, 196, 91, 189],
    },
  ],
  types: [
    {
      name: "DepositRecord",
      type: {
        kind: "struct",
        fields: [
          {
            name: "commitment",
            type: {
              array: ["u8", 32],
            },
          },
          {
            name: "amount",
            type: "u64",
          },
          {
            name: "timestamp",
            type: "i64",
          },
          {
            name: "withdrawal_delay",
            type: "i64",
          },
          {
            name: "withdrawn",
            type: "bool",
          },
        ],
      },
    },
    {
      name: "NullifierRecord",
      type: {
        kind: "struct",
        fields: [
          {
            name: "nullifier",
            type: {
              array: ["u8", 32],
            },
          },
          {
            name: "used",
            type: "bool",
          },
        ],
      },
    },
  ],
} as const;

export type XoraxProgram = typeof XORAX_IDL;
