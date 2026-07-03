import { Module } from "@nestjs/common";
import { GetSegmentsUseCase } from "./application/use-cases/get-segments.use-case";
import { SegmentsController } from "./presentation/controllers/segments.controller";

@Module({
  providers: [GetSegmentsUseCase],
  controllers: [SegmentsController],
})
export class SegmentsModule {}
