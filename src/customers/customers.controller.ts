import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  type AccessActor,
  resolveCreatorForWrite,
} from '../auth/access-context.util';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrganizationScopeGuard } from '../auth/organization-scope.guard';
import type { UserRole } from '../enums/user-role.enum';
import type {
  CreateCustomerPayload,
  CreateCustomerNotePayload,
  CustomerNote,
  CustomerMutationResponse,
  CustomerResponse,
} from './customer.types';
import { CustomersService } from './customers.service';

type AuthenticatedRequest = Request & {
  user?: {
    id: number;
    organizationId?: number | null;
    role?: UserRole | null;
  };
  organizationScope?: number;
};

@Controller('customers')
@UseGuards(JwtAuthGuard, OrganizationScopeGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@Req() request: AuthenticatedRequest): Promise<CustomerResponse[]> {
    return this.customersService.findAll(this.toAccessActor(request));
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<CustomerResponse> {
    return this.customersService.findOne(id, this.toAccessActor(request));
  }

  @Get(':id/notes')
  findNotes(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<CustomerNote[]> {
    return this.customersService.findNotes(id, this.toAccessActor(request));
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
      resolveCreatorForWrite(this.toAccessActor(request)),
    );
  }

  @Post()
  create(
    @Body() customer: CreateCustomerPayload,
    @Req() request: AuthenticatedRequest,
  ): Promise<CustomerResponse> {
    return this.customersService.create(
      customer,
      resolveCreatorForWrite(this.toAccessActor(request)),
    );
  }

  @Delete(':id')
  softDelete(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<CustomerMutationResponse> {
    return this.customersService.softDelete(id, this.toAccessActor(request));
  }

  private toAccessActor(request: AuthenticatedRequest): AccessActor {
    const u = request.user;
    if (!u) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    return {
      id: u.id,
      organizationId: u.organizationId,
      role: u.role,
      organizationScope: request.organizationScope,
    };
  }
}
