import { join } from 'path';
import { registerAs } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

export default registerAs('grpc', () => ({
  transport: Transport.GRPC as number,
  options: {
    url: process.env.GRPC_URL ?? 'localhost:5000',
    package: process.env.GRPC_PACKAGE,
    protoPath: process.env.GRPC_PROTO_PATH,

    loader: {
      keepCase: true,
      alternateCommentMode: true,
      includeDirs: [join(process.cwd(), 'src/proto'), join(process.cwd(), 'dist/proto')],
    },
  },
}));
