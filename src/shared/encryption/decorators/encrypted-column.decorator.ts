import { Column, ColumnOptions } from 'typeorm';
import { EncryptionManager } from '../encryption.service';

export function EncryptedColumn(options: ColumnOptions = {}): PropertyDecorator {
  return Column({
    ...options,
    transformer: {
      to: (value: string) => EncryptionManager.getService()?.encrypt(value) ?? value,
      from: (value: string) => EncryptionManager.getService()?.decrypt(value) ?? value,
    },
  });
}
