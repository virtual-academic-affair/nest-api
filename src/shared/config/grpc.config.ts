import { registerAs } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

export default registerAs('grpc', () => ({
  transport: Transport.GRPC as number,
  options: {
    url: process.env.GRPC_URL ?? '0.0.0.0:50051',
    package: process.env.GRPC_PACKAGE ?? 'grpc',
    protoPath: process.env.GRPC_PROTO_PATH,
  },
}));
