import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { sha256 } from '@noble/hashes/sha2.js';
export type PublicReportKey = { id: string; publicKey: string; createdAt?: string; revokedAt: string | null };
export type SignedBundle = { manifest: Record<string, string | number | null>; signature: string; context: Record<string, unknown>; pdfBase64: string };
export function canonical(value: unknown): string {
 if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
 if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
 if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
 if (typeof value === 'object' && value) return '{' + Object.keys(value).sort().map(k => JSON.stringify(k)+':'+canonical((value as Record<string, unknown>)[k])).join(',') + '}';
 throw Error('Unsupported signed value');
}
export const hash = (bytes: Uint8Array) => Array.from(sha256(bytes), b=>b.toString(16).padStart(2,'0')).join('');
export function fromBase64(value: string) {
 if (typeof value!=='string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length%4) throw Error('Invalid base64 data');
 return Uint8Array.from(atob(value), c=>c.charCodeAt(0));
}
export function verifyBundle(bundle: SignedBundle, keys: PublicReportKey[]) {
 const m=bundle.manifest;
 if (!m || m.schema!=='trustbridge.report.v1' || m.algorithm!=='ML-DSA-65') throw Error('Unsupported report format');
 const key=keys.find(k=>k.id===m.keyId);
 if (!key || key.revokedAt) throw Error('The signing key is unknown or revoked. Refresh trusted keys before relying on this report.');
 const pk=fromBase64(key.publicKey);
 if (hash(pk)!==key.id || pk.length!==ml_dsa65.lengths.publicKey) throw Error('Invalid trusted public key');
 const pdf=fromBase64(bundle.pdfBase64);
 if (pdf.length>5_000_000 || hash(pdf)!==m.pdfSha256 || hash(new TextEncoder().encode(canonical(bundle.context)))!==m.contextSha256) throw Error('Report content was modified or is damaged');
 const sig=fromBase64(bundle.signature);
 if (sig.length!==ml_dsa65.lengths.signature || !ml_dsa65.verify(sig,new TextEncoder().encode(canonical(m)),pk)) throw Error('Report signature is invalid');
 return { pdf, keyId:key.id, issuedAt:String(m.issuedAt), assessmentId:String(m.assessmentId) };
}
