import {
  Connection,
  Keypair,
  PublicKey,
  Signer,
  Transaction,
  sendAndConfirmTransaction,
  SYSVAR_CLOCK_PUBKEY
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { QrngClientOptions, QrngInstructionType } from './types';

/**
 * Simple error class for QRNG operations
 */
export class QrngError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QrngError';
  }
}

/**
 * Client for interacting with the TSOTCHKE QRNG service
 */
export class QrngClient {
  // Default Program ID on Solana mainnet
  private static readonly DEFAULT_PROGRAM_ID = new PublicKey('F7E268Uek6YJvYCNaeamnxLy1umzPPTfrK2TiATxffQg');
  
  // Default token mint on Solana mainnet
  private static readonly DEFAULT_TOKEN_MINT = new PublicKey('4mbdysBik3jmzD7mt6FGPDsMxnYcxExSQRFjPucdpump');
  
  // Default treasury address on Solana mainnet
  private static readonly DEFAULT_TREASURY_ADDRESS = new PublicKey('3vuKcjqows8T19z7amN2XMkSdVcicqBuf5vVa8ZjaVfc');
  
  // Program ID for the QRNG service
  private readonly programId: PublicKey;
  
  // Token mint address for TSOTCHKE
  private readonly tokenMint: PublicKey;
  
  // Treasury address to receive token payments
  private readonly treasuryAddress: PublicKey;
  
  // Connection to the Solana cluster
  private readonly connection: Connection;
  
  // Config PDA for the program
  private readonly configPda: PublicKey;
  
  /**
   * Create a new QrngClient
   * 
   * @param connection - Connection to a Solana cluster
   * @param options - Optional configuration
   */
  constructor(connection: Connection, options: QrngClientOptions = {}) {
    this.connection = connection;
    this.programId = options.programId || QrngClient.DEFAULT_PROGRAM_ID;
    this.tokenMint = options.tokenMint || QrngClient.DEFAULT_TOKEN_MINT;
    this.treasuryAddress = options.treasuryAddress || QrngClient.DEFAULT_TREASURY_ADDRESS;
    
    // Derive config PDA
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('token_qrng_config')],
      this.programId
    );
    this.configPda = configPda;
  }
  
  /**
   * Generate a random 64-bit unsigned integer
   * 
   * @param wallet - Wallet to pay for the random number generation
   * @returns A promise that resolves to the random u64 value decoded from Base64 encoded Hex data
   */
  async generateRandomU64(wallet: Keypair | Signer): Promise<bigint> {
    const result = await this.generateRandom(
      wallet,
      QrngInstructionType.GENERATE_RANDOM_U64
    );
    
    if (result.length < 8) {
      throw new QrngError('Invalid return data from QRNG service');
    }
    
    return result.readBigUInt64LE(0);
  }
  
  /**
   * Generate a random double between 0 and 1
   * 
   * @param wallet - Wallet to pay for the random number generation
   * @returns A promise that resolves to the random double value decoded from Base64 encoded Hex data
   */
  async generateRandomDouble(wallet: Keypair | Signer): Promise<number> {
    const result = await this.generateRandom(
      wallet,
      QrngInstructionType.GENERATE_RANDOM_DOUBLE
    );
    
    if (result.length < 8) {
      throw new QrngError('Invalid return data from QRNG service');
    }
    
    return result.readDoubleLE(0);
  }
  
  /**
   * Generate a random boolean
   * 
   * @param wallet - Wallet to pay for the random number generation
   * @returns A promise that resolves to the random boolean value decoded from Base64 encoded Hex data
   */
  async generateRandomBoolean(wallet: Keypair | Signer): Promise<boolean> {
    const result = await this.generateRandom(
      wallet,
      QrngInstructionType.GENERATE_RANDOM_BOOLEAN
    );
    
    if (result.length < 1) {
      throw new QrngError('Invalid return data from QRNG service');
    }
    
    return result[0] === 1;
  }
  
  /**
   * Get the TSOTCHKE token balance for a wallet
   * 
   * @param walletPublicKey - Public key of the wallet to check
   * @returns A promise that resolves to the token balance as a number
   */
  async getTokenBalance(walletPublicKey: PublicKey): Promise<number> {
    try {
      // Find the associated token account
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        { publicKey: walletPublicKey } as Signer,
        this.tokenMint,
        walletPublicKey,
        true
      );
      
      // Get the token balance
      const balance = await this.connection.getTokenAccountBalance(tokenAccount.address);
      
      // Return the UI amount (decimal representation)
      return balance.value.uiAmount || 0;
    } catch (error) {
      // If the token account doesn't exist, return 0
      return 0;
    }
  }
  
  /**
   * Generate a random number using the specified instruction type
   * 
   * @param wallet - Wallet to pay for the random number generation
   * @param instructionType - The type of random number to generate
   * @returns A promise that resolves to the raw buffer containing decoded Base64 data from the Solana program
   */
  private async generateRandom(
    wallet: Keypair | Signer,
    instructionType: QrngInstructionType
  ): Promise<Buffer> {
    try {
      // Get the wallet's public key
      const walletPublicKey = wallet.publicKey;
      
      // Get the wallet's token account
      const userTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        wallet as Signer,
        this.tokenMint,
        walletPublicKey
      );
      
      // Get the treasury's token account
      const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
        this.connection,
        wallet as Signer,
        this.tokenMint,
        this.treasuryAddress,
        true
      );
      
      // Check if the user has enough tokens
      const userTokenBalance = await this.connection.getTokenAccountBalance(userTokenAccount.address);
      const balance = userTokenBalance.value.uiAmount || 0;
      
      if (balance < 1.0) {
        throw new QrngError(
          `Insufficient TSOTCHKE tokens. You have ${balance} but need at least 1.0.`
        );
      }
      
      // Create the instruction data
      const instructionData = Buffer.from([instructionType]);
      
      // Create a transaction
      const transaction = new Transaction();
      
      // Add the main instruction
      transaction.add({
        keys: [
          { pubkey: walletPublicKey, isSigner: true, isWritable: true },
          { pubkey: userTokenAccount.address, isSigner: false, isWritable: true },
          { pubkey: treasuryTokenAccount.address, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: this.configPda, isSigner: false, isWritable: false },
          { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false }
        ],
        programId: this.programId,
        data: instructionData
      });
      
      // Send the transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [wallet as Signer],
        { commitment: 'confirmed' }
      );
      
      // Get the transaction result
      const txInfo = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      
      // Extract the return data
      const meta = txInfo?.meta as any;
      if (!meta || !meta.returnData || !meta.returnData.data) {
        throw new QrngError('No return data found in transaction');
      }
      
      // Decode the Base64 encoded Hex data returned by the program
      // The program returns randomness as Base64 encoded data that must be decoded
      // before it can be interpreted as the appropriate data type (U64, Double, or Boolean)
      return Buffer.from(meta.returnData.data, 'base64');
    } catch (error: any) {
      // Handle and wrap errors
      if (error instanceof QrngError) {
        throw error;
      }
      
      throw new QrngError(`Error generating random number: ${error.message || error}`);
    }
  }
}
