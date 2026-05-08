import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type {
  CreateCustomerPayload,
  CustomerMutationResponse,
  CustomerResponse,
} from './customer.types';
import { CustomersService } from './customers.service';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(): Promise<CustomerResponse[]> {
    return this.customersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CustomerResponse> {
    return this.customersService.findOne(id);
  }

  @Post()
  create(
    @Body() customer: CreateCustomerPayload,
    @Req() request: Request & { user?: { id: number } },
  ): Promise<CustomerResponse> {
    return this.customersService.create(customer, request.user?.id);
  }

  @Delete(':id')
  softDelete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CustomerMutationResponse> {
    return this.customersService.softDelete(id);
  }
}
