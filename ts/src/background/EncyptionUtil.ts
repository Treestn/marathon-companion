export class EncryptionUtil {

    private static instance:EncryptionUtil;
    private ENCRYPTION_METHOD:string = "AES-GCM"
    private key:CryptoKey;

    private constructor() {

    }

    static getInstance():EncryptionUtil {
        if(!this.instance) {
            this.instance = new EncryptionUtil();
        }
        return this.instance;
    }

    async generateKeyAndStore(): Promise<CryptoKey | null> {
        try {
            // Generate a random key
            this.key = await window.crypto.subtle.generateKey(
                { name: this.ENCRYPTION_METHOD, length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
    
            // Store the key in the browser's Key Storage
            await window.crypto.subtle.exportKey('jwk', this.key).then((exportedKey) => {
                window.crypto.subtle.importKey(
                    'jwk',
                    exportedKey,
                    { name: 'AES-GCM' },
                    true,
                    ['encrypt', 'decrypt']
                );
                console.log('Key stored securely');
            });
            return this.key;
        } catch (error) {
            console.error('Error generating and storing key:', error);
            return null;
        }
    }

    async retrieveKey(): Promise<CryptoKey | null> {
        try {
            // Retrieve the key from the browser's Key Storage
            const keyData = localStorage.getItem('encryptedKey');
            if (!keyData) {
                console.error('Key not found in storage');
                return null;
            }
    
            // Import the key
            const key = await window.crypto.subtle.importKey(
                'jwk',
                JSON.parse(keyData),
                { name: this.ENCRYPTION_METHOD },
                true,
                ['encrypt', 'decrypt']
            );
    
            return key;
        } catch (error) {
            console.error('Error retrieving key:', error);
            return null;
        }
    }
}