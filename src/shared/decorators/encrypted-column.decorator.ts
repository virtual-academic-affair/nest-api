import { Column, ColumnOptions } from 'typeorm';
import { EncryptionManager } from '../encryption/encryption.service';

export function EncryptedColumn(options: ColumnOptions = {}): PropertyDecorator {
  return Column({
    ...options,
    transformer: {
      to: (value: string) => (value ? EncryptionManager.getService()?.encrypt(value) : value),
      from: (value: string) => (value ? EncryptionManager.getService()?.decrypt(value) : value),
    },
  });
}
