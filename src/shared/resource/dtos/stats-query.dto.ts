import { IsDateString, Validate, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'statsToGteFrom', async: false })
class StatsToGteFromConstraint implements ValidatorConstraintInterface {
  validate(to: string, args: ValidationArguments) {
    const from = (args.object as StatsQueryDto).from;
    if (!from || !to) {
      return true;
    }
    return new Date(to).getTime() >= new Date(from).getTime();
  }

  defaultMessage() {
    return 'to must be >= from';
  }
}

export class StatsQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  @Validate(StatsToGteFromConstraint)
  to: string;
}
