import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import {
  CreateCustomerPayload,
  CustomerMutationResponse,
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
  ) {}

  async create(
    customer: CreateCustomerPayload,
    createdById?: number,
  ): Promise<CustomerResponse> {
    this.validateCustomer(customer);

    const assignedUser = await this.usersRepository.findOne({
      where: {
        id: customer.assignedTo,
      },
    });

    if (!assignedUser) {
      throw new NotFoundException('Assigned user not found.');
    }

    await syncPrimaryKeySequence(this.customersRepository);
    const savedCustomer = await this.customersRepository.save(
      this.customersRepository.create({
        name: customer.name.trim(),
        email: customer.email.trim().toLowerCase(),
        phone: customer.phone.trim(),
        createdById: createdById ?? null,
        assignedTo: assignedUser,
      }),
    );

    return this.toCustomerResponse(savedCustomer);
  }

  async findAll(): Promise<CustomerResponse[]> {
    const customers = await this.customersRepository.find({
      where: {
        deletedAt: IsNull(),
      },
      relations: {
        assignedTo: true,
      },
      order: {
        id: 'ASC',
      },
    });

    return customers.map((customer) => this.toCustomerResponse(customer));
  }

  async findOne(id: number): Promise<CustomerResponse> {
    const customer = await this.customersRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
      relations: {
        assignedTo: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return this.toCustomerResponse(customer);
  }

  async softDelete(id: number): Promise<CustomerMutationResponse> {
    const customer = await this.customersRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    await this.customersRepository.softDelete(id);

    return {
      message: 'Customer deleted successfully',
    };
  }

  private validateCustomer(customer: CreateCustomerPayload): void {
    if (
      !customer ||
      typeof customer.name !== 'string' ||
      typeof customer.email !== 'string' ||
      typeof customer.phone !== 'string' ||
      typeof customer.assignedTo !== 'number'
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
  }

  private toCustomerResponse(customer: Customer): CustomerResponse {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      organizationId: customer.organizationId,
      createdById: customer.createdById,
      assignedTo: customer.assignedTo.id,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      deletedAt: customer.deletedAt,
    };
  }
}
