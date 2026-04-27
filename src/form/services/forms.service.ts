import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Form } from '../entities/form.entity';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class FormsService extends ResourceService<Form> {
  protected searchableColumns = ['documentType'];

  constructor(@InjectRepository(Form) repository: Repository<Form>) {
    super(repository);
  }

  async upsertMany(rows: Array<Partial<Form>>) {
    const normalized = rows
      .map((r) => {
        const documentType = String(r.documentType ?? '').trim();
        const contentLink = String(r.contentLink ?? '').trim();
        const linkDisplayName = r.linkDisplayName ? String(r.linkDisplayName).trim() : null;
        const notes = r.notes ? String(r.notes).trim() : null;
        return { documentType, contentLink, linkDisplayName, notes };
      })
      .filter((r) => r.documentType && r.contentLink);

    if (normalized.length === 0) {
      return { insertedOrUpdated: 0 };
    }

    let count = 0;
    for (const item of normalized) {
      try {
        // Find existing record by the unique combination
        const existing = await this.repository.findOne({
          where: {
            documentType: item.documentType,
            contentLink: item.contentLink,
          },
        });

        if (existing) {
          // Update only the fields that can change
          await this.repository.update(existing.id, {
            linkDisplayName: item.linkDisplayName,
            notes: item.notes,
          });
        } else {
          // Insert new record
          await this.repository.save(this.repository.create(item));
        }
        count++;
      } catch (err) {
        // Silently skip problematic rows during bulk import
      }
    }

    return { insertedOrUpdated: count };
  }
}
