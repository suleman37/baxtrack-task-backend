import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
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
  create(@Body() customer: CreateCustomerPayload): Promise<CustomerResponse> {
    return this.customersService.create(customer);
  }

  @Delete(':id')
  softDelete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CustomerMutationResponse> {
    return this.customersService.softDelete(id);
  }
}
