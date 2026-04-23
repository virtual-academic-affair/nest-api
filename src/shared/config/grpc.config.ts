import { Server } from '@grpc/grpc-js';
import { PackageDefinition } from '@grpc/proto-loader';
import { ReflectionService } from '@grpc/reflection';
import { registerAs } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { dirname, join } from 'path';

export default registerAs('grpc', () => {
  const protoPath = join(process.cwd(), process.env.GRPC_PROTO_PATH || '');

  return {
    transport: Transport.GRPC as number,
    options: {
      url: process.env.GRPC_URL,
      package: process.env.GRPC_PACKAGE,
      protoPath,
      onLoadPackageDefinition: (packageDefinition: PackageDefinition, server: Pick<Server, 'addService'>) => {
        new ReflectionService(packageDefinition).addToServer(server);
      },
      loader: {
        keepCase: true,
        alternateCommentMode: true,
        includeDirs: [dirname(protoPath)],
      },
    },
  };
});
