import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExecutionGateway } from './execution-gateway';
import { ExecutionEventService } from './execution-event.service';

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('jwt.secret'),
                signOptions: { expiresIn: configService.get<string>('jwt.expiresIn') },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [ExecutionGateway, ExecutionEventService],
    exports: [ExecutionGateway, ExecutionEventService],
})
export class ExecutionWebSocketModule { }