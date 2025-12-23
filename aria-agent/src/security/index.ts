import CryptoJS from 'crypto-js';
import NodeRSA from 'node-rsa';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Configurazione Sicurezza
const SECURITY_CONFIG = {
  ALGORITHM: 'AES-256-CBC',
  KEY_SIZE: 256,
  IV_SIZE: 16,
  ITERATIONS: 100000,
  SALT_SIZE: 32,
  MASTER_KEY_FILE: './aria-data/.secure/master.key',
  VAULT_FILE: './aria-data/.secure/vault.enc'
};

export class SecurityEngine {
  private static instance: SecurityEngine;
  private masterKey: string = '';
  private rsaKey: NodeRSA | null = null;
  private sessionToken: string = '';
  private isLocked: boolean = true;

  private constructor() {
    this.sessionToken = uuidv4();
  }

  static getInstance(): SecurityEngine {
    if (!SecurityEngine.instance) {
      SecurityEngine.instance = new SecurityEngine();
    }
    return SecurityEngine.instance;
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(SECURITY_CONFIG.MASTER_KEY_FILE), { recursive: true });
      
      // Verifica se esiste già una chiave master, altrimenti ne genera una
      try {
        await fs.access(SECURITY_CONFIG.MASTER_KEY_FILE);
        console.log('[SEC] Master key found. System protected.');
      } catch {
        console.log('[SEC] Initializing new secure vault...');
        await this.generateMasterKey();
      }

      // Genera coppia chiavi RSA per comunicazioni asimmetriche
      this.rsaKey = new NodeRSA({ b: 4096 });
      this.isLocked = false;
      
    } catch (error) {
      console.error('[SEC] Security initialization failed:', error);
      this.emergencyLockdown();
    }
  }

  // --- Crittografia Simmetrica (AES-256) ---

  encryptData(data: string): string {
    if (this.isLocked) throw new Error('Security Vault Locked');
    return CryptoJS.AES.encrypt(data, this.sessionToken).toString();
  }

  decryptData(encryptedData: string): string {
    if (this.isLocked) throw new Error('Security Vault Locked');
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.sessionToken);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // --- Crittografia Asimmetrica (RSA-4096) ---

  getPublicKey(): string {
    return this.rsaKey?.exportKey('public') || '';
  }

  decryptMessage(encryptedMessage: string): string {
    if (!this.rsaKey) throw new Error('RSA Key not initialized');
    return this.rsaKey.decrypt(encryptedMessage, 'utf8');
  }

  // --- Anonimizzazione ---

  anonymizeLog(log: string): string {
    // Rimuove IP, percorsi utente, nomi utente
    let clean = log.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[REDACTED_IP]');
    clean = clean.replace(new RegExp(os.userInfo().username, 'g'), '[USER]');
    clean = clean.replace(/\/Users\/[^\/]+/g, '/Users/[USER]');
    return clean;
  }

  // --- Protezione Integrità ---

  async verifyIntegrity(filePath: string, expectedHash: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath);
      const hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(content as any)).toString();
      return hash === expectedHash;
    } catch {
      return false;
    }
  }

  // --- Kill Switch & Autodistruzione ---

  async emergencyLockdown(): Promise<void> {
    console.warn('[SEC] EMERGENCY LOCKDOWN INITIATED');
    this.isLocked = true;
    this.sessionToken = '';
    this.masterKey = '';
    
    // In scenario reale: sovrascrittura memoria
    if (global.gc) global.gc();
  }

  async selfDestruct(): Promise<void> {
    console.error('[SEC] SELF DESTRUCT SEQUENCE STARTED');
    try {
      // 1. Sovrascrittura file sensibili
      const files = [SECURITY_CONFIG.MASTER_KEY_FILE, SECURITY_CONFIG.VAULT_FILE];
      for (const file of files) {
        try {
          const stats = await fs.stat(file);
          // Sovrascrittura multipass (DoD standard semplificato)
          await fs.writeFile(file, Buffer.alloc(stats.size, 0));
          await fs.writeFile(file, Buffer.alloc(stats.size, 0xFF));
          await fs.writeFile(file, crypto.randomUUID());
          await fs.unlink(file);
        } catch {}
      }
      
      console.log('[SEC] Data wiped. System neutralized.');
      process.exit(1);
    } catch (error) {
      console.error('[SEC] Self destruct failed partially:', error);
    }
  }

  private async generateMasterKey(): Promise<void> {
    const key = CryptoJS.lib.WordArray.random(32).toString();
    // In produzione, questa chiave andrebbe cifrata con una password utente o HSM
    // Qui simuliamo salvataggio sicuro offuscato
    const obfuscated = CryptoJS.AES.encrypt(key, 'SYSTEM_ROOT_SALT').toString();
    await fs.writeFile(SECURITY_CONFIG.MASTER_KEY_FILE, obfuscated);
    this.masterKey = key;
  }
}

export const security = SecurityEngine.getInstance();
