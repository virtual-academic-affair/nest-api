import { join } from 'path';
import { Server } from '@grpc/grpc-js';
import { PackageDefinition } from '@grpc/proto-loader';
import { ReflectionService } from '@grpc/reflection';
import { registerAs } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

export default registerAs('grpc', () => ({
  transport: Transport.GRPC as number,
  options: {
    url: process.env.GRPC_URL ?? 'localhost:5000',
    package: process.env.GRPC_PACKAGE ?? 'app_server',
    protoPath: process.env.GRPC_PROTO_PATH ?? join(process.cwd(), 'src/shared/proto/app_server.proto'),
    onLoadPackageDefinition: (packageDefinition: PackageDefinition, server: Pick<Server, 'addService'>) => {
      new ReflectionService(packageDefinition).addToServer(server);
    },

    loader: {
      keepCase: true,
      alternateCommentMode: true,
      includeDirs: [join(process.cwd(), 'src/shared/proto'), join(process.cwd(), 'dist/shared/proto')],
    },
  },
}));
