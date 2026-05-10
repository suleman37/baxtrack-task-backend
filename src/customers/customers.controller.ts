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
import { parsePaginationQuery } from '../common/utils/pagination.util';
import type {
  CreateCustomerPayload,
  CreateCustomerNotePayload,
  CustomerMutationResponse,
  CustomerPaginationQuery,
  PaginatedCustomerNotesResponse,
  PaginatedCustomersResponse,
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
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() request: AuthenticatedRequest,
  ): Promise<PaginatedCustomerNotesResponse> {
    return this.customersService.findNotes(
      id,
      getAccessActorOrThrow(request),
      this.toPaginationQuery(page, limit),
    );
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
    return parsePaginationQuery(page, limit);
  }
}
