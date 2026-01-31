import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistrationItemDetail } from '@class-registration/entities/registration-item-detail.entity';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';
import { ProcessItemDto } from '@class-registration/dtos/registrations/process-item.dto';

@Injectable()
export class RegistrationItemsService {
  constructor(
    @InjectRepository(RegistrationItemDetail)
    private readonly itemDetailRepository: Repository<RegistrationItemDetail>
  ) {}

  /**
   * Xử lý một item (Approve/Reject)
   */
  async processItem(
    id: number,
    dto: ProcessItemDto
  ): Promise<RegistrationItemDetail> {
    const item = await this.itemDetailRepository.findOne({
      where: { id },
    });

    throwIf(!item, new NotFoundException('Registration item not found'));

    // Kiểm tra nếu reject thì phải có lý do
    if (dto.status === RegistrationStatus.REJECTED && !dto.rejectReason) {
      throw new BadRequestException('Reject reason is required');
    }

    item!.status = dto.status;

    if (dto.status === RegistrationStatus.REJECTED) {
      item!.rejectReason = dto.rejectReason;
    }

    return await this.itemDetailRepository.save(item!);
  }

  /**
   * Xử lý nhiều items cùng lúc
   */
  async processBulk(
    ids: number[],
    dto: ProcessItemDto
  ): Promise<RegistrationItemDetail[]> {
    const items = await this.itemDetailRepository.findByIds(ids);

    throwIf(
      items.length !== ids.length,
      new NotFoundException('Some registration items not found')
    );

    // Kiểm tra nếu reject thì phải có lý do
    if (dto.status === RegistrationStatus.REJECTED && !dto.rejectReason) {
      throw new BadRequestException('Reject reason is required for rejection');
    }

    const updatedItems = items.map((item) => {
      item.status = dto.status;

      if (dto.status === RegistrationStatus.REJECTED) {
        item.rejectReason = dto.rejectReason;
      }

      return item;
    });

    return await this.itemDetailRepository.save(updatedItems);
  }

  /**
   * Lấy tất cả items của một registration
   */
  async findByRegistrationId(
    classRegistrationId: number
  ): Promise<RegistrationItemDetail[]> {
    return await this.itemDetailRepository.find({
      where: { classRegistrationId },
      order: { id: 'ASC' },
    });
  }

  /**
   * Lấy thông tin một item
   */
  async findOne(id: number): Promise<RegistrationItemDetail> {
    const item = await this.itemDetailRepository.findOne({
      where: { id },
      relations: ['classRegistration'],
    });

    throwIf(!item, new NotFoundException('Registration item not found'));
    return item!;
  }
}
