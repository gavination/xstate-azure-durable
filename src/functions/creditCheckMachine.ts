import { createMachine } from "xstate";

export const creditCheckMachine = createMachine(
  {
    context: {
      userSSN: "",
      userEmail: "",
      equifaxScore: 0,
      userLastName: "",
      experianScore: 0,
      userFirstName: "",
      transunionScore: 0,
    },
    id: "homePurchasingFlow",
    initial: "creditCheck",
    states: {
      creditCheck: {
        initial: "Entering Information",
        states: {
          "Entering Information": {
            on: {
              Submit: {
                target: "CheckingCreditScores",
                reenter: false,
              },
            },
          },
          CheckingCreditScores: {
            description:
              "Kick off a series of requests to the 3 American Credit Bureaus and await their results",
            states: {
              CheckingEquifax: {
                invoke: {
                  src: "checkEquifax",
                  id: "invoke-itfak",
                  onDone: [
                    {
                      target: ".FetchingComplete",
                      reenter: false,
                    },
                  ],
                },
                initial: "Idle",
                states: {
                  Idle: {},
                  FetchingComplete: {
                    type: "final",
                  },
                },
              },
              CheckingTransUnion: {
                invoke: {
                  src: "checkTransUnion",
                  id: "invoke-i7z9l",
                  onDone: [
                    {
                      target: ".FetchingComplete",
                      reenter: false,
                    },
                  ],
                },
                initial: "Idle",
                states: {
                  Idle: {},
                  FetchingComplete: {
                    type: "final",
                  },
                },
              },
              CheckingExperian: {
                invoke: {
                  src: "checkExperian",
                  id: "invoke-50w6q",
                  onDone: [
                    {
                      target: ".FetchingComplete",
                      reenter: false,
                    },
                  ],
                },
                initial: "Idle",
                states: {
                  Idle: {},
                  FetchingComplete: {
                    type: "final",
                  },
                },
              },
            },
            type: "parallel",
            onDone: {
              target: "DeterminingInterestRateOptions",
              reenter: false,
            },
          },
          DeterminingInterestRateOptions: {
            description:
              "After retrieving results, determine the mortgage middle score to be used in home loan interest rate decision",
            initial: "DeterminingMiddleScore",
            states: {
              DeterminingMiddleScore: {
                exit: {
                  type: "emailScores",
                },
                invoke: [
                  {
                    src: "mergeScoresToDatamodel",
                    id: "invoke-lu9fl",
                    onDone: [
                      {
                        target: "FetchingRates",
                        reenter: false,
                      },
                    ],
                  },
                  {
                    src: "determineMiddleScore",
                    id: "invoke-bdjlm",
                  },
                ],
              },
              FetchingRates: {
                states: {
                  CheckingPartnerServices: {
                    invoke: {
                      src: "checkPartnerRates",
                      id: "invoke-fnxf4",
                      onDone: [
                        {
                          target: ".FetchingComplete",
                          reenter: false,
                        },
                      ],
                    },
                    initial: "Idle",
                    states: {
                      Idle: {},
                      FetchingComplete: {
                        type: "final",
                      },
                    },
                  },
                  CheckingPartnerBanks: {
                    invoke: {
                      src: "checkBankRates",
                      id: "invoke-v9ljw",
                      onDone: [
                        {
                          target: ".FetchingComplete",
                          reenter: false,
                        },
                      ],
                    },
                    initial: "Idle",
                    states: {
                      Idle: {},
                      FetchingComplete: {
                        type: "final",
                      },
                    },
                  },
                },
                type: "parallel",
                onDone: {
                  target: "RatesProvided",
                  reenter: false,
                },
              },
              RatesProvided: {
                entry: [
                  {
                    type: "emailUser",
                  },
                  {
                    type: "emailSalesTeam",
                  },
                ],
              },
            },
          },
        },
      },
    },
    types: {
      events: {} as { type: "" } | { type: "Submit" },
      context: {} as {
        userSSN: string;
        userEmail: string;
        equifaxScore: number;
        userLastName: string;
        experianScore: number;
        userFirstName: string;
        transunionScore: number;
      },
    },
  },
  {
    actions: {
      emailScores: ({ context, event }) => {},

      emailUser: ({ context, event }) => {},

      emailSalesTeam: ({ context, event }) => {},
    },
    actors: {
      checkEquifax: createMachine({
        /* ... */
      }),

      checkTransUnion: createMachine({
        /* ... */
      }),

      checkExperian: createMachine({
        /* ... */
      }),

      mergeScoresToDatamodel: createMachine({
        /* ... */
      }),

      determineMiddleScore: createMachine({
        /* ... */
      }),

      checkPartnerRates: createMachine({
        /* ... */
      }),

      checkBankRates: createMachine({
        /* ... */
      }),
    },
    guards: {},
    delays: {},
  },
);
