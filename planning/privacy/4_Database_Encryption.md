# Database Encryption Specification

## 1. Section Reference & Alignment

This architectural design document aligns directly with **Section 4 ("Database Encryption / Encryption at Rest")** of the `privacy_high_level.md` guide. Its primary objective is to implement transparent application-level field encryption for sensitive financial PII (e.g., bank account numbers, IBANs). This ensures data is encrypted before database persist operations (`INSERT`/`UPDATE`) and decrypted strictly on-demand during backend service retrieval (`SELECT`). 

The architecture is tailored to the existing project constraints: utilizing Vanilla HTML/JS on the frontend, lightweight components, and a secure backend service layer leveraging Node's native cryptographic capabilities.

## 2. Core Requirements & Architectural Design

### Encryption Boundary
The encryption boundary is established immediately after the application backend receives a payload and successfully validates it, but strictly before it reaches the database storage layer. This ensures that the database only ever receives, stores, and interacts with ciphertext. Plaintext financial PII never rests in the database, on disk, or in system logs.

### Cryptographic Mechanics
The system utilizes **AES-256-GCM** (Advanced Encryption Standard with Galois/Counter Mode) via Node's native `crypto` module. This provides authenticated encryption, guaranteeing both confidentiality and data integrity:
- **Algorithm**: AES-256-GCM.
- **Initialization Vector (IV)**: A unique, cryptographically secure 12-byte (96-bit) random IV is generated for every encryption operation.
- **Authentication Tag**: GCM produces a 16-byte authentication tag that is appended and stored alongside the ciphertext. During decryption, this tag is verified to ensure the ciphertext has not been tampered with.
- **Storage Format**: The database field will store a composite payload encompassing the IV, the Auth Tag, and the Ciphertext (e.g., `iv:auth_tag:ciphertext`, separated by a delimiter or combined as a single base64 string).

### On-Demand Decryption Logic
Decryption occurs exclusively inside the secure backend API pipeline immediately prior to returning the payload. When an authorized client makes a request, the backend retrieves the composite encrypted string from the database, extracts the IV and Authentication Tag, and decrypts the payload on-the-fly. The plaintext is held in memory solely for the duration of the request processing and is instantly returned to the authorized client.

### Key Management Lifecycle
- **Master Key**: A 256-bit symmetric encryption key is maintained as a highly secure environment secret.
- **Injection**: The key is injected securely into the Node.js backend environment at runtime via environment variables.
- **Isolation**: The key never leaves the backend execution environment and is strictly isolated from client-side dynamic configurations or static frontend files.

## 3. Integration & Flow Guidelines

### Data Persistence Flow (Write)
1. **Payload Arrival**: The backend API receives a request containing sensitive financial PII from the Vanilla HTML/JS client.
2. **Validation**: The backend validates the input format and verifies authorization.
3. **Application-Level Encryption**: 
   - A unique IV is generated.
   - The plaintext is encrypted using the injected AES-256 Master Key and the IV.
   - The Authentication Tag is produced.
4. **Data Transformation**: The IV, Auth Tag, and Ciphertext are concatenated into a designated storage string format.
5. **Database Storage**: The backend executes the `INSERT` or `UPDATE` operation, safely storing the encrypted payload into the database.

### Data Retrieval Flow (Read)
1. **Client Request**: An authorized client requests the payment details.
2. **Database Lookup**: The backend executes a `SELECT` query to retrieve the encrypted composite string.
3. **Deconstruction**: The string is parsed into its constituent parts: IV, Auth Tag, and Ciphertext.
4. **Decryption Validation & Tag Check**: 
   - The decryption process uses the Master Key and IV to attempt to decrypt the ciphertext.
   - The Auth Tag is checked simultaneously. If the tag is invalid (indicating tampering or corruption), the operation throws an error and fails securely, preventing tampered data from being exposed.
5. **Payload Response Generation**: Upon successful decryption and authentication, the decrypted plaintext is securely formatted into a JSON response and dispatched to the client over a TLS-encrypted connection.

### Key Management Guidelines
- **Environment Secret Injection**: Utilize secure secret managers (e.g., AWS Secrets Manager, GitHub Secrets, Vercel Environment Variables) to inject the encryption key at deployment. It must never be committed to source control.
- **Key Rotation Strategies**: Implement a versioned key structure (e.g., prepending the stored string with a key ID, such as `v1:iv:tag:cipher`). This allows the system to determine which key to use for decryption, facilitating seamless key rotation without immediate mass-decryption and re-encryption.
- **Strict Isolation**: Keys must never be baked into container images, omitted from all application monitoring/logging tools, and isolated from the client-side Vanilla HTML/JS configurations.

## 4. Why This Solution is Ideal

### Security Vulnerabilities Mitigated
- **Plain-text Exposure**: Unauthorized database dumps or raw exports will yield only scrambled, mathematically secure ciphertext, rendering the data useless to malicious actors.
- **SQL Injection Impact**: If an attacker exploits an application vulnerability to execute arbitrary read queries, the extracted financial data remains unreadable because the attacker lacks the runtime environment's Master Key.
- **Compromised Database Backups**: Backups stored on local drives, S3 buckets, or external vendor servers remain secure. The encryption key is decoupled from the storage layer, effectively neutralizing the threat of backup theft.

### Step-by-Step Defense Mechanics
1. **In Transit (Client to Backend)**: Protected by standard TLS/HTTPS.
2. **In Transit (Backend to Database)**: Data is already encrypted application-side before transmission to the database, adding an extra layer of defense against interception on the internal network or cloud VPC.
3. **At Rest (Database Storage)**: The data rests fully encrypted and authenticated via AES-256-GCM.
4. **Isolation Defense**: The strict separation of the database storage from the cryptographic key environment ensures that compromising the database does not compromise the data.

### Trade-off Justification
Application-level encryption via Node's native `crypto` module is the optimal choice for this lightweight architecture. It eliminates the latency, cost, and overhead associated with heavy external Key Management Services (KMS) for individual encrypt/decrypt operations. Furthermore, it avoids the necessity for complex database-level extensions (such as TDE or pgcrypto). This approach ensures the solution remains highly portable, exceptionally fast, and perfectly aligned with a lean, Config-Driven UI pattern supported by Vanilla HTML/JS and a secure Node backend.
