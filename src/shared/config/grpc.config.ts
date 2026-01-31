import { registerAs } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

export default registerAs('grpc', () => ({
  transport: Transport.GRPC as number,
  options: {
    url: process.env.GRPC_URL ?? 'localhost:50051',
    package: process.env.GRPC_PACKAGE,
    protoPath: process.env.GRPC_PROTO_PATH,
  },
}));
