import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { PrismaAppointmentsRepository } from './infrastructure/repositories/prisma-appointments.repository';
import { AppointmentsController } from './presentation/controllers/appointments.controller';

@Module({
  imports: [PrismaModule],
  providers: [PrismaAppointmentsRepository],
  controllers: [AppointmentsController],
})
export class AppointmentsModule {}
