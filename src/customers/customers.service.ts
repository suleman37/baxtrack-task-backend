import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import {
  type AccessActor,
  resolveCustomerOrganizationKey,
} from '../auth/access-context.util';
import { LogsService } from '../logs/logs.service';
import { User } from '../users/user.entity';
import {
  CreateCustomerPayload,
  CreateCustomerNotePayload,
  CustomerMutationResponse,
  CustomerNote,
  CustomerResponse,
} from './customer.types';
import { Customer } from './customer.entity';
import { syncPrimaryKeySequence } from '../database/sync-primary-key-sequence';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly logsService: LogsService,
  ) {}

  async create(customer: CreateCustomerPayload, creator: AccessActor): Promise<CustomerResponse> {
    this.validateCustomer(customer);

    const assignedUser = await this.resolveAssignedUser(customer.assignedTo);

    if (!assignedUser) {
      throw new NotFoundException('Assigned user not found.');
    }

    const orgKey = resolveCustomerOrganizationKey(creator);
    this.assertUserInOrganization(assignedUser, orgKey, creator);

    await syncPrimaryKeySequence(this.customersRepository);
    const savedCustomer = await this.customersRepository.save(
      this.customersRepository.create({
        name: customer.name.trim(),
        email: customer.email.trim().toLowerCase(),
        phone: customer.phone.trim(),
        organizationId: creator.organizationId ?? creator.id,
        createdById: creator.id,
        status: 'active',
        assignedTo: assignedUser,
      }),
    );

    await this.logsService.recordAction({
      action: 'create_customer',
      actorId: creator.id,
      userId: creator.id,
      organizationId: creator.organizationId ?? creator.id,
      details: `Created customer ${savedCustomer.name} and assigned it to ${assignedUser.name}.`,
    });

    return this.toCustomerResponse(savedCustomer);
  }

  async findAll(actor: AccessActor): Promise<CustomerResponse[]> {
    const qb = this.customersRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.assignedTo', 'assignedTo');

    const orgKey = resolveCustomerOrganizationKey(actor);
    if (orgKey != null) {
      qb.andWhere('customer.organizationId = :orgId', { orgId: orgKey });
    }

    const customers = await qb.orderBy('customer.id', 'ASC').getMany();

    return customers.map((customer) => this.toCustomerResponse(customer));
  }

  async findOne(id: number, actor: AccessActor): Promise<CustomerResponse> {
    const customer = await this.customersRepository.findOne({
      where: {
        id,
        status: 'active',
      },
      relations: {
        assignedTo: true,
      },
    });

    if (!customer || !this.canAccessCustomer(actor, customer)) {
      throw new NotFoundException('Customer not found.');
    }

    return this.toCustomerResponse(customer);
  }

  async findNotes(id: number, actor: AccessActor): Promise<CustomerNote[]> {
    const customer = await this.customersRepository.findOne({
      where: {
        id,
        status: 'active',
      },
    });

    if (!customer || !this.canAccessCustomer(actor, customer)) {
      throw new NotFoundException('Customer not found.');
    }

    return this.getCustomerNotes(customer);
  }

  async addNote(
    id: number,
    payload: CreateCustomerNotePayload,
    actor: AccessActor,
  ): Promise<CustomerResponse> {
    this.validateCustomerNotePayload(payload);

    const customer = await this.customersRepository.findOne({
      where: {
        id,
        status: 'active',
      },
      relations: {
        assignedTo: true,
      },
    });

    if (!customer || !this.canAccessCustomer(actor, customer)) {
      throw new NotFoundException('Customer not found.');
    }

    const note: CustomerNote = {
      createdById: actor.id,
      organizationId: actor.organizationId ?? actor.id,
      customerId: customer.id,
      notes: payload.notes.trim(),
    };

    customer.notes = [...this.getCustomerNotes(customer), note];
    const updatedCustomer = await this.customersRepository.save(customer);

    await this.logsService.recordAction({
      action: 'add_customer_note',
      actorId: actor.id,
      userId: actor.id,
      organizationId: customer.organizationId,
      details: `Added note for customer ${customer.name}.`,
    });

    return this.toCustomerResponse(updatedCustomer);
  }

  async softDelete(id: number, actor: AccessActor): Promise<CustomerMutationResponse> {
    const customer = await this.customersRepository.findOne({
      where: {
        id,
      },
    });

    if (!customer || !this.canAccessCustomer(actor, customer)) {
      throw new NotFoundException('Customer not found.');
    }

    customer.status = customer.status === 'deleted' ? 'active' : 'deleted';
    await this.customersRepository.save(customer);

    await this.logsService.recordAction({
      action:
        customer.status === 'deleted' ? 'delete_customer' : 'restore_customer',
      actorId: actor.id,
      userId: actor.id,
      organizationId: customer.organizationId,
      details: `${customer.status === 'deleted' ? 'Deleted' : 'Restored'} customer ${customer.name}.`,
    });

    return {
      message:
        customer.status === 'deleted'
          ? 'Customer deleted successfully'
          : 'Customer restored successfully',
    };
  }

  private canAccessCustomer(actor: AccessActor, customer: Customer): boolean {
    if (actor.role === 'super_admin' && actor.organizationScope == null) {
      return true;
    }

    const orgKey = resolveCustomerOrganizationKey(actor);
    return customer.organizationId === orgKey;
  }

  private assertUserInOrganization(
    assignedUser: User,
    orgKey: number | null,
    creator?: AccessActor,
  ): void {
    if (creator?.role === 'super_admin' && creator.organizationScope == null) {
      return;
    }

    if (orgKey == null) {
      return;
    }

    const inOrg =
      assignedUser.id === orgKey || assignedUser.organizationId === orgKey;
    if (!inOrg) {
      throw new BadRequestException(
        'Assigned user does not belong to this organization.',
      );
    }
  }

  private validateCustomer(customer: CreateCustomerPayload): void {
    if (
      !customer ||
      typeof customer.name !== 'string' ||
      typeof customer.email !== 'string' ||
      typeof customer.phone !== 'string' ||
      (typeof customer.assignedTo !== 'number' &&
        typeof customer.assignedTo !== 'string')
    ) {
      throw new BadRequestException('Invalid customer payload.');
    }

    if (
      customer.name.trim().length === 0 ||
      customer.email.trim().length === 0 ||
      customer.phone.trim().length === 0
    ) {
      throw new BadRequestException('Name, email, and phone are required.');
    }

    if (!customer.email.includes('@')) {
      throw new BadRequestException('A valid email is required.');
    }

    if (
      typeof customer.assignedTo === 'string' &&
      customer.assignedTo.trim().length === 0
    ) {
      throw new BadRequestException('Assigned user is required.');
    }
  }

  private validateCustomerNotePayload(payload: CreateCustomerNotePayload): void {
    if (!payload || typeof payload.notes !== 'string') {
      throw new BadRequestException('Invalid customer note payload.');
    }

    if (payload.notes.trim().length === 0) {
      throw new BadRequestException('Note is required.');
    }
  }

  private getCustomerNotes(customer: Customer): CustomerNote[] {
    return Array.isArray(customer.notes) ? customer.notes : [];
  }

  private async resolveAssignedUser(
    assignedTo: CreateCustomerPayload['assignedTo'],
  ): Promise<User | null> {
    if (typeof assignedTo === 'number') {
      return this.usersRepository.findOne({
        where: {
          id: assignedTo,
        },
      });
    }

    const assignedToValue = assignedTo.trim();

    if (assignedToValue.length === 0) {
      return null;
    }

    const numericId = Number(assignedToValue);

    if (Number.isInteger(numericId) && numericId > 0) {
      const userById = await this.usersRepository.findOne({
        where: {
          id: numericId,
        },
      });

      if (userById) {
        return userById;
      }
    }

    const normalizedValue = assignedToValue.toLowerCase();

    return this.usersRepository
      .createQueryBuilder('user')
      .where(
        new Brackets((query) => {
          query
            .where('LOWER(TRIM(user.email)) = :value', {
              value: normalizedValue,
            })
            .orWhere('LOWER(TRIM(user.name)) = :value', {
              value: normalizedValue,
            });
        }),
      )
      .orderBy(
        `CASE
          WHEN LOWER(TRIM(user.email)) = :value THEN 0
          WHEN LOWER(TRIM(user.name)) = :value THEN 1
          ELSE 2
        END`,
        'ASC',
      )
      .getOne();
  }

  private toCustomerResponse(customer: Customer): CustomerResponse {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      organizationId: customer.organizationId,
      createdById: customer.createdById,
      notes: this.getCustomerNotes(customer),
      status: customer.status,
      assignedTo: customer.assignedTo.id,
      assignedToName: customer.assignedTo.name,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}
