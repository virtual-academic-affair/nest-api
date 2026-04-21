import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export type ComparisonOperator = '>=' | '>' | '<=' | '<' | '===' | '!==';
interface CompareOptions extends ValidationOptions {
  parse?: (value: any) => any;
}

/**
 * Decorator compare field value
 * @param property Target field to compare
 * @param operator Comparison operator
 * @param options (Optional) parse function and error message
 */
export function CompareField<T>(operator: ComparisonOperator, property: keyof T, options?: CompareOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'compareField',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [operator, property, options],
      options: options,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName, op, opts] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];

          if (value === undefined || value === null || relatedValue === undefined || relatedValue === null) {
            return true;
          }

          const val1 = opts?.parse ? opts.parse(value) : value;
          const val2 = opts?.parse ? opts.parse(relatedValue) : relatedValue;

          switch (op) {
            case '>=':
              return val1 >= val2;
            case '>':
              return val1 > val2;
            case '<=':
              return val1 <= val2;
            case '<':
              return val1 < val2;
            case '===':
              return val1 === val2;
            case '!==':
              return val1 !== val2;
            default:
              return false;
          }
        },

        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName, op] = args.constraints;
          const operatorLabels: Record<ComparisonOperator, string> = {
            '>=': 'greater than or equal to',
            '>': 'greater than',
            '<=': 'less than or equal to',
            '<': 'less than',
            '===': 'equal to',
            '!==': 'different from',
          };

          const label = operatorLabels[op as ComparisonOperator];
          return `${args.property} must be ${label} ${String(relatedPropertyName)}`;
        },
      },
    });
  };
}
