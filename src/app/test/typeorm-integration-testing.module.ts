import { DynamicModule, Provider } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EntitySchema } from 'typeorm';

/** Constructor or EntitySchema, matching Nest `TypeOrmModule.forFeature`. */
export type TypeOrmIntegrationEntity = (new (...args: never[]) => unknown) | EntitySchema;

export function typeOrmIntegrationRootOptions(
  entities: TypeOrmIntegrationEntity[],
  overrides?: Partial<TypeOrmModuleOptions>,
): TypeOrmModuleOptions {
  return {
    url: process.env.DB_URL,
    type: process.env.DB_TYPE as TypeOrmModuleOptions['type'],
    entities,
    synchronize: false,
    ssl: { rejectUnauthorized: false },
    ...overrides,
  } as TypeOrmModuleOptions;
}

/**
 * Minimal Nest + TypeORM module for integration tests against a real DB (same style as AppModule).
 */
export async function compileTypeOrmTestingModule(options: {
  entities: TypeOrmIntegrationEntity[];
  providers: Provider[];
  imports?: DynamicModule[];
}): Promise<TestingModule> {
  const { entities, providers, imports = [] } = options;
  return Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot(typeOrmIntegrationRootOptions(entities)),
      TypeOrmModule.forFeature(entities),
      ...imports,
    ],
    providers,
  }).compile();
}
