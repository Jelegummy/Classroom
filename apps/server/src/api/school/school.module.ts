import { Module } from '@nestjs/common';

import { SchoolPublicController } from './public/public.controller';
import { SchoolPublicService } from './public/public.service';

@Module({
    controllers: [SchoolPublicController],
    providers: [SchoolPublicService],
})
export class SchoolModule { }

//Not used yet
