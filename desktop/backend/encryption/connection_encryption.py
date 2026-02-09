"""
Connection String Encryption
Connection strings are encrypted with Fernet before storage in SQLite database
"""
from cryptography.fernet import Fernet
import base64
import hashlib
import os

class ConnectionEncryption:
    """Double encryption for sensitive connection strings"""
    
    def __init__(self, master_key: str):
        """
        Initialize with master key
        
        Args:
            master_key: Machine-specific key from EncryptedDB
        """
        # Derive Fernet key from master key
        key_bytes = hashlib.sha256(master_key.encode()).digest()
        self.fernet_key = base64.urlsafe_b64encode(key_bytes)
        self.cipher = Fernet(self.fernet_key)
    
    def encrypt(self, connection_string: str) -> str:
        """
        Encrypt connection string
        
        Args:
            connection_string: Plain text connection string
            
        Returns:
            Encrypted connection string (base64)
        """
        encrypted = self.cipher.encrypt(connection_string.encode())
        return encrypted.decode()
    
    def decrypt(self, encrypted_string: str) -> str:
        """
        Decrypt connection string
        
        Args:
            encrypted_string: Encrypted connection string
            
        Returns:
            Plain text connection string
        """
        decrypted = self.cipher.decrypt(encrypted_string.encode())
        return decrypted.decode()

def get_connection_cipher(master_key: str) -> ConnectionEncryption:
    """Get connection encryption cipher"""
    return ConnectionEncryption(master_key)

