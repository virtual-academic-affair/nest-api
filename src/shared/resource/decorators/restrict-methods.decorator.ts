import { SetMetadata } from '@nestjs/common';
import { ResourceAction } from '@shared/resource/enums/resource-action.enum';

export const RESTRICT_METHODS_KEY = 'restrictMethods';

export interface RestrictMethodsOptions {
  only?: ResourceAction[];
  except?: ResourceAction[];
}

export const RestrictMethods = (options: RestrictMethodsOptions) => SetMetadata(RESTRICT_METHODS_KEY, options);
