import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceService } from '@shared/resource/services/resource.service';
import { CancelReasonMaster } from '@class-registration/entities/cancel-reason-master.entity';

@Injectable()
export class CancelReasonsService extends ResourceService<CancelReasonMaster> {
  protected repository: Repository<CancelReasonMaster>;

  protected searchableColumns = ['reasonText'];

  protected orderableColumns = ['id', 'createdAt'];

  constructor(
    @InjectRepository(CancelReasonMaster)
    cancelReasonRepository: Repository<CancelReasonMaster>
  ) {
    super();
    this.repository = cancelReasonRepository;
  }

  /**
   * Lấy tất cả lý do (dùng cho dropdown)
   */
  async findAllReasons(): Promise<CancelReasonMaster[]> {
    return await this.repository.find({
      order: { id: 'ASC' },
    });
  }
}
