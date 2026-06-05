import axios from 'axios';

const JUP_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  marketInfos: any[];
}

export const getJupiterQuote = async (
  inputMint: string,
  outputMint: string,
  amount: number,
  slippage: number = 0.5
) => {
  try {
    const res = await axios.get(JUP_QUOTE_API, {
      params: {
        inputMint,
        outputMint,
        amount: amount * 1e9, // Assuming 9 decimals for SOL/USDC for demo
        slippageBps: slippage * 100,
      }
    });
    return res.data;
  } catch (e) {
    console.error("Jupiter Quote Error", e);
    return null;
  }
};

export const MATRIX_MINT = 'EzYEwn4R5tNkNGw4K2a5a58MJFQESdf1r4UJrV7cpUF3'; // Real MYCO token
export const SOL_MINT = 'So11111111111111111111111111111111111111112';

/** On-chain whale index not deployed — returns empty until MAS/MINDEX ledger API exists. */
export const getWhaleActivity = async () => [];
