import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { CreateAppointmentDto } from '../../application/dtos/create-appointment.dto';
import { UpdateAppointmentDto } from '../../application/dtos/update-appointment.dto';

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60).toString().padStart(2, '0');
  const mm = (total % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

@Injectable()
export class PrismaAppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDate(date: string) {
    return this.prisma.appointment.findMany({
      where: { date, status: { not: 'CANCELADO' } },
      include: { service: true },
      orderBy: { startTime: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: { service: true },
    });
  }

  async getAvailableSlots(date: string, serviceId: string): Promise<string[]> {
    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return [];

    const duration = service.duration; // minutos
    const OPEN = '08:00';
    const CLOSE = '18:00';
    const SLOT_INTERVAL = 30; // gerar slots a cada 30min

    const slots: string[] = [];
    let current = OPEN;

    while (true) {
      const end = addMinutes(current, duration);
      if (end > CLOSE) break;
      slots.push(current);
      current = addMinutes(current, SLOT_INTERVAL);
    }

    return slots;
  }

  async create(dto: CreateAppointmentDto) {
    const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
    if (!service) throw new Error('Serviço não encontrado');

    const endTime = addMinutes(dto.startTime, service.duration);

    return this.prisma.appointment.create({
      data: {
        clientName: dto.clientName,
        clientPhone: dto.clientPhone,
        vehicle: dto.vehicle,
        serviceId: dto.serviceId,
        date: dto.date,
        startTime: dto.startTime,
        endTime,
        notes: dto.notes,
      },
      include: { service: true },
    });
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    return this.prisma.appointment.update({
      where: { id },
      data: dto,
      include: { service: true },
    });
  }

  async remove(id: string) {
    return this.prisma.appointment.delete({ where: { id } });
  }
}
