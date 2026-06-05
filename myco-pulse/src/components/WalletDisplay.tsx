import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { MATRIX_MINT } from '../services/jupiterSwap';
import { Coins, Wallet, Globe, Shield } from 'lucide-react';

export const WalletDisplay = () => {
    const { publicKey } = useWallet();
    const { connection } = useConnection();
    const [solBalance, setSolBalance] = useState<number | null>(null);
    const [mycoBalance, setMycoBalance] = useState<number | null>(null);

    const fetchBalances = async () => {
        if (!publicKey) return;
        
        try {
            // SOL Balance
            const balance = await connection.getBalance(publicKey);
            setSolBalance(balance / LAMPORTS_PER_SOL);

            // MYCO Balance (Token Balance)
            try {
                const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                    mint: new PublicKey(MATRIX_MINT)
                });
                
                if (tokenAccounts.value.length > 0) {
                    const amount = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
                    setMycoBalance(amount);
                } else {
                    setMycoBalance(0);
                }
            } catch (err) {
                // Usually happens if no token account exists or on devnet where mint doesn't exist
                setMycoBalance(0);
            }
        } catch (e) {
            console.error("Error fetching balances", e);
        }
    };

    useEffect(() => {
        fetchBalances();
        const id = setInterval(fetchBalances, 20000);
        return () => clearInterval(id);
    }, [publicKey, connection]);

    return (
        <div className="flex items-center gap-6 glass-bento p-2 px-4 border-white/10 bg-white/[0.02]">
            {publicKey ? (
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="size-1.5 bg-myco-accent rounded-full animate-pulse" />
                            <span className="text-[9px] font-black text-dim uppercase tracking-widest">Active Terminal</span>
                        </div>
                        <span className="text-[11px] font-mono text-white font-bold bg-white/5 px-2 py-0.5 border border-white/10">
                            {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                        </span>
                    </div>

                    <div className="h-8 w-px bg-white/10" />

                    <div className="flex gap-6">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-dim uppercase tracking-tighter mb-1">Portfolio SOL</span>
                            <div className="flex items-center gap-1.5">
                                <Globe className="size-3 text-white opacity-50" />
                                <span className="text-[12px] font-black text-white">{solBalance !== null ? solBalance.toFixed(3) : '---'}</span>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-dim uppercase tracking-tighter mb-1">Network MYCO</span>
                            <div className="flex items-center gap-1.5">
                                <Coins className="size-3 text-myco-accent" />
                                <span className="text-[12px] font-black text-myco-accent uppercase">
                                    {mycoBalance !== null ? mycoBalance.toLocaleString() : '---'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <Shield className="size-4 text-dim animate-pulse" />
                    <span className="text-[10px] font-black text-dim uppercase tracking-widest italic">Terminal Offline - Authorization Required</span>
                </div>
            )}

            <div className="ml-2">
                <WalletMultiButton className="!bg-myco-accent !text-black !font-black !rounded-none !h-9 !px-6 !text-[10px] !uppercase !tracking-[0.2em] hover:!bg-white !transition-all shadow-[0_0_15px_rgba(30,255,188,0.2)]" />
            </div>
        </div>
    );
};
