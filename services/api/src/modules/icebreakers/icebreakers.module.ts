import { Module } from '@nestjs/common';
import { IcebreakersController } from './icebreakers.controller';

@Module({ controllers: [IcebreakersController] })
export class IcebreakersModule {}
