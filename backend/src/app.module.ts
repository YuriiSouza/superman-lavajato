import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { ServicesModule } from './modules/services/services.module';
import { ServiceOrdersModule } from './modules/service-orders/service-orders.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FinancialModule } from './modules/financial/financial.module';
import { SegmentsModule } from './modules/segments/segments.module';
import { ReactivationModule } from './modules/reactivation/reactivation.module';
import { SettingsModule } from './modules/settings/settings.module';
import { CashModule } from './modules/cash/cash.module';
import { UsersModule } from './modules/users/users.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { StockModule } from './modules/stock/stock.module';
import { BillsModule } from './modules/bills/bills.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    VehiclesModule,
    ServicesModule,
    ServiceOrdersModule,
    DashboardModule,
    FinancialModule,
    SegmentsModule,
    ReactivationModule,
    SettingsModule,
    CashModule,
    UsersModule,
    AppointmentsModule,
    StockModule,
    BillsModule,
  ],
})
export class AppModule {}
