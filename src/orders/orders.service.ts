import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { Injectable, OnModuleInit, Logger, HttpStatus } from '@nestjs/common';

import { ChangeOrderStatusDto, CreateOrderDto, OrderPaginationDto } from './dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  
  private readonly logger = new Logger('OrdersService');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  create(createOrderDto: CreateOrderDto) {
    return this.order.create({
      data: createOrderDto
    })
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const { page, limit, status } = orderPaginationDto;
    const totalRecords = await this.order.count({where: {status: status}});
    const lastPage = Math.ceil(totalRecords / limit);
    return {
      data: await this.order.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          status: status
        }
      }),
      meta: {
        total: totalRecords,
        page: page,
        lastPage: lastPage
      }
    }
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({
      where: { id }
    })
    if(!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`
      })
    }
    return order;
  }

  async changeStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;
    const order = await this.findOne(id);
    if(order.status === status) {
      return order;
    }
    return this.order.update({
      where: { id },
      data: { status }
    })
  }
}
