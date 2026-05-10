import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  getAccessActorOrThrow,
  resolveCreatorForWrite,
} from '../common/auth/access-context.util';
import {
  DEFAULT_CUSTOMERS_LIMIT,
  DEFAULT_CUSTOMERS_PAGE,
  MAX_CUSTOMERS_LIMIT,
} from '../common/constants/pagination.constants';
import type {
  CreateCustomerPayload,
  CreateCustomerNotePayload,
  CustomerNote,
  CustomerMutationResponse,
  PaginatedCustomersResponse,
  CustomerPaginationQuery,
  CustomerResponse,
} from '../types/customers/customer.types';
import type { AuthenticatedRequest } from '../types/http/authenticated-request.types';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<PaginatedCustomersResponse> {
    return this.customersService.findAll(
      getAccessActorOrThrow(request),
      this.toPaginationQuery(page, limit),
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<CustomerResponse> {
    return this.customersService.findOne(id, getAccessActorOrThrow(request));
  }

  @Get(':id/notes')
  findNotes(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<CustomerNote[]> {
    return this.customersService.findNotes(id, getAccessActorOrThrow(request));
  }

  @Post(':id/notes')
  addNote(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: CreateCustomerNotePayload,
    @Req() request: AuthenticatedRequest,
  ): Promise<CustomerResponse> {
    return this.customersService.addNote(
      id,
      payload,
      resolveCreatorForWrite(getAccessActorOrThrow(request)),
    );
  }

  @Post()
  create(
    @Body() customer: CreateCustomerPayload,
    @Req() request: AuthenticatedRequest,
  ): Promise<CustomerResponse> {
    return this.customersService.create(
      customer,
      resolveCreatorForWrite(getAccessActorOrThrow(request)),
    );
  }

  @Delete(':id')
  softDelete(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<CustomerMutationResponse> {
    return this.customersService.softDelete(id, getAccessActorOrThrow(request));
  }

  private toPaginationQuery(
    page?: string,
    limit?: string,
  ): CustomerPaginationQuery {
    return {
      page: this.parsePositiveInteger(page, DEFAULT_CUSTOMERS_PAGE),
      limit: this.parsePositiveInteger(
        limit,
        DEFAULT_CUSTOMERS_LIMIT,
        MAX_CUSTOMERS_LIMIT,
      ),
    };
  }

  private parsePositiveInteger(
    value: string | undefined,
    fallback: number,
    max?: number,
  ): number {
    if (value == null || value.trim().length === 0) {
      return fallback;
    }

    const parsedValue = Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
      return fallback;
    }

    if (max != null && parsedValue > max) {
      return max;
    }

    return parsedValue;
  }
}
